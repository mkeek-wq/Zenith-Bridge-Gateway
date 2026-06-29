import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildCmsPackageV01 } from "../lib/cmsPackage";

type CoverageRow = {
  candidate_id: string;
  coverage_score: number;
  readiness: string;
  graph_readiness: string;
  required_dataset_count: number;
  verified_dataset_count: number;
  missing_dataset_count: number;
  datasets?: any[];
};

type CoverageRegistry = {
  engine_version: string;
  generated_at: string;
  coverage: CoverageRow[];
};

type PreviewResponse = {
  ok: boolean;
  candidate_id: string;
  candidate: any;
  article: {
    title: string;
    status: string;
    source_type: string;
    source_path: string;
    markdown: string;
    graph?: {
      render_spec?: string;
      png_target?: string;
      svg_target?: string;
      placement?: string;
    } | null;
    graphs?: {
      graph_attachment_count?: number;
      all_graphs_rendered?: boolean;
      graph_attachments?: {
        graph_spec_id: string;
        placeholder: string;
        recommended_chart_type: string;
        purpose: string;
        public_path: string | null;
        rendered: boolean;
      }[];
    } | null;
    audit?: any | null;
    transparency_panel?: any | null;
    publication_decision?: any | null;
    cms_status?: string | null;
  };
};

function markdownToHtml(markdown: string) {
  return markdown
    .replace(/\bSMURF\b/g, "ZNBW Intelligence Engine")
    .replace(/\bSmurf\b/g, "ZNBW Intelligence Engine")
    .replace(/\bsmurf\b/g, "ZNBW Intelligence Engine")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\n---\n/gim, "<hr />")
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }
      if (trimmed.startsWith("<li>")) {
        return `<ul>${trimmed}</ul>`;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

function statusLabel(status?: string | null) {
  if (!status) return "Review required";

  if (status.includes("ready")) return "Publish ready";
  if (status.includes("publish")) return "Publish ready";
  if (status.includes("draft")) return "Draft stage";
  if (status.includes("blocked")) return "Blocked";

  return status.replace(/_/g, " ");
}

function graphPriority(item: {
  placeholder: string;
  recommended_chart_type: string;
  purpose: string;
}) {
  const text = `${item.placeholder} ${item.recommended_chart_type} ${item.purpose}`.toLowerCase();

  if (text.includes("year-on-year") || text.includes("yoy") || text.includes("latest year")) return 3;
  if (text.includes("indexed comparison") || text.includes("indexed") || text.includes("10-year") || text.includes("2016–2025") || text.includes("2016-2025")) return 0;
  if (text.includes("trend") || text.includes("line")) return 1;
  return 2;
}

function graphRoleLabel(item: {
  placeholder: string;
  recommended_chart_type: string;
  purpose: string;
}) {
  const priority = graphPriority(item);
  if (priority === 0) return "Primary trend graph";
  if (priority === 1) return "Trend graph";
  if (priority === 3) return "Momentum snapshot";
  return "Supporting graph";
}

function extractArticleMetrics(markdown: string) {
  const growthGap = markdown.match(/Precision Engineering grew \*\*([^*]+)\*\* over 10 years versus \*\*([^*]+)\*\* for total manufacturing, an outperformance of \*\*([^*]+)\*\*/i);
  const rank = markdown.match(/ranked \*\*#(\d+) out of (\d+)\*\* major manufacturing sectors by 10-year growth/i);
  const share = markdown.match(/share rose from \*\*([^*]+)\*\* in 2016 to \*\*([^*]+)\*\* in 2025/i);
  const yoy = markdown.match(/latest year-on-year growth of \*\*([^*]+)\*\*/i);

  const metrics: { label: string; value: string }[] = [];

  if (growthGap) {
    metrics.push({ label: "10Y growth", value: growthGap[1] });
    metrics.push({ label: "Manufacturing", value: growthGap[2] });
    metrics.push({ label: "Outperformance", value: growthGap[3] });
  }

  if (rank) {
    metrics.push({ label: "10Y rank", value: `#${rank[1]} of ${rank[2]}` });
  }

  if (share) {
    metrics.push({ label: "Share shift", value: `${share[1]} → ${share[2]}` });
  }

  if (yoy) {
    metrics.push({ label: "Latest YoY", value: yoy[1] });
  }

  return metrics.slice(0, 6);
}

function statusBadge(status?: string | null): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid var(--border)",
    whiteSpace: "nowrap",
  };

  const s = status || "";

  if (s.includes("ready") || s.includes("publish")) {
    return { ...base, background: "#dcfce7", color: "#166534" };
  }

  if (s.includes("blocked")) {
    return { ...base, background: "#fee2e2", color: "#991b1b" };
  }

  return { ...base, background: "#fef9c3", color: "#854d0e" };
}

