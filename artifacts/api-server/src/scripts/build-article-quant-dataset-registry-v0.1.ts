import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const metrics = readJson(
  path.join(root, "exports/article-generator/manual-verified-metrics-registry-v0.1.json")
);

const article = readJson(
  path.join(root, "exports/article-generator/publication-article-v0.1.json")
);

const verifiedMetrics = (metrics.metrics ?? []).filter(
  (m: any) => m.verification?.verified === true
);

const datasets = verifiedMetrics.map((m: any) => ({
  dataset_id: `QDS_${m.metric_id}`,
  metric_id: m.metric_id,
  metric_name: m.metric_name,
  source_name: m.source_name,
  source_url: m.source_url,
  unit: m.unit,
  period: m.period,
  value: m.value,
  status: "verified_graph_eligible",
  governance: {
    verified: true,
    source_required: true,
    graph_use_allowed: true,
    article_claim_allowed: true,
    synthetic_data: false,
    sandbox_data: false,
  },
  used_for: m.used_for ?? [],
}));

const output = {
  registry_version: "article-quant-dataset-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_metrics_registry: metrics.registry_version,
  source_article_package: article.package_version,
  article_identity: article.article_identity,
  total_datasets: datasets.length,
  graph_eligible_datasets: datasets.filter((d: any) => d.governance.graph_use_allowed).length,
  datasets,
  governance_rules: [
    "Only verified metrics may enter the quant dataset registry.",
    "Synthetic replay evidence may not enter graph-ready datasets.",
    "Sandbox-only data may not enter graph-ready datasets.",
    "Every graph-ready dataset requires source, period, unit, and value.",
    "Article text may interpret; graphs may quantify.",
  ],
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-quant-dataset-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  title: article.article_identity.title,
  total_datasets: output.total_datasets,
  graph_eligible_datasets: output.graph_eligible_datasets,
  output: outPath,
});
