import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Candidate = {
  candidate_id: string;
  title: string;
  excerpt: string;
  country: string;
  category: string;
  primary_driver: string;
  confidence_score: number | null;
  confidence_band: string;
  maturity_stage: string;
  evidence_count: number;
  source_case_count: number;
  publication_status: string;
  graph_ready: boolean;
  asset_ids: string[];
  created_at?: string;
  updated_at?: string;
  source_package?: string;
};

type Registry = {
  registry_version: string;
  generated_at: string;
  purpose: string;
  candidate_count: number;
  candidates: Candidate[];
};

type CoverageRow = {
  candidate_id: string;
  coverage_score: number;
  readiness: string;
  graph_readiness: string;
  required_dataset_count: number;
  verified_dataset_count: number;
  missing_dataset_count: number;
};

type CoverageRegistry = {
  engine_version: string;
  generated_at: string;
  coverage: CoverageRow[];
};

const PAGE_SIZE = 20;

function statusDot(status: string) {
  if (status === "publish_ready") return "🟢";
  if (status === "editorial_review") return "🟡";
  if (status === "needs_evidence") return "🔴";
  return "⚪";
}

function statusLabel(status: string) {
  if (status === "publish_ready") return "Publish ready";
  if (status === "editorial_review") return "Editorial review";
  if (status === "needs_evidence") return "Needs evidence";
  return "Unknown status";
}

function statusTooltip(candidate: Candidate) {
  if (candidate.publication_status === "publish_ready") {
    return `Publish ready\nConfidence: ${confidenceDisplay(candidate)}\nEvidence: ${candidate.evidence_count} signals across ${candidate.source_case_count} cases`;
  }

  if (candidate.publication_status === "editorial_review") {
    return `Editorial review required\nConfidence: ${confidenceDisplay(candidate)}\nReview interpretation, sourcing and article fit`;
  }

  if (candidate.publication_status === "needs_evidence") {
    return `Needs evidence\nNot recommended for publication yet\nAdd verified data or stronger supporting cases`;
  }

  return "Status unavailable";
}

function confidenceDisplay(candidate: Candidate) {
  if (candidate.confidence_score === null || candidate.confidence_score === undefined) {
    return "n/a";
  }

  const score =
    candidate.confidence_score <= 1
      ? candidate.confidence_score * 100
      : candidate.confidence_score;

  return `${score.toFixed(0)}%`;
}