function copyText(text?: string) {
  if (!text) return;
  navigator.clipboard.writeText(text);
}

function displayPercent(value: any) {
  if (value === null || value === undefined || value === "n/a") return "n/a";

  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  return n <= 1 ? `${(n * 100).toFixed(0)}%` : `${n.toFixed(0)}%`;
}

function dataReadinessLabel(row?: CoverageRow | null) {
  if (!row) return "Data n/a";
  if (row.readiness === "strong_data_coverage") return "Strong data coverage";
  if (row.readiness === "partial_data_coverage") return "Partial data coverage";
  if (row.readiness === "thin_data_coverage") return "Thin data coverage";
  return "No verified data";
}

function dataReadinessBadge(row?: CoverageRow | null): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid var(--border)",
    whiteSpace: "nowrap",
  };

  if (!row) return { ...base, background: "#f1f5f9", color: "#334155" };
  if (row.readiness === "strong_data_coverage") return { ...base, background: "#dcfce7", color: "#166534" };
  if (row.readiness === "partial_data_coverage") return { ...base, background: "#fef9c3", color: "#854d0e" };
  if (row.readiness === "thin_data_coverage") return { ...base, background: "#ffedd5", color: "#9a3412" };
  return { ...base, background: "#fee2e2", color: "#991b1b" };
}

