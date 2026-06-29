import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const quantReport = readJson(
  path.join(root, "exports/article-generator/article-quant-readiness-report-v0.1.json")
);

const graphBridge = readJson(
  path.join(root, "exports/article-generator/institutional-graph-bridge-v0.1.json")
);

const fetchTargets = readJson(
  path.join(root, "exports/article-generator/tablebuilder-fetch-target-registry-v0.1.json")
);

const institutionalGraphReady = graphBridge.readiness?.institutional_graph_ready === true;

const rawMissing = graphBridge.missing_for_institutional_graph ?? [];
const missing = institutionalGraphReady ? [] : rawMissing;

const institutionalScore =
  institutionalGraphReady ? 90 :
  graphBridge.readiness?.verified_sector_metrics >= 2 ? 60 :
  graphBridge.readiness?.verified_sector_metrics === 1 ? 35 :
  15;

const output = {
  report_version: "quant-gap-analysis-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: quantReport.article_identity,
  source_quant_report: quantReport.report_version,
  source_institutional_graph_bridge: graphBridge.package_version,
  source_fetch_target_registry: fetchTargets.registry_version,

  current_scores: {
    quant_readiness_score: quantReport.quant_readiness_score,
    quant_readiness_band: quantReport.quant_readiness_band,
    institutional_graph_score: institutionalScore,
    institutional_graph_band:
      institutionalScore >= 85 ? "strong" :
      institutionalScore >= 65 ? "moderate" :
      institutionalScore >= 40 ? "limited" :
      "weak"
  },

  current_state: {
    quantitative_article_allowed:
      quantReport.publication_guidance?.quantitative_article_allowed ?? false,
    dense_quantitative_article_allowed:
      quantReport.publication_guidance?.dense_quantitative_article_allowed ?? false,
    institutional_graph_ready: institutionalGraphReady,
    verified_sector_metrics:
      graphBridge.readiness?.verified_sector_metrics ?? 0,
    required_verified_sector_metrics: 3
  },

  gaps: missing.map((m: any) => ({
    gap_id: `GAP_${m.sector.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
    sector: m.sector,
    metric: m.metric,
    missing_fields: m.required_fields,
    blocker_type: "missing_verified_sector_metric",
    priority: "high",
    target_registry_match:
      (fetchTargets.targets ?? []).find((t: any) => t.sector === m.sector)?.target_id ?? null
  })),

  publication_decision: {
    article_publishable: true,
    publishable_as:
      institutionalGraphReady
        ? "institutional_quantified_article"
        : "interpretation_article_with_limited_quantification",
    recommended_graph_strategy:
      institutionalGraphReady
        ? "Use institutional multi-sector graph package."
        : "Use one verified quantitative chart plus conceptual visuals.",
    should_delay_publication_for_more_data:
      institutionalGraphReady ? false : "editorial_decision"
  },

  next_actions: institutionalGraphReady
    ? [
        "Replace any pipeline test values with official TableBuilder values before publication.",
        "Run sector-metric-integrity-guard.",
        "Generate institutional graph package."
      ]
    : [
        "Retrieve official TableBuilder sector values.",
        "Update sector-performance-input-v0.1.json after manual verification.",
        "Rerun sector-performance-registry and institutional-graph-bridge.",
        "Regenerate quant-gap-analysis after promotion."
      ]
};

const outPath = path.join(root, "exports/article-generator/quant-gap-analysis-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  report_version: output.report_version,
  quant_score: output.current_scores.quant_readiness_score,
  institutional_graph_score: output.current_scores.institutional_graph_score,
  institutional_graph_ready: output.current_state.institutional_graph_ready,
  gaps: output.gaps.length,
  output: outPath
});
