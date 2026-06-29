import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(path.join(root, "exports/article-generator/sector-performance-registry-v0.1.json"));
const bridge = readJson(path.join(root, "exports/article-generator/institutional-graph-bridge-v0.1.json"));
const packagePath = path.join(root, "exports/article-generator/publication-package-v0.1.json");
const publicationPackage = fs.existsSync(packagePath) ? readJson(packagePath) : {};

const metrics = (registry.metrics ?? []).filter((m: any) =>
  m.governance?.graph_use_allowed === true &&
  m.governance?.verified === true &&
  Number.isFinite(Number(m.value))
);

const graphReady = bridge.readiness?.institutional_graph_ready === true && metrics.length >= 3;

const output = {
  package_version: "institutional-graph-package-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: bridge.article_identity ?? publicationPackage.article_identity ?? null,
  source_sector_registry: registry.registry_version,
  source_graph_bridge: bridge.package_version,
  graph_ready: graphReady,
  graph_type: "multi_sector_comparison",
  title: "Singapore Manufacturing Output Growth by Sector",
  subtitle: "Year-on-year output growth, official verified sector metrics",
  y_axis: "Output growth (% YoY)",
  x_axis: "Sector",
  series: metrics.map((m: any) => ({
    sector: m.sector,
    period: m.period,
    metric: m.metric,
    value: m.value,
    unit: m.unit,
    source_name: m.source_name,
    source_url: m.source_url,
    verification_status: m.verification_status
  })),
  source_panel: metrics.map((m: any) => ({
    sector: m.sector,
    source_name: m.source_name,
    source_url: m.source_url,
    period: m.period,
    verification_status: m.verification_status
  })),
  rendering_instructions: {
    style: "institutional",
    header: "blue",
    title_text: "white",
    show_source_panel: true,
    show_verification_note: true,
    no_synthetic_data: true
  },
  governance: {
    synthetic_data_blocked: true,
    replay_data_blocked: true,
    verified_metrics_required: true,
    publication_allowed: graphReady
  },
  warnings: graphReady ? [] : ["Institutional graph package is not ready because verified graph-eligible metrics are insufficient."]
};

const outPath = path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  graph_ready: output.graph_ready,
  series: output.series.length,
  output: outPath
});
