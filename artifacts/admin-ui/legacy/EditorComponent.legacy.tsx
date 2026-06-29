import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Props = {
  article: any;
  articleId: string | null;
};

export default function Editor({ article, articleId }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");

  /**
   * IMAGE UPLOAD (CMS PIPELINE)
   */
  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  }

  /**
   * TIPTAP EDITOR
   */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "cms-image",
        },
      }),
    ],

    content: "<p>Loading...</p>",

    editorProps: {
      handleDrop: (_view, event) => {
  const files = event.dataTransfer?.files;

  if (!files || files.length === 0) return false;

  const file = files[0];

  if (!file.type.startsWith("image/")) return false;

  uploadImage(file).then((url) => {
    editor?.chain().focus().setImage({ src: url }).run();
  });

  return true;
},

handlePaste: (_view, event) => {
  const items = event.clipboardData?.items;

  if (!items) return false;

  for (const item of items) {
    if (item.type.startsWith("image")) {
      const file = item.getAsFile();
      if (!file) return false;

      uploadImage(file).then((url) => {
        editor?.chain().focus().setImage({ src: url }).run();
      });

      return true;
    }
  }

  return false;
},
    },
  });

  /**
   * LOAD ARTICLE INTO EDITOR
   */
  useEffect(() => {
    if (!article || !editor) return;

    setTitle(article.title || "");
    setStatus(article.status || "draft");

    editor.commands.setContent(article.html || "<p></p>");
  }, [article, editor]);

  /**
   * SAVE ARTICLE
   */
  async function saveArticle() {
    if (!editor) return;

    try {
      setMessage("Saving...");

      const html = editor.getHTML();
      const json = editor.getJSON();

      const payload = {
        title,
        status,
        html,
        content: json,
      };

      const res = articleId
        ? await api.patch(`/articles/${articleId}`, payload)
        : await api.post("/articles", payload);

      if (res.status >= 200 && res.status < 300) {
        setMessage("✅ Saved");
      } else {
        setMessage("❌ Save failed");
      }
    } catch (err) {
      setMessage("❌ Save failed");
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
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
        Save
      </button>

      <p>{message}</p>
    </div>
  );
}
