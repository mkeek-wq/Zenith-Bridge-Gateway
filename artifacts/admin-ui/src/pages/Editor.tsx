import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

import { api } from "../lib/api";

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("general");
  const [country, setCountry] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);

  const [primaryCountry, setPrimaryCountry] = useState("");
  const [secondaryCountries, setSecondaryCountries] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [secondaryCategories, setSecondaryCategories] = useState("");
  const [sectorTags, setSectorTags] = useState("");
  const [businessTopics, setBusinessTopics] = useState("");
  const [workforceAttributes, setWorkforceAttributes] = useState("");
  const [infrastructureAttributes, setInfrastructureAttributes] = useState("");
  const [incentiveTypes, setIncentiveTypes] = useState("");
  const [institutions, setInstitutions] = useState("");
  const [strategicRisks, setStrategicRisks] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [message, setMessage] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: "<p>Start writing...</p>",
  });

  useEffect(() => {
    if (!isEditMode || !id || !editor) return;

    async function load() {
      try {
        const res = await api.get(`/articles/admin/${id}`);
        const article = res.data;

        setTitle(article.title || "");
        setExcerpt(article.excerpt || "");
        setCategory(article.category || "general");
        setCountry(article.country || "");
        setCoverImage(article.coverImage || "");
        setPublished(Boolean(article.published));
        setFeatured(Boolean(article.featured));

        setPrimaryCountry(article.primaryCountry || "");
        setSecondaryCountries(article.secondaryCountries || "");
        setPrimaryCategory(article.primaryCategory || "");
        setSecondaryCategories(article.secondaryCategories || "");
        setSectorTags(article.sectorTags || "");
        setBusinessTopics(article.businessTopics || "");
        setWorkforceAttributes(article.workforceAttributes || "");
        setInfrastructureAttributes(article.infrastructureAttributes || "");
        setIncentiveTypes(article.incentiveTypes || "");
        setInstitutions(article.institutions || "");
        setStrategicRisks(article.strategicRisks || "");

        if (article.content) {
          try {
            const parsed =
              typeof article.content === "string"
                ? JSON.parse(article.content)
                : article.content;

            editor.commands.setContent(parsed?.json || parsed?.html || parsed);
          } catch {
            editor.commands.setContent(article.content);
          }
        }
      } catch {
        setMessage("Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, editor, isEditMode]);

  function addLink() {
    if (!editor) return;

    const url = prompt("Enter URL");
    if (!url) return;

    editor.chain().focus().setLink({ href: url }).run();
  }

  async function uploadFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,image/gif";

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }

        try {
          setUploading(true);
          setMessage("");

          const formData = new FormData();
          formData.append("file", file);

          const res = await api.post("/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          const url = res.data?.url;

          if (!url) {
            throw new Error("Upload did not return an image URL");
          }

          resolve(url);
        } catch (err) {
          reject(err);
        } finally {
          setUploading(false);
        }
      };

      input.click();
    });
  }

  async function addImage() {
    if (!editor || uploading) return;

    try {
      const url = await uploadFile();
      editor.chain().focus().setImage({ src: url }).run();
      setMessage("Image uploaded ✔");
    } catch (err: any) {
      setMessage(err?.message || "Image upload failed");
    }
  }

  async function uploadCoverImage() {
    if (uploading) return;

    try {
      const url = await uploadFile();
      const relativeUrl = new URL(url).pathname;

      setCoverImage(relativeUrl);
      setMessage("Cover image uploaded ✔");
    } catch (err: any) {
      setMessage(err?.message || "Cover image upload failed");
    }
  }

  const save = useCallback(
    async (returnToDashboard = false) => {
      if (!editor || saving) return;

      setSaving(true);
      setMessage("");

      try {
        const html = editor.getHTML();
        const json = editor.getJSON();
        const fallbackExcerpt = html.replace(/<[^>]*>/g, "").slice(0, 160);

        const payload = {
          title,
          html,
          content: json,
          category,
          country,
          coverImage,
          author: "admin",
          excerpt: excerpt.trim() || fallbackExcerpt,
          published,
          featured,

          primaryCountry,
          secondaryCountries,
          primaryCategory,
          secondaryCategories,
          sectorTags,
          businessTopics,
          workforceAttributes,
          infrastructureAttributes,
          incentiveTypes,
          institutions,
          strategicRisks,
        };

        if (isEditMode) {
          await api.patch(`/articles/${id}`, payload);
          setMessage("Updated ✔");
        } else {
          await api.post("/articles", payload);
          setMessage("Created ✔");
        }

        if (returnToDashboard || !isEditMode) {
          navigate("/dashboard");
        }
      } catch (err: any) {
        setMessage(err?.response?.data?.error || err?.message || "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [
      editor,
      saving,
      title,
      excerpt,
      category,
      country,
      coverImage,
      published,
      featured,
      primaryCountry,
      secondaryCountries,
      primaryCategory,
      secondaryCategories,
      sectorTags,
      businessTopics,
      workforceAttributes,
      infrastructureAttributes,
      incentiveTypes,
      institutions,
      strategicRisks,
      isEditMode,
      id,
      navigate,
    ],
  );

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(false);
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  if (!editor) return null;
  if (loading) return <p>Loading article...</p>;

  const inputStyle = {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "12px 14px",
    color: "var(--text-h)",
    background: "var(--bg)",
  };

  const panelStyle = {
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 18,
    background: "var(--surface, var(--bg))",
  };

  const metadataFieldStyle = {
    ...inputStyle,
    minHeight: 54,
    lineHeight: 1.5,
    resize: "vertical" as const,
    fontSize: 13,
  };

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-kicker">Editor</p>
          <h1>{isEditMode ? "Edit Article" : "New Article"}</h1>
          <p className="cms-muted">Compose, structure, and publish editorial content.</p>
        </div>

        <button
          type="button"
          className="cms-primary-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title..."
          style={{
            ...inputStyle,
            padding: "20px 22px",
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        />

        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt / article summary..."
          style={{
            ...inputStyle,
            minHeight: 92,
            lineHeight: 1.6,
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)",
          gap: 18,
          marginTop: 18,
          alignItems: "start",
        }}
      >
        <section style={panelStyle}>
          <p className="cms-kicker">Article Settings</p>

          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="cms-muted">Category / Topic</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category / topic"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="cms-muted">Country</span>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Singapore, ASEAN, Global..."
                style={inputStyle}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 4,
              }}
            >
              <label
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Published
              </label>

              <label
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured
              </label>
            </div>
          </div>
        </section>

        <aside style={panelStyle}>
          <p className="cms-kicker">Cover Image</p>

          <div
            style={{
              marginTop: 12,
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              aspectRatio: "16 / 10",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08))",
              display: "grid",
              placeItems: "center",
            }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <span className="cms-muted">No cover image yet</span>
            )}
          </div>

          <button
            type="button"
            onClick={uploadCoverImage}
            disabled={uploading}
            className="cms-primary-button"
            style={{ width: "100%", marginTop: 14 }}
          >
            {uploading ? "Uploading..." : coverImage ? "Replace Cover" : "Upload Cover"}
          </button>

          <input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="/uploads/images/example.png"
            style={{
              ...inputStyle,
              marginTop: 12,
              fontSize: 13,
            }}
          />
        </aside>
      </div>

      <section style={{ ...panelStyle, marginTop: 18 }}>
        <p className="cms-kicker">Metadata Override Layer</p>
        <p className="cms-muted" style={{ marginTop: 6 }}>
          Auto-filled by classification. Manually adjust only when needed. Use comma-separated values.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Primary Country</span>
            <input value={primaryCountry} onChange={(e) => setPrimaryCountry(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Secondary Countries</span>
            <textarea value={secondaryCountries} onChange={(e) => setSecondaryCountries(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Primary Category</span>
            <input value={primaryCategory} onChange={(e) => setPrimaryCategory(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Secondary Categories</span>
            <textarea value={secondaryCategories} onChange={(e) => setSecondaryCategories(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Sector Tags</span>
            <textarea value={sectorTags} onChange={(e) => setSectorTags(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Business Topics</span>
            <textarea value={businessTopics} onChange={(e) => setBusinessTopics(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Workforce Attributes</span>
            <textarea value={workforceAttributes} onChange={(e) => setWorkforceAttributes(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Infrastructure Attributes</span>
            <textarea value={infrastructureAttributes} onChange={(e) => setInfrastructureAttributes(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Incentive Types</span>
            <textarea value={incentiveTypes} onChange={(e) => setIncentiveTypes(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="cms-muted">Institutions</span>
            <textarea value={institutions} onChange={(e) => setInstitutions(e.target.value)} style={metadataFieldStyle} />
          </label>

          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span className="cms-muted">Strategic Risks</span>
            <textarea value={strategicRisks} onChange={(e) => setStrategicRisks(e.target.value)} style={metadataFieldStyle} />
          </label>
        </div>
      </section>

      <div style={{ marginTop: 22 }}>
        <div className="cms-toolbar">
          <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}>
            Paragraph
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>
            Bold
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
            Italic
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}>
            Underline
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}>
            Strike
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            H1
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            Bullet List
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            Numbered List
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            Quote
          </button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            Divider
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            Code
          </button>
          <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            Clear
          </button>
          <button type="button" onClick={() => editor.chain().focus().undo().run()}>
            Undo
          </button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()}>
            Redo
          </button>
          <button type="button" onClick={addLink}>
            Link
          </button>
          <button type="button" onClick={addImage} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Image"}
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`
                  <div class="znbw-transparency-snapshot">
                    <p class="znbw-transparency-title">ZNBW Transparency Snapshot</p>
                    <div class="znbw-transparency-bubbles">
                      <div class="znbw-transparency-bubble">
                        <strong>Confidence</strong>
                        <span>High</span>
                      </div>
                      <div class="znbw-transparency-bubble">
                        <strong>Evidence</strong>
                        <span>8 cases · 32 signals</span>
                      </div>
                      <div class="znbw-transparency-bubble">
                        <strong>Coverage</strong>
                        <span>2 verified datasets</span>
                      </div>
                      <div class="znbw-transparency-bubble">
                        <strong>Limitation</strong>
                        <span>Proxy indicator used</span>
                      </div>
                    </div>
                  </div>
                `)
                .run()
            }
          >
            Insert Transparency
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent(`
                  <div class="znbw-graph-observations">
                    <strong>Key Observations</strong>
                    <ul>
                      <li>Replace with the first graph observation.</li>
                      <li>Replace with the second graph observation.</li>
                      <li>Replace with the third graph observation.</li>
                    </ul>
                  </div>
                `)
                .run()
            }
          >
            Insert Observations
          </button>
        </div>

        <div className="cms-editor-shell">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="cms-primary-button"
          >
            {saving ? "Saving..." : isEditMode ? "Save" : "Create"}
          </button>

          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="cms-primary-button"
            style={{ background: "var(--text-h)" }}
          >
            Save & Close
          </button>
        </div>

        {message && <span className="cms-muted">{message}</span>}
      </div>
    </div>
  );
}
