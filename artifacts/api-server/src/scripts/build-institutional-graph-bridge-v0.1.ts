import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const sectorRegistry = readJson(
  path.join(root, "exports/article-generator/sector-performance-registry-v0.1.json")
);

const quantReport = readJson(
  path.join(root, "exports/article-generator/article-quant-readiness-report-v0.1.json")
);

const verifiedSectorMetrics = (sectorRegistry.metrics ?? []).filter(
  (m: any) => m.governance?.graph_use_allowed === true
);

const institutionalGraphReady = verifiedSectorMetrics.length >= 3;

const output = {
  package_version: "institutional-graph-bridge-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: quantReport.article_identity,
  source_sector_registry: sectorRegistry.registry_version,
  source_quant_report: quantReport.report_version,

  readiness: {
    verified_sector_metrics: verifiedSectorMetrics.length,
    institutional_graph_ready: institutionalGraphReady,
    readiness_band:
      verifiedSectorMetrics.length >= 4
        ? "strong"
        : verifiedSectorMetrics.length >= 3
        ? "moderate"
        : verifiedSectorMetrics.length >= 1
        ? "limited"
        : "weak"
  },

  graph_strategy: institutionalGraphReady
    ? {
        allowed: true,
        recommended_visual: "multi-sector institutional comparison chart",
        description:
          "Use verified sector metrics to compare petroleum against related manufacturing and logistics-linked sectors."
      }
    : {
        allowed: false,
        recommended_visual: "one simple quantitative chart plus conceptual visuals",
        description:
          "Additional verified sector metrics are required before publishing a multi-sector institutional chart."
      },

  graph_ready_dataset: verifiedSectorMetrics.map((m: any) => ({
    sector: m.sector,
    period: m.period,
    metric: m.metric,
    value: m.value,
    unit: m.unit,
    source_name: m.source_name,
    source_url: m.source_url
  })),

  missing_for_institutional_graph: (sectorRegistry.metrics ?? [])
    .filter((m: any) => !m.governance?.graph_use_allowed)
    .map((m: any) => ({
      sector: m.sector,
      metric: m.metric,
      status: "needs_verified_value",
      required_fields: ["period", "value", "source_name", "source_url"]
    })),

  governance_rules: [
    "Institutional ZNBW graphs require at least three verified related metrics.",
    "One verified metric permits a simple quantitative visual only.",
    "Conceptual visuals remain allowed without quantitative claims.",
    "Charts must not imply relationships unsupported by verified data.",
    "Graphs carry numerical density; article text carries interpretation."
  ]
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "institutional-graph-bridge-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: quantReport.article_identity.title,
  verified_sector_metrics: output.readiness.verified_sector_metrics,
  readiness_band: output.readiness.readiness_band,
  institutional_graph_ready: output.readiness.institutional_graph_ready,
  output: outPath
});