function formatDate(value?: string) {
  if (!value) return "n/a";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "n/a";

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortCategory(category: string) {
  if (!category) return "Intelligence";
  return category.length > 64 ? `${category.slice(0, 64)}...` : category;
}

function dataCoverageLabel(row?: CoverageRow) {
  if (!row) return "Data n/a";
  if (row.readiness === "strong_data_coverage") return "Strong data";
  if (row.readiness === "partial_data_coverage") return "Partial data";
  if (row.readiness === "thin_data_coverage") return "Thin data";
  return "No verified data";
}

function dataCoverageIcon(row?: CoverageRow) {
  if (!row) return "⚪";
  if (row.readiness === "strong_data_coverage") return "🟢";
  if (row.readiness === "partial_data_coverage") return "🟡";
  if (row.readiness === "thin_data_coverage") return "🟠";
  return "🔴";
}

function dataCoverageTitle(row?: CoverageRow) {
  if (!row) return "No data coverage information available.";
  return `${dataCoverageLabel(row)}\nVerified datasets: ${row.verified_dataset_count}/${row.required_dataset_count}\nMissing datasets: ${row.missing_dataset_count}\nGraph readiness: ${row.graph_readiness}`;
}

export default function IntelligenceCandidates() {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [coverageRegistry, setCoverageRegistry] = useState<CoverageRegistry | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [graphFilter, setGraphFilter] = useState("all");
  const [sortBy, setSortBy] = useState("publish_ready_first");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/admin/intelligence-data/candidate-queue-v0.2.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Queue load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Queue load failed"));

    fetch("/admin/intelligence-data/dataset-coverage-engine-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCoverageRegistry(data);
      })
      .catch(() => {
        // Data coverage is optional for queue rendering.
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, graphFilter, sortBy]);

  const filtered = useMemo(() => {
    const items = registry?.candidates ?? [];
    const q = query.trim().toLowerCase();

    let out = items.filter((candidate) => {
      const matchesStatus =
        statusFilter === "all" || candidate.publication_status === statusFilter;

      const matchesGraph =
        graphFilter === "all" ||
        (graphFilter === "graph_ready" && candidate.graph_ready) ||
        (graphFilter === "no_graph" && !candidate.graph_ready);

      const haystack = [
        candidate.title,
        candidate.excerpt,
        candidate.country,
        candidate.category,
        candidate.primary_driver,
        candidate.publication_status,
        candidate.confidence_band,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);

      return matchesStatus && matchesGraph && matchesQuery;
    });

    out = [...out].sort((a, b) => {
      if (sortBy === "publish_ready_first") {
        const priority: Record<string, number> = {
          publish_ready: 1,
          editorial_review: 2,
          needs_evidence: 3,
        };

        return (
          (priority[a.publication_status] || 9) -
          (priority[b.publication_status] || 9)
        );
      }

      if (sortBy === "confidence_desc") {
        return Number(b.confidence_score || 0) - Number(a.confidence_score || 0);
      }

      if (sortBy === "evidence_desc") {
        return Number(b.evidence_count || 0) - Number(a.evidence_count || 0);
      }

      if (sortBy === "graph_ready_first") {
        return Number(b.graph_ready) - Number(a.graph_ready);
      }

      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }

      const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
      const bDate = new Date(b.updated_at || b.created_at || 0).getTime();

      return bDate - aDate;
    });

    return out;
  }, [registry, query, statusFilter, graphFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const coverageByCandidate = useMemo(() => {
    const map = new Map<string, CoverageRow>();
    for (const row of coverageRegistry?.coverage ?? []) {
      map.set(row.candidate_id, row);
    }
    return map;
  }, [coverageRegistry]);

  const publishReadyCount =
    registry?.candidates.filter((candidate) => candidate.publication_status === "publish_ready")
      .length ?? 0;

  const reviewCount =
    registry?.candidates.filter((candidate) => candidate.publication_status === "editorial_review")
      .length ?? 0;

  const needsEvidenceCount =
    registry?.candidates.filter((candidate) => candidate.publication_status === "needs_evidence")
      .length ?? 0;

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Pre-Draft Articles</p>
          <h1>Candidate Queue</h1>
          <p>
            Editorial inbox for Intelligence Engine candidates before preview review and safe draft package creation.
          </p>
        </div>
      </div>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Queue Error</p>
          <h2>Candidate queue unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading candidate queue...</p>
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
                <strong>{registry.candidate_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Total candidates</p>
              </div>

              <div className="cms-card">
                <strong>🟢 {publishReadyCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Publish ready</p>
              </div>

              <div className="cms-card">
                <strong>🟡 {reviewCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Editorial review</p>
              </div>

              <div className="cms-card">
                <strong>🔴 {needsEvidenceCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Needs evidence</p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 190px 170px 210px",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <label className="cms-kicker">Search</label>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, category, country, driver..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div>
                <label className="cms-kicker">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="all">All</option>
                  <option value="publish_ready">Publish ready</option>
                  <option value="editorial_review">Editorial review</option>
                  <option value="needs_evidence">Needs evidence</option>
                </select>
              </div>

              <div>
                <label className="cms-kicker">Graph</label>
                <select
                  value={graphFilter}
                  onChange={(event) => setGraphFilter(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="all">All</option>
                  <option value="graph_ready">Graph ready</option>
                  <option value="no_graph">No graph</option>
                </select>
              </div>

              <div>
                <label className="cms-kicker">Sort</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="publish_ready_first">Publish ready first</option>
                  <option value="updated_desc">Recently updated</option>
                  <option value="confidence_desc">Highest confidence</option>
                  <option value="evidence_desc">Most evidence</option>
                  <option value="graph_ready_first">Graph ready first</option>
                  <option value="title_asc">Title A-Z</option>
                </select>
              </div>
            </div>

            <p className="cms-muted" style={{ marginTop: 12 }}>
              Showing {filtered.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} matching candidates ·{" "}
              {registry.registry_version}
            </p>
          </section>

          <section style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {pageItems.map((candidate) => (
              <article className="cms-card" key={candidate.candidate_id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1fr 140px",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div
                    title={statusTooltip(candidate)}
                    style={{
                      fontSize: 28,
                      lineHeight: 1,
                      cursor: "help",
                      textAlign: "center",
                      paddingTop: 4,
                    }}
                  >
                    {statusDot(candidate.publication_status)}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <h2 style={{ margin: 0 }}>{candidate.title}</h2>
                      <span className="cms-muted" title={statusTooltip(candidate)}>
                        {statusLabel(candidate.publication_status)}
                      </span>
                    </div>

                    <p className="cms-muted" style={{ margin: "8px 0 10px" }}>
                      {candidate.country} · {shortCategory(candidate.category)}
                    </p>

                    <p style={{ margin: "0 0 12px" }}>{candidate.excerpt}</p>

                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span className="cms-muted">
                        Confidence <strong>{confidenceDisplay(candidate)}</strong>
                      </span>

                      <span className="cms-muted">
                        Evidence <strong>{candidate.evidence_count}</strong>
                      </span>

                      <span className="cms-muted">
                        Cases <strong>{candidate.source_case_count}</strong>
                      </span>

                      <span
                        className="cms-muted"
                        title={dataCoverageTitle(coverageByCandidate.get(candidate.candidate_id))}
                      >
                        Data <strong>
                          {dataCoverageIcon(coverageByCandidate.get(candidate.candidate_id))}{" "}
                          {dataCoverageLabel(coverageByCandidate.get(candidate.candidate_id))}
                        </strong>
                      </span>

                      <span className="cms-muted">
                        Graph <strong>{candidate.graph_ready ? "Ready" : "—"}</strong>
                      </span>

                      <span className="cms-muted">
                        Updated <strong>{formatDate(candidate.updated_at || candidate.created_at)}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link
                      className="cms-primary-button"
                      to={`/intelligence-preview/${candidate.candidate_id}`}
                    >
                      Open Preview
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            {pageItems.length === 0 && (
              <section className="cms-card">
                <p className="cms-muted">No candidates match the current filters.</p>
              </section>
            )}
          </section>

          {filtered.length > PAGE_SIZE && (
            <section
              className="cms-card"
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                type="button"
                className="cms-secondary-button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              <p className="cms-muted" style={{ margin: 0 }}>
                Page {safePage} of {totalPages} · 20 per page
              </p>

              <button
                type="button"
                className="cms-secondary-button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
