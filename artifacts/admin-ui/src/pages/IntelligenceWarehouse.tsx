import { useEffect, useMemo, useState } from "react";

type CapabilityCounts = Record<string, number>;

type WarehouseItem = {
  name: string;
  path: string;
  capability: string;
  extension?: string;
};

type WarehouseRegistry = {
  version: string;
  generated_at: string;
  doctrine: string;
  summary: {
    engine_count: number;
    intelligence_file_count: number;
    engine_capability_counts: CapabilityCounts;
    package_capability_counts: CapabilityCounts;
  };
  capabilities: string[];
  engines: WarehouseItem[];
  packages: WarehouseItem[];
  recommended_use: string;
};

function formatCapability(value: string) {
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

function topCapabilities(counts: CapabilityCounts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

export default function IntelligenceWarehouse() {
  const [registry, setRegistry] = useState<WarehouseRegistry | null>(null);
  const [error, setError] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState("all");

  useEffect(() => {
    fetch("/admin/intelligence-data/intelligence-warehouse-registry-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Warehouse registry load failed: ${res.status}`);
        return res.json();
      })
      .then(setRegistry)
      .catch((err) => setError(err?.message || "Warehouse registry load failed"));
  }, []);

  const capabilityRows = useMemo(() => {
    if (!registry) return [];

    return registry.capabilities
      .map((capability) => ({
        capability,
        engines: registry.summary.engine_capability_counts[capability] ?? 0,
        packages: registry.summary.package_capability_counts[capability] ?? 0,
      }))
      .sort((a, b) => b.engines + b.packages - (a.engines + a.packages));
  }, [registry]);

  const visibleEngines = useMemo(() => {
    if (!registry) return [];

    return registry.engines
      .filter((engine) => capabilityFilter === "all" || engine.capability === capabilityFilter)
      .slice(0, 80);
  }, [registry, capabilityFilter]);

  const visiblePackages = useMemo(() => {
    if (!registry) return [];

    return registry.packages
      .filter((pkg) => capabilityFilter === "all" || pkg.capability === capabilityFilter)
      .slice(0, 80);
  }, [registry, capabilityFilter]);

  return (
    <div className="cms-page">
      <section className="cms-card">
        <p className="cms-kicker">Phase H5.1 · Dynamic Control Room</p>
        <h1>🧠 Intelligence Warehouse</h1>
        <p>
          Internal visibility layer for ZNBW intelligence engines, packages,
          maturity, dependencies and hidden product surfaces.
        </p>
      </section>

      {error && (
        <section className="cms-card">
          <p className="cms-kicker">Warehouse Registry Error</p>
          <h2>Warehouse registry unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!registry && !error && (
        <section className="cms-card">
          <p>Loading warehouse registry...</p>
        </section>
      )}

      {registry && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <section className="cms-card">
              <p className="cms-kicker">Build Engines</p>
              <h2>{registry.summary.engine_count}</h2>
              <p>Executable TypeScript scripts discovered under api-server/src/scripts.</p>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Intelligence Files</p>
              <h2>{registry.summary.intelligence_file_count}</h2>
              <p>JSON and CSV files discovered under data/intelligence.</p>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Dominant Hidden System</p>
              <h2>Replay</h2>
              <p>{registry.summary.engine_capability_counts.replay ?? 0} replay engines discovered.</p>
            </section>
          </div>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Capability Matrix</p>
            <h2>Engine and Package Distribution</h2>

            <div style={{ display: "grid", gap: 8 }}>
              {capabilityRows.map((row) => (
                <div
                  key={row.capability}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <strong>{formatCapability(row.capability)}</strong>
                  <span>{row.engines} engines</span>
                  <span>{row.packages} packages</span>
                </div>
              ))}
            </div>

            <p className="cms-muted" style={{ marginTop: 12 }}>
              {registry.version} · generated {formatDate(registry.generated_at)}
            </p>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Capability Filter</p>
            <h2>Registry Explorer</h2>

            <select
              value={capabilityFilter}
              onChange={(event) => setCapabilityFilter(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <option value="all">All capabilities</option>
              {registry.capabilities.map((capability) => (
                <option value={capability} key={capability}>
                  {formatCapability(capability)}
                </option>
              ))}
            </select>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <section className="cms-card">
              <p className="cms-kicker">Engine Registry</p>
              <h2>Scripts</h2>
              <p className="cms-muted">
                Showing {visibleEngines.length} of {registry.engines.length}.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {visibleEngines.map((engine) => (
                  <div key={engine.path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <strong>{engine.name}</strong>
                    <p className="cms-muted" style={{ margin: 0 }}>{formatCapability(engine.capability)}</p>
                    <code>{engine.path}</code>
                  </div>
                ))}
              </div>
            </section>

            <section className="cms-card">
              <p className="cms-kicker">Package Registry</p>
              <h2>Data Files</h2>
              <p className="cms-muted">
                Showing {visiblePackages.length} of {registry.packages.length}.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {visiblePackages.map((pkg) => (
                  <div key={pkg.path} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <strong>{pkg.name}</strong>
                    <p className="cms-muted" style={{ margin: 0 }}>{formatCapability(pkg.capability)}</p>
                    <code>{pkg.path}</code>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Top Engine Capabilities</p>
            <h2>What the Repository Is Telling Us</h2>
            <ol>
              {topCapabilities(registry.summary.engine_capability_counts).map(([capability, count]) => (
                <li key={capability}>
                  <strong>{formatCapability(capability)}</strong>: {count} engines
                </li>
              ))}
            </ol>
          </section>

          <section className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-kicker">Recommended Use</p>
            <p>{registry.recommended_use}</p>
            <p className="cms-muted">{registry.doctrine}</p>
          </section>
        </>
      )}
    </div>
  );
}
