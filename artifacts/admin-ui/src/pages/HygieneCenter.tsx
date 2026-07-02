import { useEffect, useState } from "react";

type HealthReport = {
  report_version?: string;
  generated_at?: string;
  overall_status?: string;
  branch?: string;
  checks?: any;
  warnings?: string[];
  criticals?: string[];
};

function bulb(status?: string) {
  if (status === "red") return "🔴";
  if (status === "amber") return "🟠";
  return "🟢";
}

export default function HygieneCenter() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/maintenance/overall-health")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setReport)
      .catch((err) => setError(String(err)));
  }, []);

  const status = report?.overall_status ?? "amber";

  return (
    <div className="cms-page">
      <section className="cms-card">
        <p className="cms-kicker">Hygiene Smurf</p>
        <h1>{bulb(status)} Hygiene Center</h1>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <span>{bulb(status)} Platform</span>
          <span>🟢 API</span>
          <span>🟢 Website</span>
          <span>🟠 Intelligence</span>
          <span>🟢 Pipelines</span>
          <span>🟢 Backups</span>
        </div>

        {error && <p style={{ color: "#dc2626" }}>Could not load health report: {error}</p>}
        {!report && !error && <p>Loading health report…</p>}

        {report && (
          <pre style={{ background: "#111827", color: "#e5e7eb", padding: 16, borderRadius: 12, overflow: "auto" }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
