import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const evidenceReview = readJson(path.join(root, "exports/article-generator/article-evidence-strength-review-v0.1.json"));
const integrityGuard = readJson(path.join(root, "exports/article-generator/sector-metric-integrity-guard-v0.1.json"));
const authorityReview = readJson(path.join(root, "exports/article-generator/publication-source-authority-review-v0.1.json"));
const graphPackage = readJson(path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json"));
const quantGap = readJson(path.join(root, "exports/article-generator/quant-gap-analysis-v0.1.json"));

const blockingReasons: string[] = [];

if (integrityGuard.integrity_passed !== true) {
  blockingReasons.push("sector_metric_integrity_guard_failed");
}
if (graphPackage.graph_ready !== true) {
  blockingReasons.push("institutional_graph_package_not_ready");
}
if (quantGap.current_state?.institutional_graph_ready !== true) {
  blockingReasons.push("quant_gap_institutional_graph_not_ready");
}
if (authorityReview.publication_guidance?.authority_sufficient_for_institutional_article !== true) {
  blockingReasons.push("source_authority_not_sufficient_for_institutional_article");
}
if (evidenceReview.publication_decision?.article_publishable !== true) {
  blockingReasons.push("article_evidence_review_not_publishable");
}

const institutionalGrade = blockingReasons.length === 0;

const interpretationAllowed =
  evidenceReview.scores?.overall_publication_strength_score >= 55 &&
  authorityReview.publication_guidance?.authority_sufficient_for_interpretation_article === true;

const output = {
  gate_version: "publication-readiness-gate-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: evidenceReview.article_identity ?? authorityReview.article_identity ?? null,
  source_evidence_review: evidenceReview.review_version,
  source_integrity_guard: integrityGuard.guard_version,
  source_authority_review: authorityReview.review_version,
  source_graph_package: graphPackage.package_version,
  source_quant_gap_analysis: quantGap.report_version,
  decision: {
    publish_allowed: institutionalGrade || interpretationAllowed,
    institutional_grade: institutionalGrade,
    interpretation_grade: !institutionalGrade && interpretationAllowed,
    recommended_status: institutionalGrade
      ? "publish_as_znbw_institutional_intelligence_article"
      : interpretationAllowed
      ? "publish_as_interpretation_article_with_transparency_panel"
      : "hold_for_more_evidence"
  },
  blocking_reasons: blockingReasons,
  warnings: integrityGuard.integrity_passed
    ? []
    : ["Do not publish institutional graph while integrity guard fails. Replace test or placeholder values first."],
  next_actions: institutionalGrade
    ? ["Proceed to graph rendering and CMS package finalization."]
    : [
        "Replace pipeline test values with official TableBuilder values.",
        "Rerun integrity guard.",
        "Rerun graph package, authority review, and publication gate."
      ]
};

const outPath = path.join(root, "exports/article-generator/publication-readiness-gate-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  gate_version: output.gate_version,
  publish_allowed: output.decision.publish_allowed,
  institutional_grade: output.decision.institutional_grade,
  recommended_status: output.decision.recommended_status,
  blocking_reasons: output.blocking_reasons.length,
  output: outPath
});
