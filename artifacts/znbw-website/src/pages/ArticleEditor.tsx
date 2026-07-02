import TipTapEditor from "../components/editor/TipTapEditor";
import { useState } from "react";
import { apiFetch } from "@/api/client";

export default function ArticleEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

async function handleSave() {
  try {
    setSaving(true);

    const token = localStorage.getItem("admin_token");

    if (!token) {
      alert("Not logged in as admin");
      return;
    }

    const res = await apiFetch("/api/v1/admin/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        excerpt: content.replace(/<[^>]*>/g, "").slice(0, 150),
        content,
        category: "general",
        author: "admin",
        published: false,
      }),
    });

    console.log("Saved article:", res);
    alert("Article saved");
  } catch (err) {
    console.error("Save failed:", err);
    alert("Save failed (check console)");
  } finally {
    setSaving(false);
  }
}

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>New Article</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <TipTapEditor value={content} onChange={setContent} />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "black",
          color: "white",
        }}
      >
        {saving ? "Saving..." : "Save Article"}
      </button>
    </div>
  );
}
