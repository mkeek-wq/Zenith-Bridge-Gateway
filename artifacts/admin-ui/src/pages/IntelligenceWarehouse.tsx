export default function IntelligenceWarehouse() {
  return (
    <div className="cms-page">
      <section className="cms-card">
        <p className="cms-kicker">Phase H5 · Read-only Control Room</p>
        <h1>🧠 Intelligence Warehouse</h1>
        <p>
          Internal visibility layer for ZNBW intelligence engines, packages,
          maturity, dependencies and hidden product surfaces.
        </p>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <section className="cms-card">
          <p className="cms-kicker">Build Engines</p>
          <h2>334</h2>
          <p>Executable build scripts discovered in the repository.</p>
        </section>

        <section className="cms-card">
          <p className="cms-kicker">Intelligence Files</p>
          <h2>788</h2>
          <p>Files related to intelligence generation, orchestration and outputs.</p>
        </section>

        <section className="cms-card">
          <p className="cms-kicker">Data Packages</p>
          <h2>138</h2>
          <p>Current intelligence packages available under data/intelligence.</p>
        </section>
      </div>

      <section className="cms-card">
        <p className="cms-kicker">Engine Maturity</p>
        <h2>Maturity Matrix</h2>
        <ul>
          <li>🟢 Surfaced: Article Workbench, CMS Publication</li>
          <li>🟡 Integrated: Macro Attribution, Decision Support, Evidence, Dataset Coverage</li>
          <li>🟠 Hidden: Replay, Forecast, Historian, Driver Diversity, Case Construction</li>
          <li>⚪ Prototype: Client Portal</li>
          <li>🔴 Productized: None yet</li>
        </ul>
      </section>

      <section className="cms-card">
        <p className="cms-kicker">Hidden Capabilities</p>
        <h2>Systems Ready for Surfacing</h2>
        <ul>
          <li>Replay ecosystem</li>
          <li>Forecast ecosystem</li>
          <li>Decision support chain</li>
          <li>Macro attribution chain</li>
          <li>Case construction and mechanism promotion</li>
        </ul>
      </section>

      <section className="cms-card">
        <p className="cms-kicker">Recommended Product Sequence</p>
        <h2>Next Surfaces</h2>
        <ol>
          <li>Intelligence Warehouse UI</li>
          <li>Replay Dashboard</li>
          <li>Forecast Dashboard</li>
          <li>Decision Dashboard</li>
          <li>Client Portal integration</li>
        </ol>
      </section>

      <section className="cms-card">
        <p className="cms-kicker">Architecture References</p>
        <h2>H4 Documents</h2>
        <ul>
          <li>INTELLIGENCE_ORCHESTRATION_ARCHITECTURE_v0.1.md</li>
          <li>PRODUCT_SURFACE_GAP_ANALYSIS_v0.1.md</li>
          <li>ENGINE_MATURITY_MATRIX_v0.1.md</li>
          <li>DEPENDENCY_MAP_v0.1.md</li>
        </ul>
      </section>
    </div>
  );
}
