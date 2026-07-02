import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { apiFetch } from "@/api/client";
import { useLocation } from "wouter";

export default function NewArticle() {
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave(publish = false) {
    try {
      setLoading(true);

      const res = await apiFetch("/api/v1/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          content,
          published: publish,
        }),
      });

      if (!res?.id) throw new Error("Save failed");

      setLocation("/admin");
    } catch (e) {
      console.error(e);
      alert("Failed to save article");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif mb-6">New Article</h1>

        <input
          className="w-full border p-3 mb-4"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          className="w-full border p-3 mb-6"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General</option>
          <option value="tax">Tax</option>
          <option value="grants">Grants</option>
          <option value="regulation">Regulation</option>
          <option value="market-entry">Market Entry</option>
        </select>

        <div className="border p-3 mb-6 rounded">
          <TipTapEditor value={content} onChange={setContent} />
        </div>

        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={() => handleSave(false)}
            className="px-4 py-2 border"
          >
            Save Draft
          </button>

          <button
            disabled={loading}
            onClick={() => handleSave(true)}
            className="px-4 py-2 bg-black text-white"
          >
            Publish
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}
