import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

const API_URL = "http://localhost:8080";

export default function Editor() {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing...</p>",
  });

  async function saveArticle() {
    if (!editor) return;

    setMessage("Saving...");

    const json = editor.getJSON();
    const html = editor.getHTML();

    const res = await fetch(`${API_URL}/api/v1/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        title,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        content: json,
        html,
        status,
      }),
    });

    if (!res.ok) {
      setMessage("❌ Failed to save");
      return;
    }

    setMessage("✅ Article saved");
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h2>New Article</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ marginBottom: 10 }}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>

      <div style={{ border: "1px solid #ccc", padding: 10 }}>
        <EditorContent editor={editor} />
      </div>

      <button onClick={saveArticle} style={{ marginTop: 10 }}>
        Save Article
      </button>

      <p>{message}</p>
    </div>
  );
}
