import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Article = {
  id: number;
  title: string;
  category?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function ArticlesDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/articles");
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(article: Article) {
    if (!confirm(`Delete "${article.title}"?\nThis cannot be undone.`)) return;

    try {
      await api.delete(`/articles/${article.id}`);
      await loadArticles();
    } catch {
      setError("Failed to delete article");
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesQuery = article.title
        .toLowerCase()
        .includes(query.toLowerCase().trim());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && article.published) ||
        (statusFilter === "draft" && !article.published);

      return matchesQuery && matchesStatus;
    });
  }, [articles, query, statusFilter]);

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-kicker">Content</p>
          <h1>Articles</h1>
          <p className="cms-muted">Manage CMS articles.</p>
        </div>

        <button className="cms-primary-button" onClick={() => navigate("/editor")}>
          + New Article
        </button>
      </div>

      <div className="cms-stats-grid">
        <div className="cms-stat-card">
          <span>Total articles</span>
          <strong>{articles.length}</strong>
        </div>

        <div className="cms-stat-card">
          <span>Published</span>
          <strong>{articles.filter((a) => a.published).length}</strong>
        </div>

        <div className="cms-stat-card">
          <span>Drafts</span>
          <strong>{articles.filter((a) => !a.published).length}</strong>
        </div>
      </div>

      <div className="cms-card cms-filter-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All articles</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>
      </div>

      {loading && <div className="cms-card">Loading articles...</div>}
      {error && <div className="cms-error">{error}</div>}

      {!loading && !error && filteredArticles.length === 0 && (
        <div className="cms-card">
          <h2>No articles found</h2>
          <p className="cms-muted">Try a different search or filter.</p>
        </div>
      )}

      {!loading && !error && filteredArticles.length > 0 && (
        <div className="cms-table-card">
          <table className="cms-table cms-articles-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredArticles.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/editor/${a.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="cms-title-cell">
                    <span title={a.title}>{a.title}</span>
                  </td>

                  <td>
                    <span className={a.published ? "cms-badge published" : "cms-badge draft"}>
                      {a.published ? "Published" : "Draft"}
                    </span>
                  </td>

                  <td className="cms-nowrap">{a.category || "general"}</td>
                  <td className="cms-nowrap">{formatDate(a.updatedAt || a.createdAt)}</td>

                  <td>
                    <div className="cms-actions-row">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editor/${a.id}`);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArticle(a);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
