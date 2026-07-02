import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();
const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));

const rawGraphs = publication.graph_briefs ?? [];

function mapStatus(g: any): string {
  if (g.publish_status === "blocked_pending_verified_metrics") return "blocked_pending_verified_metrics";
  if (g.quantitative_graph_ready === true) return "quantitative_ready";
  if (g.conceptual_visual_ready === true) return "conceptual_ready";
  if (g.graph_ready === true && g.evidence_type !== "quantitative") return "conceptual_ready";
  return "review_required";
}

const visuals = rawGraphs.map((g: any, index: number) => {
  const publishStatus = mapStatus(g);

  return {
    visual_id: g.graph_id ?? `VIS_${String(index + 1).padStart(3, "0")}`,
    chart_title: g.title ?? `Visual ${index + 1}`,
    chart_type: g.visual_type ?? "conceptual_visual",
    evidence_type: g.evidence_type ?? "unknown",
    chart_purpose: g.message ?? "Explain the article's intelligence signal visually.",
    required_domains: g.required_domains ?? [],
    required_metric_ids: g.required_metric_ids ?? [],
    verified_metric_ids: g.verified_metric_ids ?? [],
    publish_status: publishStatus,
    publish_guidance:
      publishStatus === "quantitative_ready"
        ? "Can be used as a quantitative chart after editorial review."
        : publishStatus === "conceptual_ready"
        ? "Can be used as a conceptual visual. Avoid exact values unless verified."
        : publishStatus === "blocked_pending_verified_metrics"
        ? "Do not publish until required metrics are verified."
        : "Requires editorial review before publication.",
    original_publish_status: g.publish_status ?? null,
    notes: g.notes ?? null,
  };
});

const output = {
  package_version: "concept-visual-package-v0.2",
  generated_at: new Date().toISOString(),
  source_publication_package: publication.package_version,
  article_title: publication.publication_identity.title,
  article_slug: publication.publication_identity.slug,
  visuals,
  visual_summary: {
    total: visuals.length,
    quantitative_ready: visuals.filter((v: any) => v.publish_status === "quantitative_ready").length,
    conceptual_ready: visuals.filter((v: any) => v.publish_status === "conceptual_ready").length,
    blocked: visuals.filter((v: any) => v.publish_status === "blocked_pending_verified_metrics").length,
    review_required: visuals.filter((v: any) => v.publish_status === "review_required").length,
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "concept-visual-package-v0.2.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_title,
  total_visuals: output.visual_summary.total,
  conceptual_ready: output.visual_summary.conceptual_ready,
  quantitative_ready: output.visual_summary.quantitative_ready,
  blocked: output.visual_summary.blocked,
  output: outPath,
});
