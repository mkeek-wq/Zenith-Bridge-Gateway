import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const workbench = readJson(path.join(root, "exports/article-generator/interpretation-workbench-package-v0.1.json"));
const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const visual = readJson(path.join(root, "exports/article-generator/concept-visual-package-v0.2.json"));

const missingData = publication.missing_data ?? [];

const graphTasks = (visual.visuals ?? []).map((v: any) => {
  const requiredMetrics =
    v.required_metric_ids && v.required_metric_ids.length > 0
      ? v.required_metric_ids
      : [];

  const suggestedSources =
    v.publish_status === "blocked_pending_verified_metrics"
      ? ["Singapore Department of Statistics", "Maritime and Port Authority of Singapore", "World Bank", "IEA"]
      : ["SMURF evidence package", "ZNBW editorial interpretation"];

  return {
    graph_task_id: `GDW_${v.visual_id}`,
    visual_id: v.visual_id,
    chart_title: v.chart_title,
    chart_type: v.chart_type,
    publish_status: v.publish_status,
    chart_purpose: v.chart_purpose,
    data_status:
      v.publish_status === "blocked_pending_verified_metrics"
        ? "manual_verified_data_required"
        : "conceptual_visual_possible",
    required_metric_ids: requiredMetrics,
    suggested_metric_needs:
      v.publish_status === "blocked_pending_verified_metrics"
        ? [
            "Singapore petroleum or refining output trend",
            "Relevant comparator metric for Singapore size or influence",
            "Source-backed denominator or benchmark",
          ]
        : [
            "No exact metric required if published as conceptual visual",
            "Use labels that describe mechanism, not measured values",
          ],
    preferred_sources: suggestedSources,
    publication_use:
      v.publish_status === "blocked_pending_verified_metrics"
        ? "Do not use until verified metrics are available."
        : "Can support article explanation as conceptual visual.",
    graph_ready: v.publish_status === "conceptual_ready",
  };
});

const output = {
  package_version: "graph-data-workbench-package-v0.1",
  generated_at: new Date().toISOString(),
  source_interpretation_workbench: workbench.package_version,
  article_identity: workbench.article_identity,

  graph_tasks: graphTasks,

  data_request_summary: {
    total_graph_tasks: graphTasks.length,
    conceptual_possible: graphTasks.filter((g: any) => g.data_status === "conceptual_visual_possible").length,
    manual_verified_data_required: graphTasks.filter((g: any) => g.data_status === "manual_verified_data_required").length,
    open_data_requests: missingData.length,
  },

  open_data_requests: missingData,

  minimum_data_for_publishable_article: [
    {
      priority: "high",
      metric: "Singapore petroleum-related manufacturing output trend",
      preferred_source: "Singapore Department of Statistics",
      needed_for: "article claim support and possible line chart",
    },
    {
      priority: "medium",
      metric: "Regional or global fuel demand / jet fuel demand indicator",
      preferred_source: "IEA or relevant official aviation/energy source",
      needed_for: "macro context",
    },
    {
      priority: "medium",
      metric: "Shipping, bunkering, or logistics activity indicator",
      preferred_source: "Maritime and Port Authority of Singapore",
      needed_for: "business implication support",
    },
  ],

  graph_governance_rules: [
    "No exact values unless stored in verified metrics registry.",
    "No comparative ranking unless backed by official or high-authority source.",
    "Conceptual visuals must be labelled as conceptual.",
    "Quantitative charts require verified source, metric name, observation period, and unit.",
  ],
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "graph-data-workbench-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  graph_tasks: output.graph_tasks.length,
  conceptual_possible: output.data_request_summary.conceptual_possible,
  manual_verified_data_required: output.data_request_summary.manual_verified_data_required,
  output: outPath,
});
