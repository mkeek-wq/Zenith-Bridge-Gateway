import fs from "fs";
import path from "path";

type VisualType =
  | "ecosystem_diagram"
  | "comparison_chart"
  | "timeline"
  | string;

type MetricRecord = {
  metric_id: string;
  request_id: string;
  seed_id: string;
  country: string;
  metric_name: string;
  claim_supported: string;
  preferred_source: string;
  value: number | string | null;
  unit: string | null;
  period: string | null;
  source_url: string | null;
  verified: boolean;
  verification_status: string;
  article_ready: boolean;
  graph_ready: boolean;
  notes: string;
};

const briefPath = path.join(
  process.cwd(),
  "data/article-generator/article-brief-package-v0.2.json"
);

const metricsPath = path.join(
  process.cwd(),
  "data/article-generator/verified-metrics-registry-v0.1.json"
);

if (!fs.existsSync(briefPath)) throw new Error(`Missing input: ${briefPath}`);
if (!fs.existsSync(metricsPath)) throw new Error(`Missing input: ${metricsPath}`);

const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(metricsPath, "utf8"));

const metrics: MetricRecord[] = registry.metrics ?? [];

function metricDomains(metric: MetricRecord): string[] {
  const text = `${metric.metric_name} ${metric.claim_supported}`.toLowerCase();
  const domains: string[] = [];

  if (
    text.includes("bunkering") ||
    text.includes("maritime") ||
    text.includes("fuel")
  ) {
    domains.push("energy_trade");
  }

  if (
    text.includes("jurong") ||
    text.includes("chemicals") ||
    text.includes("petrochemical") ||
    text.includes("cluster")
  ) {
    domains.push("industrial_ecosystem");
  }

  if (
    text.includes("population") ||
    text.includes("gdp") ||
    text.includes("relative") ||
    text.includes("disproportionate") ||
    text.includes("size")
  ) {
    domains.push("strategic_positioning");
  }

  if (
    text.includes("demand") ||
    text.includes("macro") ||
    text.includes("outlook") ||
    text.includes("regional")
  ) {
    domains.push("macro_context");
  }

  return [...new Set(domains)];
}

function requiredDomainsForVisual(v: any): string[] {
  const visualType: VisualType = v.visual_type;

  if (visualType === "ecosystem_diagram") {
    return ["energy_trade", "industrial_ecosystem"];
  }

  if (visualType === "comparison_chart") {
    return ["energy_trade", "strategic_positioning"];
  }

  if (visualType === "timeline") {
    return ["industrial_ecosystem"];
  }

  return [];
}

function visualReadiness(v: any, matchingMetrics: MetricRecord[]) {
  const verifiedMetrics = matchingMetrics.filter((m) => m.verified);
  const graphReadyMetrics = matchingMetrics.filter((m) => m.graph_ready);

  if (v.evidence_type === "qualitative") {
    return {
      conceptual_visual_ready: true,
      quantitative_graph_ready: false,
      publish_status: "conceptual_visual_allowed",
      verifiedMetrics,
      graphReadyMetrics,
    };
  }

  if (v.evidence_type === "mixed") {
    return {
      conceptual_visual_ready: true,
      quantitative_graph_ready: verifiedMetrics.length > 0 || graphReadyMetrics.length > 0,
      publish_status:
        verifiedMetrics.length > 0 || graphReadyMetrics.length > 0
          ? "quantitative_or_annotated_visual_allowed"
          : "conceptual_timeline_allowed_pending_verified_metrics",
      verifiedMetrics,
      graphReadyMetrics,
    };
  }

  return {
    conceptual_visual_ready: false,
    quantitative_graph_ready: verifiedMetrics.length > 0 || graphReadyMetrics.length > 0,
    publish_status:
      verifiedMetrics.length > 0 || graphReadyMetrics.length > 0
        ? "quantitative_graph_allowed"
        : "blocked_pending_verified_metrics",
    verifiedMetrics,
    graphReadyMetrics,
  };
}

const visuals = brief.visual_brief.map((v: any) => {
  const requiredDomains = requiredDomainsForVisual(v);

  const matchingMetrics = metrics.filter((metric) => {
    const domains = metricDomains(metric);
    return requiredDomains.some((d) => domains.includes(d));
  });

  const readiness = visualReadiness(v, matchingMetrics);

  return {
    graph_id: `GOG_${v.visual_id}`,
    seed_id: registry.seed_id,
    title: v.title,
    visual_type: v.visual_type,
    evidence_type: v.evidence_type,
    message: v.message,
    required_domains: requiredDomains,
    required_metric_ids: matchingMetrics.map((m) => m.metric_id),
    verified_metric_ids: readiness.verifiedMetrics.map((m) => m.metric_id),
    graph_ready_metric_ids: readiness.graphReadyMetrics.map((m) => m.metric_id),
    conceptual_visual_ready: readiness.conceptual_visual_ready,
    quantitative_graph_ready: readiness.quantitative_graph_ready,
    graph_ready:
      readiness.conceptual_visual_ready || readiness.quantitative_graph_ready,
    publish_status: readiness.publish_status,
    notes: v.publish_guidance,
  };
});

const output = {
  generator_version: "graph-opportunity-generator-v0.2",
  generated_at: new Date().toISOString(),
  input_brief: brief.package_version,
  input_metrics_registry: registry.registry_version,
  seed_id: registry.seed_id,
  matching_mode: "domain_based_metric_mapping",
  summary: {
    total_graph_opportunities: visuals.length,
    conceptual_ready: visuals.filter((v: any) => v.conceptual_visual_ready).length,
    quantitative_ready: visuals.filter((v: any) => v.quantitative_graph_ready).length,
    blocked: visuals.filter((v: any) => !v.graph_ready).length,
  },
  graph_opportunities: visuals,
};

const outDir = path.join(process.cwd(), "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "graph-opportunity-generator-v0.2.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  generator_version: output.generator_version,
  total_graph_opportunities: output.summary.total_graph_opportunities,
  conceptual_ready: output.summary.conceptual_ready,
  quantitative_ready: output.summary.quantitative_ready,
  blocked: output.summary.blocked,
  output: outPath,
});
