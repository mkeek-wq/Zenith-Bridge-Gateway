import fs from "fs";
import path from "path";

function readJson(filePath: string, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) throw new Error(`Missing input file: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const graph = readJson(path.join(root, "data/article-generator/graph-opportunity-generator-v0.2.json"));

const rawGraphs = graph.graph_opportunities ?? graph.opportunities ?? [];

const visuals = rawGraphs.map((g: any, index: number) => {
  const status =
    g.quantitative_ready === true || g.graph_ready === true
      ? "quantitative_ready"
      : g.conceptual_ready === true
      ? "conceptual_ready"
      : g.blocked === true
      ? "blocked_pending_verified_data"
      : "review_required";

  return {
    visual_id: g.visual_id ?? g.graph_id ?? `VIS_${String(index + 1).padStart(3, "0")}`,
    chart_title: g.title ?? g.chart_title ?? `Concept visual ${index + 1}`,
    chart_type: g.visual_type ?? g.chart_type ?? "conceptual_chart",
    chart_purpose:
      g.message ??
      g.purpose ??
      "Explain the SMURF evidence pattern in a publication-friendly visual.",
    data_requirements:
      g.data_requirements ??
      g.required_data ??
      publication.missing_data ??
      [],
    publish_status: status,
    publish_guidance:
      g.publish_guidance ??
      (status === "quantitative_ready"
        ? "Can be used after editorial review."
        : status === "conceptual_ready"
        ? "Can be used as a conceptual visual; avoid precise values."
        : "Blocked until verified metrics are available."),
  };
});

const output = {
  package_version: "concept-visual-package-v0.1",
  generated_at: new Date().toISOString(),
  source_publication_package: publication.package_version,
  article_title: publication.publication_identity.title,
  article_slug: publication.publication_identity.slug,
  visuals,
  visual_summary: {
    total: visuals.length,
    quantitative_ready: visuals.filter((v: any) => v.publish_status === "quantitative_ready").length,
    conceptual_ready: visuals.filter((v: any) => v.publish_status === "conceptual_ready").length,
    blocked: visuals.filter((v: any) => v.publish_status === "blocked_pending_verified_data").length,
    review_required: visuals.filter((v: any) => v.publish_status === "review_required").length,
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "concept-visual-package-v0.1.json");
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
