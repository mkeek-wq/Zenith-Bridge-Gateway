import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/articles");
        const data = res?.data;

        if (!mounted) return;

        if (Array.isArray(data)) {
          setArticles(data);
        } else if (Array.isArray(data?.data)) {
          setArticles(data.data);
        } else {
          setArticles([]);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load articles");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1>Zenith CMS Dashboard</h1>

      {/* NEW ARTICLE */}
      <button
        type="button"
        onClick={() => navigate("/admin/editor")}
        style={{ marginBottom: 20 }}
      >
        + New Article
      </button>

      {loading && <p>Loading...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div>
          {articles.length === 0 && <p>No articles yet.</p>}

          {articles.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
              }}
            >
              <h3>{a.title}</h3>
              <p>{a.category}</p>
              <small>ID: {a.id}</small>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/editor/${a.id}`)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
