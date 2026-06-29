import fs from "fs";
import path from "path";

const briefPath = path.join(process.cwd(), "data/article-generator/article-brief-package-v0.2.json");
const metricsPath = path.join(process.cwd(), "data/article-generator/verified-metrics-registry-v0.1.json");

if (!fs.existsSync(briefPath)) throw new Error(`Missing input: ${briefPath}`);
if (!fs.existsSync(metricsPath)) throw new Error(`Missing input: ${metricsPath}`);

const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(metricsPath, "utf8"));

const visuals = brief.visual_brief.map((v: any) => {
  const matchingMetrics = registry.metrics.filter((m: any) =>
    v.message.toLowerCase().includes("size")
      ? m.claim_supported.toLowerCase().includes("size") ||
        m.claim_supported.toLowerCase().includes("disproportionate")
      : v.message.toLowerCase().includes("energy")
        ? m.claim_supported.toLowerCase().includes("energy") ||
          m.claim_supported.toLowerCase().includes("jurong")
        : false
  );

  const verifiedMetrics = matchingMetrics.filter((m: any) => m.verified);

  return {
    graph_id: `GOG_${v.visual_id}`,
    seed_id: registry.seed_id,
    title: v.title,
    visual_type: v.visual_type,
    evidence_type: v.evidence_type,
    message: v.message,
    required_metric_ids: matchingMetrics.map((m: any) => m.metric_id),
    verified_metric_ids: verifiedMetrics.map((m: any) => m.metric_id),
    graph_ready: v.evidence_type === "qualitative" ? true : verifiedMetrics.length > 0,
    publish_status:
      v.evidence_type === "qualitative"
        ? "conceptual_visual_allowed"
        : verifiedMetrics.length > 0
          ? "quantitative_graph_allowed"
          : "blocked_pending_verified_metrics",
    notes: v.publish_guidance,
  };
});

const output = {
  generator_version: "graph-opportunity-generator-v0.1",
  generated_at: new Date().toISOString(),
  input_brief: brief.package_version,
  input_metrics_registry: registry.registry_version,
  seed_id: registry.seed_id,
  summary: {
    total_graph_opportunities: visuals.length,
    ready_now: visuals.filter((v: any) => v.graph_ready).length,
    blocked: visuals.filter((v: any) => !v.graph_ready).length,
  },
  graph_opportunities: visuals,
};

const outDir = path.join(process.cwd(), "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "graph-opportunity-generator-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  generator_version: output.generator_version,
  total_graph_opportunities: output.summary.total_graph_opportunities,
  ready_now: output.summary.ready_now,
  blocked: output.summary.blocked,
  output: outPath,
});
