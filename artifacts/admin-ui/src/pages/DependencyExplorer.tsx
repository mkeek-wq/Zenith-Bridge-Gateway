import { useEffect, useMemo, useState } from "react";

type CountMap = Record<string, number>;

type DependencyScript = {
  script_name: string;
  script_path: string;
  ecosystem: string;
  reads: string[];
  writes: string[];
  read_count: number;
  write_count: number;
  upstream_scripts: string[];
  downstream_scripts: string[];
  fan_in: number;
  fan_out: number;
};

type DependencyPackage = {
  package_path: string;
  producers: string[];
  consumers: string[];
  producer_count: number;
  consumer_count: number;
  status: string;
};

type DependencyRegistry = {
  registry_version: string;
  generated_at: string;
  doctrine: Record<string, boolean>;
  summary: {
    scripts_scanned: number;
    scripts_with_reads: number;
    scripts_with_writes: number;
    packages_referenced: number;
    packages_with_producers: number;
    packages_with_consumers: number;
    orphan_outputs: number;
    referenced_missing_packages: number;
  };
  ecosystems: CountMap;
  scripts: DependencyScript[];
  packages: DependencyPackage[];
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
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

function topEntries<T>(items: T[], selector: (item: T) => number, limit = 12) {
  return [...items].sort((a, b) => selector(b) - selector(a)).slice(0, limit);
}

export default function DependencyExplorer() {
  const [registry, setRegistry] = useState<DependencyRegistry | null>(null);
  const [error, setError] = useState("");
  const [ecosystemFilter, setEcosystemFilter] = useState("all");

  useEffect(() => {
    fetch("/admin/intelligence-data/dependency-registry-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Dependency registry load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Dependency registry load failed"));
  }, []);

  const ecosystemRows = useMemo(() => {
    if (!registry) return [];

    return Object.entries(registry.ecosystems).sort((a, b) => b[1] - a[1]);
  }, [registry]);

  const visibleScripts = useMemo(() => {
    if (!registry) return [];

    return registry.scripts
      .filter((script) => ecosystemFilter === "all" || script.ecosystem === ecosystemFilter)
      .slice(0, 100);
  }, [registry, ecosystemFilter]);

  const orphanPackages = useMemo(() => {
    if (!registry) return [];

    return registry.packages
      .filter((pkg) => pkg.producer_count > 0 && pkg.consumer_count === 0)
      .slice(0, 50);
  }, [registry]);

  const missingPackages = useMemo(() => {
    if (!registry) return [];

    return registry.packages
      .filter((pkg) => pkg.status !== "exists")
      .slice(0, 50);
  }, [registry]);

  const topFanIn = useMemo(() => {
    if (!registry) return [];

    return topEntries(registry.scripts, (script) => script.fan_in, 10);
  }, [registry]);

  const topFanOut = useMemo(() => {
    if (!registry) return [];

    return topEntries(registry.scripts, (script) => script.fan_out, 10);
  }, [registry]);

  const visiblePackages = useMemo(() => {
    if (!registry) return [];

    return registry.packages.slice(0, 100);
  }, [registry]);

  return (
    <div className="cms-page">
      <section className="cms-card">
        <p className="cms-kicker">Phase H5.2 · Dependency Visibility</p>
        <h1>🕸️ Dependency Explorer</h1>
        <p>
          Repository-wide visibility layer for inferred script and package dependencies.
          This registry is discovery, not truth.
        </p>
      </section>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Dependency Registry Error</p>
          <h2>Dependency registry unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading dependency registry...</p>
        </section>
      )}

      {registry && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <section className="cms-card">
              <p className="cms-kicker">Scripts Scanned</p>
              <h2>{registry.summary.scripts_scanned}</h2>
              <p>TypeScript scripts scanned for inferred dependency references.</p>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Packages Referenced</p>
              <h2>{registry.summary.packages_referenced}</h2>
              <p>Data packages referenced by scripts across the intelligence ecosystem.</p>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Readers / Writers</p>
              <h2>{registry.summary.scripts_with_reads} / {registry.summary.scripts_with_writes}</h2>
              <p>Scripts with inferred reads and writes.</p>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Dependency Health</p>
              <h2>{registry.summary.orphan_outputs} / {registry.summary.referenced_missing_packages}</h2>
              <p>Orphan outputs and referenced missing packages.</p>
            </section>
          </div>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Ecosystem Distribution</p>
            <h2>Where the Dependency Surface Lives</h2>

            <div style={{ display: "grid", gap: 8 }}>
              {ecosystemRows.map(([ecosystem, count]) => (
                <div
                  key={ecosystem}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <strong>{formatLabel(ecosystem)}</strong>
                  <span>{count} scripts</span>
                </div>
              ))}
            </div>

            <p className="cms-muted" style={{ marginTop: 12 }}>
              {registry.registry_version} · generated {formatDate(registry.generated_at)}
            </p>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Ecosystem Filter</p>
            <h2>Script Explorer</h2>

            <select
              value={ecosystemFilter}
              onChange={(event) => setEcosystemFilter(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <option value="all">All ecosystems</option>
              {ecosystemRows.map(([ecosystem]) => (
                <option value={ecosystem} key={ecosystem}>
                  {formatLabel(ecosystem)}
                </option>
              ))}
            </select>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Scripts</p>
            <h2>Inferred Script Dependencies</h2>
            <p className="cms-muted">
              Showing {visibleScripts.length} of {registry.scripts.length}.
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {visibleScripts.map((script) => (
                <div
                  key={script.script_path}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 120px 90px 90px 90px 90px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <strong>{script.script_name}</strong>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      <code>{script.script_path}</code>
                    </p>
                  </div>
                  <span>{formatLabel(script.ecosystem)}</span>
                  <span>{script.read_count} reads</span>
                  <span>{script.write_count} writes</span>
                  <span>{script.fan_in} in</span>
                  <span>{script.fan_out} out</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <section className="cms-card">
              <p className="cms-kicker">Top Fan-In</p>
              <h2>Most Depended-Upon Scripts</h2>

              <div style={{ display: "grid", gap: 8 }}>
                {topFanIn.map((script) => (
                  <div key={script.script_path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <strong>{script.script_name}</strong>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      {script.fan_in} upstream · {formatLabel(script.ecosystem)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Top Fan-Out</p>
              <h2>Broadest Downstream Scripts</h2>

              <div style={{ display: "grid", gap: 8 }}>
                {topFanOut.map((script) => (
                  <div key={script.script_path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <strong>{script.script_name}</strong>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      {script.fan_out} downstream · {formatLabel(script.ecosystem)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Packages</p>
            <h2>Package Dependency Registry</h2>
            <p className="cms-muted">
              Showing {visiblePackages.length} of {registry.packages.length}.
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {visiblePackages.map((pkg) => (
                <div
                  key={pkg.package_path}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px 130px 120px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <code>{pkg.package_path}</code>
                  <span>{pkg.producer_count} producers</span>
                  <span>{pkg.consumer_count} consumers</span>
                  <span>{pkg.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <section className="cms-card">
              <p className="cms-kicker">Orphan Outputs</p>
              <h2>Produced but Not Consumed</h2>
              <p className="cms-muted">
                These may be dead ends, future systems, or packages awaiting integration.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {orphanPackages.map((pkg) => (
                  <div key={pkg.package_path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <code>{pkg.package_path}</code>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      {pkg.producer_count} producers · {pkg.consumer_count} consumers
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Missing Dependencies</p>
              <h2>Referenced but Missing</h2>
              <p className="cms-muted">
                These references should be reviewed before orchestration depends on them.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {missingPackages.map((pkg) => (
                  <div key={pkg.package_path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <code>{pkg.package_path}</code>
                    <p className="cms-muted" style={{ margin: 0 }}>
                      {pkg.producer_count} producers · {pkg.consumer_count} consumers · {pkg.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Doctrine</p>
            <h2>How to Read This Registry</h2>
            <ul>
              {Object.entries(registry.doctrine).map(([key, value]) => (
                <li key={key}>
                  <strong>{formatLabel(key)}</strong>: {value ? "yes" : "no"}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
