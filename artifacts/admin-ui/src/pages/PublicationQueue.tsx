import { useEffect, useMemo, useState } from "react";

type CmsPublicationRegistry = {
  package_version: string;
  generated_at: string;
  package_count: number;
  packages: any[];
};

export default function PublicationQueue() {
  const [registry, setRegistry] = useState<CmsPublicationRegistry | null>(null);
  const [draftRegistry, setDraftRegistry] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/admin/intelligence-data/cms-publication-package-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Publication package load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Publication package load failed"));

    fetch("/admin/intelligence-data/cms-draft-package-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(setDraftRegistry)
      .catch(() => setDraftRegistry(null));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...(registry?.packages ?? [])].filter((pkg) => {
      const haystack = [
        pkg.title,
        pkg.candidate_id,
        pkg.publication_status,
        pkg.markdown,
      ]
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [registry, query]);

  function copyText(text?: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Publication Review</p>
          <h1>Publication Queue</h1>
          <p>
            Review Intelligence Center articles that passed audit and are ready for manual CMS review.
          </p>
        </div>
      </div>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Publication Queue Error</p>
          <h2>Publication queue unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading publication queue...</p>
        </section>
      )}

      {registry && (
        <>
          <section className="cms-card">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div className="cms-card">
                <strong>{registry.package_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Ready packages</p>
              </div>

              <div className="cms-card">
                <strong>{draftRegistry?.draft_count ?? 0}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>CMS drafts</p>
              </div>

              <div className="cms-card">
                <strong>{registry.package_version}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Version</p>
              </div>

              <div className="cms-card">
                <strong>{new Date(registry.generated_at).toLocaleString()}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Generated</p>
              </div>
            </div>

            <label className="cms-kicker">Search</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, candidate id, article text..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            />

            <p className="cms-muted" style={{ marginTop: 12 }}>
              Showing {filtered.length} publication packages.
            </p>
          </section>

          <section style={{ display: "grid", gap: 14, marginTop: 16 }}>
            {filtered.map((pkg) => {
              const draft = draftRegistry?.drafts?.find(
                (item: any) => item.candidate_id === pkg.candidate_id
              );

              return (
                <article className="cms-card" key={pkg.candidate_id}>
                  <p className="cms-kicker">🟢 {pkg.publication_status}</p>
                  <h2 style={{ marginTop: 0 }}>{pkg.title}</h2>

                  <p className="cms-muted">{pkg.candidate_id}</p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <div className="cms-card">
                      <strong>Human Review</strong>
                      <p>{pkg.governance?.human_review_required ? "Required" : "Not flagged"}</p>
                    </div>

                    <div className="cms-card">
                      <strong>Audit</strong>
                      <p>{pkg.governance?.publication_approved_by_audit ? "Passed" : "Not approved"}</p>
                    </div>

                    <div className="cms-card">
                      <strong>CMS Mode</strong>
                      <p>{pkg.governance?.cms_copy_paste_required ? "Manual copy/paste" : "Unknown"}</p>
                    </div>
                  </div>

                  {draft && (
                    <section className="cms-card" style={{ marginTop: 16 }}>
                      <p className="cms-kicker">CMS Draft Package</p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: 12,
                        }}
                      >
                        <div>
                          <strong>Slug</strong>
                          <p className="cms-muted">{draft.slug}</p>
                        </div>

                        <div>
                          <strong>Country</strong>
                          <p className="cms-muted">{draft.country}</p>
                        </div>

                        <div>
                          <strong>Category</strong>
                          <p className="cms-muted">{draft.category}</p>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <strong>Excerpt</strong>
                        <p>{draft.excerpt}</p>
                      </div>

                      <p className="cms-muted">
                        CMS mutation allowed: {draft.cms_mutation_allowed ? "Yes" : "No"} · Status: {draft.status}
                      </p>
                    </section>
                  )}

                  <section className="cms-card" style={{ marginTop: 16 }}>
                    <p className="cms-kicker">Article Preview</p>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        maxHeight: 420,
                        overflow: "auto",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 16,
                        background: "#fff",
                      }}
                    >
                      {pkg.markdown}
                    </pre>
                  </section>

                  <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                    <button
                      className="cms-primary-button"
                      type="button"
                      onClick={() => copyText(pkg.title)}
                    >
                      Copy Title
                    </button>

                    <button
                      className="cms-primary-button"
                      type="button"
                      onClick={() => copyText(pkg.markdown)}
                    >
                      Copy Markdown
                    </button>

                    {draft && (
                      <>
                        <button
                          className="cms-primary-button"
                          type="button"
                          onClick={() => copyText(draft.slug)}
                        >
                          Copy Slug
                        </button>

                        <button
                          className="cms-primary-button"
                          type="button"
                          onClick={() => copyText(draft.excerpt)}
                        >
                          Copy Excerpt
                        </button>

                        <button
                          className="cms-primary-button"
                          type="button"
                          onClick={() => copyText(draft.body_markdown)}
                        >
                          Copy CMS Body
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
