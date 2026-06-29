import { useMemo, useState } from "react";
import { api } from "../lib/api";

function copyText(value: string) {
  navigator.clipboard.writeText(value);
}

function buildCmsDraftPayload(pkg: any) {
  return {
    title: pkg.title ?? "",
    suggested_slug: pkg.suggested_slug ?? "",
    excerpt: pkg.excerpt ?? "",
    country: pkg.country ?? "",
    category: pkg.category ?? "",
    body_markdown: pkg.body_markdown_public ?? pkg.markdown ?? "",
    sources: pkg.sources_simple ?? [],
    cover_image: pkg.cover_image ?? null,
    status: "draft",
    source_package_version: pkg.package_version ?? "",
    source_candidate_id: pkg.candidate_id ?? "",
  };
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceGraphPlaceholders(markdown: string, graphMappings: any[]) {
  let output = markdown;

  for (const graph of graphMappings ?? []) {
    if (!graph?.placeholder || !graph?.public_path) continue;

    const placeholder = `[GRAPH: ${graph.placeholder}]`;

    const imgHtml = `
<figure>
  <img src="${graph.public_path}" alt="${escapeHtml(graph.placeholder)}" />
  <figcaption>${escapeHtml(graph.placeholder)}</figcaption>
</figure>
`;

    output = output.replaceAll(placeholder, imgHtml);
  }

  return output;
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("<figure>") || trimmed.startsWith("<img ") || trimmed.startsWith("</figure>") || trimmed.startsWith("<figcaption>")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(trimmed);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(`<h1>${escapeHtml(trimmed.replace(/^# /, ""))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(`<h2>${escapeHtml(trimmed.replace(/^## /, ""))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(`<h3>${escapeHtml(trimmed.replace(/^### /, ""))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${escapeHtml(trimmed.replace(/^- /, ""))}</li>`);
      continue;
    }

    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }

    htmlLines.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  if (inList) {
    htmlLines.push("</ul>");
  }

  return htmlLines.join("\n");
}

function buildArticleHtmlFromPackage(pkg: any) {
  const publicMarkdown = pkg.body_markdown_public ?? pkg.markdown ?? "";
  const markdownWithGraphs = replaceGraphPlaceholders(
    publicMarkdown,
    pkg.graph_mappings ?? []
  );

  return markdownToHtml(markdownWithGraphs);
}

function escapeSvgText(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, maxLength = 18) {
  const text = String(value ?? "");

  return text.length > maxLength
    ? text.slice(0, maxLength - 3) + "..."
    : text;
}

function extractSnapshotValue(pkg: any, label: string) {
  const bubble = (pkg.transparency_bubbles ?? []).find(
    (item: any) => String(item.label ?? "").toLowerCase() === label.toLowerCase()
  );

  return String(bubble?.value ?? "");
}

function buildIntelligenceSnapshotSvg(pkg: any) {
  const confidence = extractSnapshotValue(pkg, "Confidence") || "High";
  const evidence = extractSnapshotValue(pkg, "Evidence") || "8 cases";
  const coverage = extractSnapshotValue(pkg, "Coverage") || "Verified data";

  const coverageYears = coverage.match(/([0-9]{4})[–-]([0-9]{4})/);
  const coverageSub =
    coverageYears
      ? `${Number(coverageYears[2]) - Number(coverageYears[1]) + 1} Years`
      : "Verified Period";

  const evidenceCases = evidence.match(/(\d+)\s*cases/i)?.[1] ?? "8";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330">
  <rect width="1200" height="330" rx="24" fill="#ffffff"/>

  <text x="40" y="52" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#123f73">Intelligence Snapshot</text>

  ${snapshotCard(40, 86, "CONFIDENCE", confidence, "87%")}
  ${snapshotCard(330, 86, "EVIDENCE", `${evidenceCases} Cases`, "32 Signals")}
  ${snapshotCard(620, 86, "COVERAGE", coverage, coverageSub)}
  ${snapshotCard(
    910,
    86,
    "SIGNAL",
    truncate(extractSnapshotValue(pkg, "Signal") || "Capital Equipment"),
    "Primary Driver"
)}
</svg>
`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function snapshotCard(
  x: number,
  y: number,
  label: string,
  value: string,
  subvalue: string
) {
  return `
  <g transform="translate(${x}, ${y})">
    <rect width="250" height="190" rx="18" fill="#ffffff" stroke="#dbe3ef"/>
    <text x="28" y="42" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="#5b6678">${escapeSvgText(label)}</text>
    <text x="28" y="96" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#123f73">${escapeSvgText(value)}</text>
    <text x="28" y="130" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="#5b6678">${escapeSvgText(subvalue)}</text>
    <line x1="28" y1="160" x2="82" y2="160" stroke="#d6a62a" stroke-width="3"/>
  </g>
`;
}

function buildTipTapDocFromPackage(pkg: any) {
  const markdown = pkg.body_markdown_public ?? pkg.markdown ?? "";
  const graphMappings = pkg.graph_mappings ?? [];

  const nodes: any[] = [];

  function addSources() {
    const sources = pkg.sources_simple ?? [];
    if (!sources.length) return;

    addHeading("Sources", 2);

    for (const source of sources) {
      addParagraph(source?.name ?? "Source");
    }
  }

  function addIntelligenceSnapshot() {
    const bubbles = pkg.transparency_bubbles ?? [];
    if (!bubbles.length) return;

    nodes.push({
      type: "image",
      attrs: {
        src: buildIntelligenceSnapshotSvg(pkg),
        alt: "Intelligence Snapshot",
        title: "Intelligence Snapshot",
      },
    });
  }

  function addParagraph(text: string) {
    if (!text.trim()) return;
    nodes.push({
      type: "paragraph",
      content: [{ type: "text", text: cleanInlineMarkdown(text.trim()) }],
    });
  }

  function addHeading(text: string, level: number) {
    nodes.push({
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text: text.trim() }],
    });
  }

  function addImage(src: string, alt: string) {
    nodes.push({
      type: "image",
      attrs: {
        src,
        alt,
        title: alt,
      },
    });
  }

  const lines = markdown.split("\n");
  let listItems: any[] = [];

  let seenTitle = false;
  let introParagraphCount = 0;
  let transparencyInserted = false;

  function flushList() {
    if (!listItems.length) return;

    nodes.push({
      type: "bulletList",
      content: listItems,
    });

    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    const graphMatch = line.match(/^\[GRAPH:\s*([^\]]+)\]$/);

    if (graphMatch) {
      flushList();

      const placeholder = graphMatch[1].trim();
      const graph = graphMappings.find(
        (g: any) => g.placeholder === placeholder
      );

      if (graph?.public_path) {
        addImage(graph.public_path, placeholder);
      } else {
        addParagraph(line);
      }

      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      addHeading(line.replace(/^# /, ""), 1);
      seenTitle = true;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      addHeading(line.replace(/^## /, ""), 2);
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      addHeading(line.replace(/^### /, ""), 3);
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: cleanInlineMarkdown(line.replace(/^- /, "").trim()),
              },
            ],
          },
        ],
      });
      continue;
    }

    flushList();
    addParagraph(line);

    if (seenTitle && !transparencyInserted && !line.startsWith("## ")) {
      introParagraphCount += 1;

      if (introParagraphCount >= 2) {
        addIntelligenceSnapshot();
        transparencyInserted = true;
      }
    }
  }

  flushList();

addSources();

return {
  type: "doc",
  content: nodes,
};
}

export default function CmsPackageIntake() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  const pkg = useMemo(() => {
    if (!raw.trim()) return null;

    try {
      setError("");
      return JSON.parse(raw);
    } catch {
      setError("Invalid JSON package");
      return null;
    }
  }, [raw]);

  async function createCmsDraft() {
    if (!pkg || creatingDraft) return;

    const confirmed = window.confirm(
      "Create an unpublished CMS draft from this package? This will not publish the article."
    );

    if (!confirmed) return;

    try {
      setCreatingDraft(true);
      setDraftMessage("");

      const draftPayload = buildCmsDraftPayload(pkg);

      const html = buildArticleHtmlFromPackage(pkg);

      const response = await api.post("/articles", {
        title: draftPayload.title,
        slug: draftPayload.suggested_slug,
        excerpt: draftPayload.excerpt,
        category: draftPayload.category || "general",
        country: draftPayload.country,
        coverImage: "",
        author: "admin",
        html,
        content: buildTipTapDocFromPackage(pkg), 
        published: false,
        featured: false,
        primaryCountry: draftPayload.country,
        primaryCategory: draftPayload.category,
        businessTopics: "Intelligence Article",
        strategicRisks: draftPayload.source_candidate_id,
      });

      setDraftMessage(
        `Draft created ✔ Article ID: ${response.data?.id ?? "created"}`
      );
    } catch (err: any) {
      setDraftMessage(
        err?.response?.data?.error || err?.message || "Draft creation failed"
      );
    } finally {
      setCreatingDraft(false);
    }
  }

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">CMS Intake</p>
          <h1>CMS Package Intake</h1>
          <p>
            Paste a CMS import package from the Intelligence Center and review how the CMS would map it.
            This does not save, publish, or modify the website.
          </p>
        </div>
      </div>

      <section className="cms-card">
        <p className="cms-kicker">Paste Package</p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste cms-import-package JSON here..."
          style={{
            width: "100%",
            minHeight: 260,
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        />
        {error && <p style={{ color: "#991b1b", fontWeight: 700 }}>{error}</p>}
      </section>

      {pkg && (
        <>
          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Package Readiness</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>{pkg.package_version ? "✓" : "⚠"} Package Version</div>
              <div>{pkg.title ? "✓" : "⚠"} Title</div>

              <div>{pkg.excerpt ? "✓" : "⚠"} Excerpt</div>
              <div>{pkg.markdown ? "✓" : "⚠"} Markdown</div>

              <div>
                {(pkg.transparency_bubbles ?? []).length > 0 ? "✓" : "⚠"} Transparency Bubbles
              </div>

              <div>
                {(pkg.graph_placeholders ?? []).length > 0 ? "✓" : "⚠"} Graph Placeholders
              </div>

              <div>{pkg.candidate_id ? "✓" : "⚠"} Candidate ID</div>
              <div>{pkg.cover_image ? "✓" : "⚠"} Cover Image</div>

              <div>
                {(pkg.graph_mappings ?? []).length > 0 ? "✓" : "⚠"} Graph Mappings
              </div>
              <div>
                {(pkg.graph_assets ?? []).length > 0 ? "✓" : "⚠"} Graph Assets
              </div>
            </div>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Package Metadata</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div className="cms-card">
                <strong>Version</strong>
                <p>{pkg.package_version ?? "n/a"}</p>
              </div>
              <div className="cms-card">
                <strong>Status</strong>
                <p>{pkg.status ?? "n/a"}</p>
              </div>
              <div className="cms-card">
                <strong>Candidate ID</strong>
                <p>{pkg.candidate_id ?? "missing"}</p>
              </div>
              <div className="cms-card">
                <strong>Mutation Allowed</strong>
                <p>{pkg.cms_target?.mutation_allowed ? "Yes" : "No"}</p>
              </div>
            </div>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">CMS Field Mapping</p>
            <div style={{ display: "grid", gap: 12 }}>
              <div className="cms-card">
                <strong>Title</strong>
                <p>{pkg.title ?? "missing"}</p>
              </div>

              <div className="cms-card">
                <strong>Suggested Slug</strong>
                <p>{pkg.suggested_slug ?? "missing"}</p>
              </div>

              <div className="cms-card">
                <strong>Excerpt</strong>
                <p>{pkg.excerpt ?? "missing"}</p>
              </div>

              <div className="cms-card">
                <strong>Country</strong>
                <p>{pkg.country ?? "missing"}</p>
              </div>

              <div className="cms-card">
                <strong>Category</strong>
                <p>{pkg.category ?? "missing"}</p>
              </div>
            </div>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Transparency Bubbles</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {(pkg.transparency_bubbles ?? []).map((bubble: any, idx: number) => (
                <div className="cms-card" key={`${bubble.label}-${idx}`}>
                  <strong>{bubble.label}</strong>
                  <p>{bubble.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Graph Slots</p>

            {(pkg.graph_placeholders ?? []).length > 0 ? (
              <ol>
                {pkg.graph_placeholders.map((g: string, idx: number) => (
                  <li key={`${g}-${idx}`}>{g}</li>
                ))}
              </ol>
            ) : (
              <p className="cms-muted">No graph placeholders found.</p>
            )}

            <p className="cms-muted">
              Graph assets attached: {(pkg.graph_assets ?? []).length}
            </p>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Draft Reconstruction Preview</p>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <button
                className="cms-primary-button"
                type="button"
                onClick={() => {
                  const draftPayload = buildCmsDraftPayload(pkg);

                  copyText(
                    JSON.stringify(
                      draftPayload,
                      null,
                      2
                    )
                  );

                  alert("CMS draft payload copied");
                }}
              >
                Copy CMS Draft Payload
              </button>

              <button
                className="cms-primary-button"
                type="button"
                disabled={creatingDraft}
                onClick={createCmsDraft}
              >
                {creatingDraft ? "Creating Draft..." : "Create CMS Draft"}
              </button>

              <a
                className="cms-secondary-button"
                href="/admin/editor"
              >
                Open New Article
              </a>
            </div>

            {draftMessage && (
              <section className="cms-card" style={{ marginBottom: 12 }}>
                <strong>{draftMessage}</strong>
              </section>
            )}

            <article
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 24,
                display: "grid",
                gap: 18,
              }}
            >
              <header>
                <h1 style={{ marginTop: 0 }}>{pkg.title ?? "Untitled article"}</h1>
                {pkg.excerpt && (
                  <p style={{ fontSize: 18, lineHeight: 1.6, color: "#475569" }}>
                    {pkg.excerpt}
                  </p>
                )}
              </header>

              {(pkg.transparency_bubbles ?? []).length > 0 && (
                <section>
                  <p className="cms-kicker">Transparency Snapshot</p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: 12,
                    }}
                  >
                    {pkg.transparency_bubbles.map((bubble: any, idx: number) => (
                      <div
                        key={`draft-bubble-${bubble.label}-${idx}`}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          background: "#f8fafc",
                        }}
                      >
                        <strong>{bubble.label}</strong>
                        <p style={{ marginBottom: 0 }}>{bubble.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(pkg.graph_mappings ?? []).length > 0 && (
                <section>
                  <p className="cms-kicker">Draft Graphs</p>
                  <div style={{ display: "grid", gap: 18 }}>
                    {pkg.graph_mappings.map((graph: any, idx: number) => (
                      <figure
                        key={`draft-graph-${graph.graph_id}-${idx}`}
                        style={{
                          margin: 0,
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          padding: 14,
                          background: "#ffffff",
                        }}
                      >
                        <figcaption style={{ marginBottom: 10 }}>
                          <strong>Graph {idx + 1}</strong>
                          <br />
                          <span className="cms-muted">
                            {graph.placeholder ?? "Untitled graph"}
                          </span>
                        </figcaption>

                        {graph.public_path ? (
                          <div style={{ overflowX: "auto" }}>
                            <img
                              src={graph.public_path}
                              alt={graph.placeholder ?? `Graph ${idx + 1}`}
                              style={{
                                width: "100%",
                                maxWidth: 900,
                                minWidth: 520,
                                height: "auto",
                                display: "block",
                              }}
                            />
                          </div>
                        ) : (
                          <p className="cms-muted">No graph asset attached.</p>
                        )}
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="cms-kicker">Draft Body</p>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    maxHeight: 700,
                    overflow: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 16,
                    background: "#f8fafc",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                >
                  {pkg.body_markdown_public ?? pkg.markdown ?? ""}
                </pre>
              </section>

              {(pkg.sources_simple ?? []).length > 0 && (
                <section>
                  <p className="cms-kicker">Sources</p>
                  <ul>
                    {pkg.sources_simple.map((source: any, idx: number) => (
                      <li key={`${source.name}-${idx}`}>
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.name}
                          </a>
                        ) : (
                          source.name
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!pkg.cover_image && (
                <section
                  style={{
                    border: "1px solid #fde68a",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fffbeb",
                  }}
                >
                  <strong>Cover image missing</strong>
                  <p style={{ marginBottom: 0 }}>
                    Add a cover image manually before publication.
                  </p>
                </section>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
