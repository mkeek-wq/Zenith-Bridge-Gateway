import { useEffect, useState } from "react";
import type { Article } from "../types/article";

type Props = {
  article: Article | null;
  articleId: string | null;
};

export default function Editor({ article, articleId }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [content, setContent] = useState("");

  /**
   * LOAD ARTICLE
   */
  useEffect(() => {
    if (!article) return;

    setTitle(article.title || "");
    setStatus(article.status || "draft");
    setContent(article.html || "");
  }, [article]);

  /**
   * SAVE (TEMP SAFE VERSION)
   */
  async function save() {
    const payload = {
      title,
      status,
      html: content,
      content,
    };

    const url = articleId
      ? `/api/v1/articles/${articleId}`
      : `/api/v1/articles`;

    await fetch(url, {
      method: articleId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    alert("Saved");
  }

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        style={{ width: "100%" }}
      />

      <button onClick={save}>Save</button>
    </div>
  );
}
