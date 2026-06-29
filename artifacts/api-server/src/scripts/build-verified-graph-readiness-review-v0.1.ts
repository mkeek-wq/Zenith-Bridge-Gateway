import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const graphWorkbench = readJson(
  path.join(root, "exports/article-generator/graph-data-workbench-package-v0.1.json")
);

const metricsRegistry = readJson(
  path.join(root, "exports/article-generator/manual-verified-metrics-registry-v0.1.json")
);

const verifiedMetrics = (metricsRegistry.metrics ?? []).filter(
  (m: any) => m.verification?.verified === true
);

const reviewTasks = (graphWorkbench.graph_tasks ?? []).map((task: any) => {
  const relatedMetrics = verifiedMetrics.filter((m: any) => {
    const text = `${task.chart_title} ${task.chart_purpose} ${task.suggested_metric_needs?.join(" ")}`.toLowerCase();
    return (
      text.includes("petroleum") && m.metric_id.includes("PETROLEUM") ||
      text.includes("fuel") && m.metric_id.includes("FUEL") ||
      text.includes("bunkering") && m.metric_id.includes("BUNKERING") ||
      text.includes("logistics") && m.metric_id.includes("LOGISTICS")
    );
  });

  const upgraded =
    task.publish_status === "blocked_pending_verified_metrics" &&
    relatedMetrics.length > 0;

  return {
    ...task,
    verified_metric_ids: relatedMetrics.map((m: any) => m.metric_id),
    verified_metric_count: relatedMetrics.length,
    readiness_after_metric_review: upgraded
      ? "quantitative_review_ready"
      : task.publish_status,
    graph_ready_after_metric_review:
      task.graph_ready === true || upgraded,
    review_note: upgraded
      ? "Previously blocked chart now has at least one verified metric and can move to quantitative review."
      : task.graph_ready
      ? "Conceptual visual remains usable."
      : "Still blocked pending verified metrics.",
  };
});

const output = {
  package_version: "verified-graph-readiness-review-v0.1",
  generated_at: new Date().toISOString(),
  source_graph_workbench: graphWorkbench.package_version,
  source_metrics_registry: metricsRegistry.registry_version,
  article_identity: graphWorkbench.article_identity,
  metrics_summary: {
    total_metrics: metricsRegistry.total_metrics,
    verified: metricsRegistry.verified,
    pending: metricsRegistry.pending,
    graph_ready: metricsRegistry.graph_ready,
  },
  graph_tasks: reviewTasks,
  graph_summary: {
    total: reviewTasks.length,
    graph_ready: reviewTasks.filter((g: any) => g.graph_ready_after_metric_review).length,
    quantitative_review_ready: reviewTasks.filter(
      (g: any) => g.readiness_after_metric_review === "quantitative_review_ready"
    ).length,
    still_blocked: reviewTasks.filter(
      (g: any) => g.graph_ready_after_metric_review === false
    ).length,
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "verified-graph-readiness-review-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  verified_metrics: output.metrics_summary.verified,
  graph_ready: output.graph_summary.graph_ready,
  quantitative_review_ready: output.graph_summary.quantitative_review_ready,
  still_blocked: output.graph_summary.still_blocked,
  output: outPath,
});
