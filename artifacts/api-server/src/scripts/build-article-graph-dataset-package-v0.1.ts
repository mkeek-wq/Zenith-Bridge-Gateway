import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const quant = readJson(
  path.join(root, "exports/article-generator/article-quant-dataset-registry-v0.1.json")
);

const graphReview = readJson(
  path.join(root, "exports/article-generator/verified-graph-readiness-review-v0.1.json")
);

const datasets = quant.datasets ?? [];

const graphPackages = (graphReview.graph_tasks ?? []).map((task: any) => {
  const matchedDatasets = datasets.filter((d: any) => {
    const haystack = `${task.chart_title} ${task.chart_purpose} ${task.suggested_metric_needs?.join(" ")}`.toLowerCase();
    const metric = `${d.metric_id} ${d.metric_name}`.toLowerCase();

    return (
      haystack.includes("petroleum") && metric.includes("petroleum") ||
      haystack.includes("bunker") && metric.includes("bunker") ||
      haystack.includes("fuel") && metric.includes("fuel") ||
      haystack.includes("manufacturing") && metric.includes("manufacturing") ||
      haystack.includes("logistics") && metric.includes("logistics")
    );
  });

  return {
    graph_package_id: `GDS_${task.visual_id}`,
    visual_id: task.visual_id,
    chart_title: task.chart_title,
    chart_type: task.chart_type,
    graph_status:
      matchedDatasets.length > 0
        ? "graph_dataset_ready"
        : task.graph_ready_after_metric_review
        ? "conceptual_only"
        : "blocked",
    datasets: matchedDatasets,
    recommended_use:
      matchedDatasets.length > 0
        ? "May be used for quantitative graph."
        : task.graph_ready_after_metric_review
        ? "Use as conceptual graph only."
        : "Do not publish until verified data is available.",
    governance_note:
      matchedDatasets.length > 0
        ? "Quantitative graph allowed using verified metric dataset."
        : "No verified quantitative dataset attached.",
  };
});

const output = {
  package_version: "article-graph-dataset-package-v0.1",
  generated_at: new Date().toISOString(),
  source_quant_registry: quant.registry_version,
  source_graph_review: graphReview.package_version,
  article_identity: quant.article_identity,
  graph_packages: graphPackages,
  summary: {
    total_graph_packages: graphPackages.length,
    quantitative_ready: graphPackages.filter((g: any) => g.graph_status === "graph_dataset_ready").length,
    conceptual_only: graphPackages.filter((g: any) => g.graph_status === "conceptual_only").length,
    blocked: graphPackages.filter((g: any) => g.graph_status === "blocked").length,
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-graph-dataset-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: quant.article_identity.title,
  quantitative_ready: output.summary.quantitative_ready,
  conceptual_only: output.summary.conceptual_only,
  blocked: output.summary.blocked,
  output: outPath,
});
