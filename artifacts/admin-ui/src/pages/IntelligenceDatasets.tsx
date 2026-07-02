import { useEffect, useMemo, useState } from "react";

type Dataset = {
  dataset_id: string;
  name: string;
  country?: string;
  metric_type?: string;
  frequency?: string;
  verification_status: string;
  coverage_start?: string | null;
  coverage_end?: string | null;
  values_count: number;
  source_url?: string | null;
  unit?: string;
  used_by_candidates?: string[];
  updated_at?: string;
  reviewed_at?: string;
};

type DatasetRegistry = {
  registry_version: string;
  generated_at: string;
  purpose: string;
  dataset_count: number;
  datasets: Dataset[];
};

function statusIcon(status: string) {
  if (status === "verified") return "🟢";
  if (status === "loaded_pending_review") return "🟡";
  if (status === "requested_not_loaded") return "⚪";
  if (status === "rejected") return "🔴";
  return "⚫";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function formatCoverage(dataset: Dataset) {
  if (!dataset.coverage_start || !dataset.coverage_end) return "n/a";
  return `${dataset.coverage_start}–${dataset.coverage_end}`;
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

export default function IntelligenceDatasets() {
  const [registry, setRegistry] = useState<DatasetRegistry | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/admin/intelligence-data/verified-dataset-registry-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Dataset registry load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Dataset registry load failed"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...(registry?.datasets ?? [])]
      .filter((dataset) => {
        const matchesStatus =
          statusFilter === "all" || dataset.verification_status === statusFilter;

        const haystack = [
          dataset.dataset_id,
          dataset.name,
          dataset.country,
          dataset.metric_type,
          dataset.frequency,
          dataset.verification_status,
          dataset.unit,
          ...(dataset.used_by_candidates ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return matchesStatus && (!q || haystack.includes(q));
      })
      .sort((a, b) => {
        const statusPriority: Record<string, number> = {
          verified: 1,
          loaded_pending_review: 2,
          requested_not_loaded: 3,
          rejected: 4,
        };

        return (
          (statusPriority[a.verification_status] || 9) -
            (statusPriority[b.verification_status] || 9) ||
          a.dataset_id.localeCompare(b.dataset_id)
        );
      });
  }, [registry, query, statusFilter]);

  const verifiedCount =
    registry?.datasets.filter((dataset) => dataset.verification_status === "verified").length ?? 0;

  const requestedCount =
    registry?.datasets.filter((dataset) => dataset.verification_status === "requested_not_loaded").length ?? 0;

  const pendingCount =
    registry?.datasets.filter((dataset) => dataset.verification_status === "loaded_pending_review").length ?? 0;

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Data Governance</p>
          <h1>Verified Dataset Registry</h1>
          <p>
            Registry of requested, loaded, verified, and rejected datasets available to the Intelligence Center.
          </p>
        </div>
      </div>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Dataset Registry Error</p>
          <h2>Dataset registry unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading dataset registry...</p>
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
                <strong>{registry.dataset_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Total datasets</p>
              </div>

              <div className="cms-card">
                <strong>🟢 {verifiedCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Verified</p>
              </div>

              <div className="cms-card">
                <strong>🟡 {pendingCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Pending review</p>
              </div>

              <div className="cms-card">
                <strong>⚪ {requestedCount}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Requested</p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 220px",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <label className="cms-kicker">Search</label>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search dataset id, name, metric, source usage..."
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
                  <option value="verified">Verified</option>
                  <option value="loaded_pending_review">Pending review</option>
                  <option value="requested_not_loaded">Requested not loaded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <p className="cms-muted" style={{ marginTop: 12 }}>
              Showing {filtered.length} datasets · {registry.registry_version} · generated {formatDate(registry.generated_at)}
            </p>
          </section>

          <section style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {filtered.map((dataset) => (
              <article className="cms-card" key={dataset.dataset_id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 170px 120px 160px",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <p className="cms-kicker">{dataset.dataset_id}</p>
                    <h2 style={{ marginTop: 0 }}>{dataset.name}</h2>

                    <p className="cms-muted" style={{ margin: "6px 0" }}>
                      {dataset.country ?? "n/a"} · {dataset.metric_type ?? "unknown"} · {dataset.frequency ?? "unknown"}
                    </p>

                    <p style={{ margin: "8px 0 0" }}>
                      Used by candidates: <strong>{dataset.used_by_candidates?.length ?? 0}</strong>
                    </p>

                    {dataset.source_url && (
                      <p style={{ margin: "8px 0 0" }}>
                        <a href={dataset.source_url} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      </p>
                    )}
                  </div>

                  <div>
                    <strong>Status</strong>
                    <p>
                      {statusIcon(dataset.verification_status)} {statusLabel(dataset.verification_status)}
                    </p>
                  </div>

                  <div>
                    <strong>Values</strong>
                    <p>{dataset.values_count}</p>
                  </div>

                  <div>
                    <strong>Coverage</strong>
                    <p>{formatCoverage(dataset)}</p>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      Updated {formatDate(dataset.reviewed_at || dataset.updated_at)}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <section className="cms-card">
                <p className="cms-muted">No datasets match the current filters.</p>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}
