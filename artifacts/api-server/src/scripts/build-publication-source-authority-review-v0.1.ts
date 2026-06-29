import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const publicationPackage = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const sectorRegistry = readJson(path.join(root, "exports/article-generator/sector-performance-registry-v0.1.json"));
const graphPackage = readJson(path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json"));

const sources = publicationPackage.sources ?? publicationPackage.source_list ?? [];
const metrics = sectorRegistry.metrics ?? [];

const verifiedMetrics = metrics.filter((m: any) => m.governance?.verified === true);
const officialMetrics = verifiedMetrics.filter((m: any) =>
  String(m.source_name ?? "").toLowerCase().includes("singapore department") ||
  String(m.source_url ?? "").includes("singstat.gov.sg")
);

const sourceCountScore = Math.min(100, sources.length * 20);
const verifiedMetricScore = Math.min(100, verifiedMetrics.length * 25);
const officialMetricScore = Math.min(100, officialMetrics.length * 25);
const graphScore = graphPackage.graph_ready ? 90 : 35;

const authorityScore = Math.round(
  sourceCountScore * 0.2 +
  verifiedMetricScore * 0.3 +
  officialMetricScore * 0.3 +
  graphScore * 0.2
);

const output = {
  review_version: "publication-source-authority-review-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: publicationPackage.article_identity ?? graphPackage.article_identity ?? null,
  source_publication_package: publicationPackage.package_version,
  source_sector_registry: sectorRegistry.registry_version,
  source_graph_package: graphPackage.package_version,
  scores: {
    source_count_score: sourceCountScore,
    verified_metric_score: verifiedMetricScore,
    official_metric_score: officialMetricScore,
    institutional_graph_score: graphScore,
    authority_score: authorityScore
  },
  band:
    authorityScore >= 85 ? "strong" :
    authorityScore >= 70 ? "moderate" :
    authorityScore >= 55 ? "limited" :
    "weak",
  evidence_profile: {
    source_count: sources.length,
    verified_metrics: verifiedMetrics.length,
    official_metrics: officialMetrics.length,
    institutional_graph_ready: graphPackage.graph_ready
  },
  publication_guidance: {
    authority_sufficient_for_institutional_article: authorityScore >= 70 && graphPackage.graph_ready,
    authority_sufficient_for_interpretation_article: authorityScore >= 55,
    needs_more_authority: authorityScore < 70
  },
  next_actions:
    authorityScore >= 70
      ? ["Run publication-readiness-gate."]
      : ["Add more official source references or verified metrics before institutional publication."]
};

const outPath = path.join(root, "exports/article-generator/publication-source-authority-review-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  review_version: output.review_version,
  authority_score: output.scores.authority_score,
  band: output.band,
  output: outPath
});
