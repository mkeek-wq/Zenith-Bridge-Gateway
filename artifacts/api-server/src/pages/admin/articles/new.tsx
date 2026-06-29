import { useState } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { apiFetch } from "@/api/client";

export default function AdminArticleNew() {
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);

    try {
      await apiFetch("/api/v1/admin/articles", {
        method: "POST",
        body: JSON.stringify({
          title,
          country,
          category,
          content,
        }),
      });

      setLocation("/admin");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save article");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-4">

        <h1 className="text-2xl font-bold">New Article</h1>

        {/* Title */}
        <input
          className="w-full border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Country */}
        <input
          className="w-full border p-2"
          placeholder="Country (e.g. Singapore)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

        {/* Category */}
        <input
          className="w-full border p-2"
          placeholder="Category (tax, grants, etc.)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* Editor */}
        <TipTapEditor value={content} onChange={setContent} />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-black text-white px-4 py-2"
        >
          {loading ? "Saving..." : "Save Article"}
        </button>
      </div>
    </PublicLayout>
  );
}
