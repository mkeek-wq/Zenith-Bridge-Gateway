import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "../components/Editor";
import type { Article } from "../types/article";


export default function ArticleEdit() {
  const [searchParams] = useSearchParams();

  const id = searchParams.get("id"); // string | null

  const [article, setArticle] = useState<Article | null>(null);

  async function loadArticle() {
    if (!id) return;

    const res = await fetch(`/api/v1/articles/${id}`);
    const data = await res.json();

    setArticle(data);
  }

  useEffect(() => {
    loadArticle();
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Article Editor</h1>

      <Editor
        article={article}
        articleId={id}
      />
    </div>
  );
}
