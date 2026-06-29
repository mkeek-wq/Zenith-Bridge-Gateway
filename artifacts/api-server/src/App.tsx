const [preview, setPreview] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [promoting, setPromoting] = useState(false);
const [promoteResult, setPromoteResult] = useState<string | null>(null);

useEffect(() => {
  async function loadPreview() {
    setLoading(true);
    const res = await fetch(`/api/admin/intelligence-preview/${candidateId}`);
    const json = await res.json();
    setPreview(json);
    setLoading(false);
  }

  loadPreview();
}, [candidateId]);

async function promoteToCmsDraft() {
  if (!preview?.article?.markdown) return;

  setPromoting(true);
  setPromoteResult(null);

  const res = await fetch(
    `/api/admin/intelligence-preview/${candidateId}/promote-to-cms`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: preview.article.title,
        markdown: preview.article.markdown,
        candidate: preview.candidate,
      }),
    }
  );

  const json = await res.json();

  setPromoting(false);

  if (json.ok) {
    setPromoteResult("Promoted to CMS draft.");
  } else {
    setPromoteResult(json.error || "Promotion failed.");
  }
}
