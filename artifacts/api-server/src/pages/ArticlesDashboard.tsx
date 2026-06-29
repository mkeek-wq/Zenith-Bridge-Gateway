import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

export default function ArticlesDashboard() {
  const [articles, setArticles] = useState<any[]>([]);
  const navigate = useNavigate();

  async function load() {
    const res = await fetch(`${API}/api/v1/articles`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    setArticles(data);
  }

  async function remove(id: number) {
    await fetch(`${API}/api/v1/articles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Articles Dashboard</h1>

      <button onClick={() => navigate("/editor")}>
        + New Article
      </button>

      <ul>
        {articles.map((a) => (
          <li key={a.id} style={{ margin: "10px 0" }}>
            <b>{a.title}</b> — {a.status}

            <div>
              <button onClick={() => navigate(`/editor?id=${a.id}`)}>
                Edit
              </button>

              <button onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
