import { useEffect, useMemo, useState } from "react";

type GraphPackage = {
  graph_package_id: string;
  dataset_id: string;
  title: string;
  country?: string;
  unit?: string;
  frequency?: string;
  source_name?: string;
  source_url?: string;
  coverage_start?: string;
  coverage_end?: string;
  values_count?: number;
  latest_period?: string;
  latest_value?: number;
  previous_period?: string;
  previous_value?: number;
  latest_yoy_percent?: number;
  ten_year_change_percent?: number;
  trend_direction?: string;
  recommended_graphs?: string[];
  values?: { period: string; value: number }[];
  source_metadata?: {
    table_id?: string;
    table_title?: string;
    row_text?: string;
    datasource?: string;
    data_last_updated?: string;
    date_generated?: string;
    footnote?: string;
  };
  generated_at?: string;
};

type GraphPackageRegistry = {
  package_version: string;
  generated_at: string;
  purpose: string;
  package_count: number;
  packages: GraphPackage[];
};

function formatNumber(value?: number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value?: number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return `${Number(value).toFixed(2)}%`;
}

function trendIcon(trend?: string) {
  if (trend === "rising") return "📈";
  if (trend === "falling") return "📉";
  return "➖";
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

export default function IntelligenceGraphPackages() {
  const [registry, setRegistry] = useState<GraphPackageRegistry | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/admin/intelligence-data/graph-data-package-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Graph package load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Graph package load failed"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...(registry?.packages ?? [])]
      .filter((pkg) => {
        const haystack = [
          pkg.graph_package_id,
          pkg.dataset_id,
          pkg.title,
          pkg.country,
          pkg.unit,
          pkg.frequency,
          pkg.source_name,
          pkg.trend_direction,
          ...(pkg.recommended_graphs ?? []),
          pkg.source_metadata?.table_id,
          pkg.source_metadata?.row_text,
        ]
          .join(" ")
          .toLowerCase();

        return !q || haystack.includes(q);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [registry, query]);

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Graph Governance</p>
          <h1>Graph Data Packages</h1>
          <p>
            Graph-ready verified dataset summaries for article workbench, chart rendering, and future dashboards.
          </p>
        </div>
      </div>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Graph Package Error</p>
          <h2>Graph package registry unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading graph data packages...</p>
        </section>
      )}

      {registry && (
        <>
          <section className="cms-card">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div className="cms-card">
                <strong>{registry.package_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Graph packages</p>
              </div>

              <div className="cms-card">
                <strong>{registry.package_version}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Package version</p>
              </div>

              <div className="cms-card">
                <strong>{formatDate(registry.generated_at)}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Generated</p>
              </div>
            </div>

            <label className="cms-kicker">Search</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search package, dataset, title, graph type, source..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            />

            <p className="cms-muted" style={{ marginTop: 12 }}>
              Showing {filtered.length} graph packages.
            </p>
          </section>

          <section style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {filtered.map((pkg) => (
              <article className="cms-card" key={pkg.graph_package_id}>
                <p className="cms-kicker">{pkg.graph_package_id}</p>
                <h2 style={{ marginTop: 0 }}>{pkg.title}</h2>

                <p className="cms-muted">
                  {pkg.dataset_id} · {pkg.country ?? "n/a"} · {pkg.frequency ?? "n/a"} · {pkg.unit ?? "n/a"}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <div className="cms-card">
                    <strong>Latest</strong>
                    <p>
                      {pkg.latest_period ?? "n/a"} · {formatNumber(pkg.latest_value)}
                    </p>
                  </div>

                  <div className="cms-card">
                    <strong>YoY</strong>
                    <p>{formatPercent(pkg.latest_yoy_percent)}</p>
                  </div>

                  <div className="cms-card">
                    <strong>10Y Change</strong>
                    <p>{formatPercent(pkg.ten_year_change_percent)}</p>
                  </div>

                  <div className="cms-card">
                    <strong>Trend</strong>
                    <p>
                      {trendIcon(pkg.trend_direction)} {pkg.trend_direction ?? "n/a"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <section className="cms-card">
                    <p className="cms-kicker">Coverage</p>
                    <p>
                      {pkg.coverage_start ?? "n/a"}–{pkg.coverage_end ?? "n/a"} · {pkg.values_count ?? 0} values
                    </p>
                    <p className="cms-muted">
                      Source: {pkg.source_name ?? "n/a"}
                    </p>
                    {pkg.source_url && (
                      <p>
                        <a href={pkg.source_url} target="_blank" rel="noreferrer">
                          Open source
                        </a>
                      </p>
                    )}
                  </section>

                  <section className="cms-card">
                    <p className="cms-kicker">Recommended Graphs</p>
                    <p>
                      {(pkg.recommended_graphs ?? []).length
                        ? pkg.recommended_graphs?.join(", ")
                        : "n/a"}
                    </p>
                    <p className="cms-muted">
                      Table: {pkg.source_metadata?.table_id ?? "n/a"} · Row: {pkg.source_metadata?.row_text ?? "n/a"}
                    </p>
                  </section>
                </div>

                {pkg.values?.length ? (
                  <section className="cms-card" style={{ marginTop: 16 }}>
                    <p className="cms-kicker">Values</p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: 8,
                      }}
                    >
                      {pkg.values.map((point) => (
                        <div
                          key={`${pkg.graph_package_id}-${point.period}`}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "8px 10px",
                          }}
                        >
                          <strong>{point.period}</strong>
                          <p style={{ margin: "4px 0 0" }}>{formatNumber(point.value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>
            ))}

            {filtered.length === 0 && (
              <section className="cms-card">
                <p className="cms-muted">No graph packages match the current search.</p>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}
