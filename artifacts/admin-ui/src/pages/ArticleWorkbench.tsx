import { useEffect, useMemo, useState } from "react";

type WorkbenchRegistry = {
  workbench_version: string;
  generated_at: string;
  package_count: number;
  ready_count: number;
  blocked_count: number;
  packages: any[];
};

function pct(value: any) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return Number(value) <= 1 ? `${(Number(value) * 100).toFixed(0)}%` : `${Number(value).toFixed(0)}%`;
}

function statusIcon(status: string) {
  if (status === "workbench_ready") return "🟢";
  return "🔴";
}

export default function ArticleWorkbench() {
  const [registry, setRegistry] = useState<WorkbenchRegistry | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/admin/intelligence-data/article-workbench-package-v0.2.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Workbench load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Workbench load failed"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...(registry?.packages ?? [])].filter((pkg) => {
      const intel = pkg.intelligence_package ?? {};
      const haystack = [
        pkg.candidate_title,
        pkg.candidate?.excerpt,
        pkg.candidate?.primary_driver,
        intel.business_implication,
        intel.why_it_matters,
        intel.source_driver?.driver_name,
        ...(intel.affected_sectors ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [registry, query]);

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Article Intelligence</p>
          <h1>Article Workbench</h1>
          <p>
            Review candidate intelligence, verified data, graph packages, and publication readiness before AI article generation.
          </p>
        </div>
      </div>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Workbench Error</p>
          <h2>Article Workbench unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading Article Workbench...</p>
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
                <p className="cms-muted" style={{ margin: 0 }}>Packages</p>
              </div>

              <div className="cms-card">
                <strong>🟢 {registry.ready_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Ready</p>
              </div>

              <div className="cms-card">
                <strong>🔴 {registry.blocked_count}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Blocked</p>
              </div>

              <div className="cms-card">
                <strong>{registry.workbench_version}</strong>
                <p className="cms-muted" style={{ margin: 0 }}>Version</p>
              </div>
            </div>

            <label className="cms-kicker">Search</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, driver, implication, sector..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            />

            <p className="cms-muted" style={{ marginTop: 12 }}>
              Showing {filtered.length} workbench packages.
            </p>
          </section>

          <section style={{ display: "grid", gap: 14, marginTop: 16 }}>
            {filtered.map((pkg) => {
              const intel = pkg.intelligence_package ?? {};
              const signal = intel.signal ?? {};
              const coverage = pkg.coverage ?? {};

              return (
                <article className="cms-card" key={pkg.candidate_id}>
                  <p className="cms-kicker">
                    {statusIcon(pkg.workbench_status)} {pkg.workbench_status}
                  </p>

                  <h2 style={{ marginTop: 0 }}>{pkg.candidate_title}</h2>

                  <p className="cms-muted">
                    {pkg.candidate?.country} · {pkg.candidate?.category} · {intel.recommended_format ?? "n/a"}
                  </p>

                  <p>{pkg.candidate?.excerpt}</p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <div className="cms-card">
                      <strong>Driver</strong>
                      <p>{intel.source_driver?.driver_name ?? pkg.candidate?.primary_driver ?? "n/a"}</p>
                    </div>

                    <div className="cms-card">
                      <strong>Confidence</strong>
                      <p>
                        {signal.confidence_tier ?? pkg.candidate?.confidence_band ?? "n/a"} · {pct(signal.confidence_score ?? pkg.candidate?.confidence_score)}
                      </p>
                    </div>

                    <div className="cms-card">
                      <strong>Evidence</strong>
                      <p>
                        {signal.case_count ?? pkg.candidate?.source_case_count ?? "n/a"} cases · {pkg.candidate?.evidence_count ?? "n/a"} signals
                      </p>
                    </div>

                    <div className="cms-card">
                      <strong>Data Coverage</strong>
                      <p>
                        {coverage.verified_dataset_count ?? 0}/{coverage.required_dataset_count ?? 0} datasets
                      </p>
                    </div>
                  </div>

                  {pkg.workbench_status !== "workbench_ready" && (
                    <section
                      className="cms-card"
                      style={{
                        marginTop: 16,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                      }}
                    >
                      <p className="cms-kicker">Readiness Block</p>
                      <h3 style={{ marginTop: 0 }}>Article generation blocked</h3>

                      <p>
                        {pkg.readiness_decision?.decision_reason ??
                          "This candidate is blocked by the readiness gate."}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: 12,
                          marginTop: 12,
                        }}
                      >
                        <div className="cms-card">
                          <strong>Verified</strong>
                          <p>{pkg.coverage?.verified_dataset_count ?? 0}</p>
                        </div>

                        <div className="cms-card">
                          <strong>Required</strong>
                          <p>{pkg.coverage?.required_dataset_count ?? 0}</p>
                        </div>

                        <div className="cms-card">
                          <strong>Missing</strong>
                          <p>{pkg.coverage?.missing_dataset_count ?? 0}</p>
                        </div>
                      </div>

                      {(pkg.readiness_decision?.missing_datasets ?? []).length > 0 && (
                        <section className="cms-card" style={{ marginTop: 12 }}>
                          <p className="cms-kicker">Missing Datasets</p>
                          <ul>
                            {pkg.readiness_decision.missing_datasets.map((dataset: any) => (
                              <li key={dataset.dataset_id}>
                                <strong>{dataset.name}</strong>
                                <br />
                                <span className="cms-muted">
                                  {dataset.dataset_id} · {dataset.importance} · {dataset.verification_status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {(pkg.missing_datasets ?? []).length > 0 && (
                        <section className="cms-card" style={{ marginTop: 12 }}>
                          <p className="cms-kicker">Blocked Workbench Sections</p>
                          <ul>
                            {(pkg.missing_datasets ?? []).map((dataset: any) => (
                              <li key={dataset.dataset_id}>
                                Dataset requirement not satisfied: <strong>{dataset.name}</strong>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </section>
                  )}

                  <section className="cms-card" style={{ marginTop: 16 }}>
                    <p className="cms-kicker">Business Implication</p>
                    <p>{intel.business_implication ?? "n/a"}</p>
                  </section>

                  <section className="cms-card" style={{ marginTop: 16 }}>
                    <p className="cms-kicker">Why It Matters</p>
                    <p>{intel.why_it_matters ?? "n/a"}</p>
                    <p className="cms-muted">
                      Affected sectors: {(intel.affected_sectors ?? []).join(", ") || "n/a"}
                    </p>
                  </section>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <section className="cms-card">
                      <p className="cms-kicker">Graph Packages</p>
                      <p>{pkg.graph_packages?.length ?? 0} graph-ready packages</p>
                      <ul>
                        {(pkg.graph_packages ?? []).slice(0, 5).map((graph: any) => (
                          <li key={graph.graph_package_id}>
                            {graph.title} · YoY {graph.latest_yoy_percent ?? "n/a"}%
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="cms-card">
                      <p className="cms-kicker">Evidence Patterns</p>
                      <ul>
                        {(intel.evidence_patterns ?? []).slice(0, 8).map((item: any) => (
                          <li key={item.phrase}>
                            {item.phrase} · {item.count}
                          </li>
                        ))}
                      </ul>
                    </section>
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