export default function IntelligencePreview() {
  const { candidateId } = useParams();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [coverage, setCoverage] = useState<CoverageRow | null>(null);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promotionMessage, setPromotionMessage] = useState("");

  useEffect(() => {
    if (!candidateId) return;

    fetch(`/api/admin/intelligence-preview/${candidateId}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Preview load failed: ${res.status}`);
        return res.json();
      })
      .then(setPreview)
      .catch((err) => setError(err?.message || "Preview load failed"));

    fetch("/admin/intelligence-data/dataset-coverage-engine-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CoverageRegistry | null) => {
        const found = data?.coverage?.find((row) => row.candidate_id === candidateId);
        setCoverage(found || null);
      })
      .catch(() => {
        setCoverage(null);
      });
  }, [candidateId]);

  async function createSafeDraftPackage() {
    if (!candidateId || !preview) return;

    try {
      setPromoting(true);
      setPromotionMessage("");

      const response = await fetch(
        `/api/admin/intelligence-promote/${candidateId}/promote-to-cms`,
        {
          method: "POST",
          credentials: "include",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Draft package creation failed");
      }

      setPromotionMessage(
        `Safe Draft Package Created: ${data.draft?.slug || "draft"}`
      );
    } catch (err: any) {
      setPromotionMessage(err?.message || "Draft package creation failed");
    } finally {
      setPromoting(false);
    }
  }

  const articleHtml = useMemo(() => {
    if (!preview?.article?.markdown) return "";
    return markdownToHtml(preview.article.markdown);
  }, [preview]);

  if (error) {
    return (
      <div className="cms-page">
      <div className="cms-mobile-nav">
        <Link to="/intelligence-center">☰ Intelligence Center</Link>
        <Link to="/intelligence-candidates">Candidates</Link>
      </div>       
         <section className="cms-card">
          <p className="cms-kicker">Preview Error</p>
          <h1>Candidate Preview Unavailable</h1>
          <p>{error}</p>
          <Link className="cms-primary-button" to="/intelligence-candidates">
            Back to Candidates
          </Link>
        </section>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="cms-page">
        <section className="cms-card">
          <p>Loading intelligence preview...</p>
        </section>
      </div>
    );
  }

  const panel = preview.article.transparency_panel;
  const graph = preview.article.graph;
  const graphAttachments =
    preview.article.graphs?.graph_attachments?.filter((item) => item.rendered && item.public_path) ?? [];

  const sortedGraphAttachments = [...graphAttachments].sort(
    (a, b) => graphPriority(a) - graphPriority(b)
  );

  const articleMetrics = extractArticleMetrics(preview.article.markdown || "");

  const graphFileName = graph?.svg_target?.split("/").pop() || "";

  const graphSvgPath =
    graphFileName === "petroleum-sector-comparison-v0.1.svg"
      ? "/admin/intelligence-data/assets/GRAPH_0001-petroleum-sector-comparison-v0.1.svg"
      : graphFileName
        ? `/admin/intelligence-data/assets/${graphFileName}`
        : "";

  const editorialStatus =
    preview.article.cms_status ||
    preview.article.publication_decision?.recommended_status ||
    preview.article.status;

  const sourcePackage = preview.article.source_type
    ? preview.article.source_type.replace(/_/g, " ")
    : "unknown";

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Article Review</p>
          <h1>{preview.article.title}</h1>
          <p>
            Review article, graph, transparency, and readiness before creating a safe draft package.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            className="cms-secondary-button"
            type="button"
            onClick={() => copyText(preview.article.title)}
          >
            Copy Title
          </button>

          <button
            className="cms-secondary-button"
            type="button"
            onClick={() => copyText(preview.article.markdown)}
          >
            Copy Markdown
          </button>

          <button
            className="cms-secondary-button"
            type="button"
            onClick={() => {
              const pkg = buildCmsPackageV01({
                ...preview.article,
                candidate_id:
                  preview.candidate_id ??
                  preview.candidate?.candidate_id ??
                  preview.candidate?.id ??
                  candidateId,
                candidate: preview.candidate,
              });

              copyText(JSON.stringify(pkg, null, 2));
              alert("CMS Package v0.5 copied");
            }}
          >
            Copy CMS Package
          </button>

          <Link className="cms-secondary-button" to="/intelligence-candidates">
            Back to Candidates
          </Link>
        </div>
      </div>

      {promotionMessage && (
        <section className="cms-card" style={{ marginTop: 16 }}>
          <strong>{promotionMessage}</strong>
        </section>
      )}

      <section className="cms-card">
        <p className="cms-kicker">Editorial Status</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="cms-card">
            <strong>Status</strong>
            <p>
              <span style={statusBadge(editorialStatus)}>
                {statusLabel(editorialStatus)}
              </span>
            </p>
          </div>

          <div className="cms-card">
            <strong>Source Package</strong>
            <p>{sourcePackage}</p>
          </div>

          <div className="cms-card">
            <strong>Confidence</strong>
            <p>
              {displayPercent(panel?.authority_score ?? preview.candidate?.signal?.confidence_score)}
            </p>
          </div>

          <div className="cms-card">
            <strong>Graphs</strong>
            <p>
              {graphAttachments.length
                ? `${graphAttachments.length} rendered`
                : graph?.svg_target
                  ? "Legacy graph ready"
                  : "Not attached"}
            </p>
          </div>
        </div>
      </section>

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Data Readiness</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="cms-card">
            <strong>Status</strong>
            <p>
              <span style={dataReadinessBadge(coverage)}>
                {dataReadinessLabel(coverage)}
              </span>
            </p>
          </div>

          <div className="cms-card">
            <strong>Verified Datasets</strong>
            <p>
              {coverage ? `${coverage.verified_dataset_count}/${coverage.required_dataset_count}` : "n/a"}
            </p>
          </div>

          <div className="cms-card">
            <strong>Missing Datasets</strong>
            <p>{coverage?.missing_dataset_count ?? "n/a"}</p>
          </div>

          <div className="cms-card">
            <strong>Graph Readiness</strong>
            <p>{coverage?.graph_readiness?.replace(/_/g, " ") ?? "n/a"}</p>
          </div>
        </div>

        {coverage?.datasets?.length ? (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {coverage.datasets.map((dataset: any) => (
              <div className="cms-card" key={dataset.dataset_id}>
                <strong>{dataset.name}</strong>
                <p className="cms-muted" style={{ margin: "4px 0" }}>
                  {dataset.dataset_id}
                </p>
                <p style={{ margin: 0 }}>
                  Status: {dataset.verification_status} · Importance: {dataset.importance}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Draft Article</p>
        <article
          className="cms-article-preview"
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />
      </section>

      {graphAttachments.length > 0 && (
        <section className="cms-card" style={{ marginTop: 16 }}>
          <p className="cms-kicker">Rendered Graph Assets</p>
          <h2>Article Graphs</h2>

          <div style={{ display: "grid", gap: 16 }}>
            {sortedGraphAttachments.map((item) => (
              <div
                key={item.graph_spec_id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: 18,
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p className="cms-kicker" style={{ marginBottom: 6 }}>
                      {graphRoleLabel(item)}
                    </p>
                    <h3 style={{ marginTop: 0 }}>{item.placeholder}</h3>
                    <p className="cms-muted" style={{ marginTop: 4 }}>
                      {item.recommended_chart_type.replace(/_/g, " ")} · {item.purpose}
                    </p>
                  </div>
                </div>

                {articleMetrics.length > 0 && graphPriority(item) <= 1 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    {articleMetrics.map((metric) => (
                      <div
                        key={`${item.graph_spec_id}-${metric.label}`}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "#f8fafc",
                        }}
                      >
                        <p className="cms-muted" style={{ margin: 0, fontSize: 12 }}>
                          {metric.label}
                        </p>
                        <strong style={{ fontSize: 18 }}>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    marginTop: 16,
                  }}
                >
                  <img
                    src={item.public_path || ""}
                    alt={item.placeholder}
                    style={{
                      width: "100%",
                      minWidth: graphPriority(item) <= 1 ? 720 : 520,
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {graph?.svg_target && (
        <section className="cms-card" style={{ marginTop: 16 }}>
          <p className="cms-kicker">Graph Asset</p>
          <h2>Institutional Graph</h2>

          <p className="cms-muted">{graph.svg_target}</p>

          {graphSvgPath && (
            <div
              style={{
                marginTop: 16,
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 16,
                background: "white",
              }}
            >
              <img
                src={graphSvgPath}
                alt="Institutional graph asset"
                style={{
                  width: "100%",
                  maxHeight: 620,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}
        </section>
      )}

      {panel && (
        <section className="cms-card" style={{ marginTop: 16 }}>
          <p className="cms-kicker">Transparency Panel</p>
          <h2>{panel.publication_grade ?? "Publication Review"}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div className="cms-card">
              <strong>Authority</strong>
              <p>
                {panel.authority_score ?? "n/a"} · {panel.authority_band ?? "n/a"}
              </p>
            </div>

            <div className="cms-card">
              <strong>Verified Metrics</strong>
              <p>{panel.verified_metrics_count ?? "n/a"}</p>
            </div>

            <div className="cms-card">
              <strong>Data Integrity</strong>
              <p>{panel.data_integrity ?? "n/a"}</p>
            </div>
          </div>

          {Array.isArray(panel.source_panel) && (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {panel.source_panel.map((source: any, index: number) => (
                <div className="cms-card" key={`${source.sector}-${index}`}>
                  <strong>{source.sector}</strong>
                  <p>{source.source_name}</p>
                  <p>
                    {source.period} · {source.verification_status}
                  </p>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(panel.governance_notes) && (
            <ul>
              {panel.governance_notes.map((note: string) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Safe Draft Package</p>
        <h2>Create review package</h2>
        <p className="cms-muted">
          This creates a local JSON draft package only. It does not publish, insert into the CMS database, or modify the public website.
        </p>

        <button
          className="cms-primary-button"
          onClick={createSafeDraftPackage}
          disabled={promoting}
        >
          {promoting ? "Creating..." : "Create Safe Draft Package"}
        </button>
      </section>
    </div>
  );
}
