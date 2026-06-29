import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "../components/Editor";
import { api } from "../lib/api";

type Article = {
  id: number;
  title?: string;
  content?: any;
};

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadArticle() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/articles/${id}`);
      setArticle(res.data);
    } catch (err) {
      setError("Failed to load article");
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticle();
  }, [id]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Zenith CMS Editor</h1>

      {loading && <p>Loading article...</p>}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && (
        <Editor article={article} articleId={id} />
      )}
    </div>
  );
}
