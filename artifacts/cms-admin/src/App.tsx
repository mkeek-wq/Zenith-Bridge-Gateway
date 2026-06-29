import { useEffect, useState } from "react";
import ArticleEdit from "./pages/ArticleEdit";
import "./App.css";

/**
 * SINGLE SOURCE ARTICLE TYPE (minimal + safe)
 */
type Article = {
  id: string;
  title: string;
  content: string;
};

/**
 * API BASE
 * (uses nginx proxy in production)
 */
const API = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * API LAYER (isolated, no backend coupling leaks)
 */
const api = {
  getArticles: async (): Promise<Article[]> => {
    const res = await fetch(`${API}/articles`);
    if (!res.ok) throw new Error("Failed to load articles");
    return res.json();
  },

  getArticle: async (id: string): Promise<Article> => {
    const res = await fetch(`${API}/articles/${id}`);
    if (!res.ok) throw new Error("Failed to load article");
    return res.json();
  },

  updateArticle: async (id: string, data: Partial<Article>) => {
    const res = await fetch(`${API}/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to save article");
  },
};

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);

  /**
   * LOAD ARTICLE LIST
   */
  useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        const data = await api.getArticles();
        setArticles(data);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  /**
   * LOAD SINGLE ARTICLE
   */
  useEffect(() => {
    if (!selectedId) return;

    (async () => {
      try {
        setLoadingArticle(true);
        const data = await api.getArticle(selectedId);
        setSelectedArticle(data);
      } finally {
        setLoadingArticle(false);
      }
    })();
  }, [selectedId]);

  /**
   * EDITOR VIEW
   */
  if (selectedArticle) {
    return (
      <div style={{ padding: 20 }}>
        <button
          onClick={() => {
            setSelectedArticle(null);
            setSelectedId(null);
          }}
          style={{ marginBottom: 10 }}
        >
          ← Back
        </button>

        {loadingArticle ? (
          <p>Loading article...</p>
        ) : (
          <ArticleEdit article={selectedArticle} />
        )}
      </div>
    );
  }

  /**
   * LIST VIEW
   */
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          width: 300,
          borderRight: "1px solid #ddd",
          padding: 16,
          overflowY: "auto",
        }}
      >
        <h2>Zenith CMS</h2>

        {loadingList ? (
          <p>Loading articles...</p>
        ) : (
          articles.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              style={{
                padding: 10,
                marginBottom: 10,
                border: "1px solid #eee",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <strong>{a.title}</strong>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                ID: {a.id}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 20 }}>
        <h1>Admin Dashboard</h1>
        <p>Select an article to edit</p>
      </div>
    </div>
  );
}
