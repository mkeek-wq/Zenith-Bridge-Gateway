import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const publicationArticle = readJson(
  path.join(root, "exports/article-generator/publication-article-v0.1.json")
);

const publicationPackage = readJson(
  path.join(root, "exports/article-generator/publication-package-v0.1.json")
);

const quantGap = readJson(
  path.join(root, "exports/article-generator/quant-gap-analysis-v0.1.json")
);

const intelligence = publicationPackage.smurf_intelligence_snapshot ?? {};
const sourceCases = publicationPackage.source_cases ?? [];
const sources = publicationPackage.sources ?? publicationPackage.source_list ?? [];

const evidenceScore = sourceCases.length >= 5 ? 85 : sourceCases.length >= 3 ? 70 : 50;
const sourceAuthorityScore = sources.length >= 3 ? 90 : sources.length >= 1 ? 70 : 45;
const quantScore = quantGap.current_scores.quant_readiness_score;
const graphScore = quantGap.current_scores.institutional_graph_score;
const confidenceScore =
  typeof intelligence.confidence_score === "number"
    ? Math.round(intelligence.confidence_score * 100)
    : 75;

const overall = Math.round(
  evidenceScore * 0.25 +
  sourceAuthorityScore * 0.2 +
  confidenceScore * 0.2 +
  quantScore * 0.2 +
  graphScore * 0.15
);

const output = {
  review_version: "article-evidence-strength-review-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: publicationArticle.article_identity,
  source_publication_article: publicationArticle.package_version,
  source_publication_package: publicationPackage.package_version,
  source_quant_gap_analysis: quantGap.report_version,

  scores: {
    evidence_score: evidenceScore,
    source_authority_score: sourceAuthorityScore,
    smurf_confidence_score: confidenceScore,
    quantification_score: quantScore,
    graph_readiness_score: graphScore,
    overall_publication_strength_score: overall
  },

  bands: {
    evidence:
      evidenceScore >= 85 ? "strong" :
      evidenceScore >= 70 ? "moderate" :
      "limited",
    source_authority:
      sourceAuthorityScore >= 85 ? "strong" :
      sourceAuthorityScore >= 70 ? "moderate" :
      "limited",
    quantification: quantGap.current_scores.quant_readiness_band,
    graph_readiness: quantGap.current_scores.institutional_graph_band,
    overall:
      overall >= 85 ? "strong" :
      overall >= 70 ? "moderate" :
      overall >= 55 ? "limited_publishable" :
      "weak"
  },

  publication_decision: {
    article_publishable: overall >= 55,
    institutional_grade: overall >= 80 && quantGap.current_state.institutional_graph_ready,
    recommended_status:
      overall >= 80 && quantGap.current_state.institutional_graph_ready
        ? "publish_as_znbw_institutional_intelligence_article"
        : overall >= 55
        ? "publish_as_interpretation_article_with_transparency_panel"
        : "hold_for_more_evidence",
    required_disclaimer:
      quantGap.current_state.institutional_graph_ready
        ? null
        : "Quantitative coverage is limited; article uses one verified metric plus conceptual visuals."
  },

  strengths: [
    "SMURF interpretation layer is available.",
    "Source lineage is established.",
    "Verified metric governance is active.",
    "Synthetic replay evidence is blocked from quantitative chart use."
  ],

  weaknesses:
    quantGap.gaps.length > 0
      ? [
          "Institutional multi-sector graph remains blocked.",
          "Additional verified sector metrics are required.",
          "Official TableBuilder values still need retrieval or extraction."
        ]
      : [],

  next_actions: quantGap.next_actions
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-evidence-strength-review-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  review_version: output.review_version,
  title: publicationArticle.article_identity.title,
  overall_score: output.scores.overall_publication_strength_score,
  overall_band: output.bands.overall,
  recommended_status: output.publication_decision.recommended_status,
  output: outPath
});
