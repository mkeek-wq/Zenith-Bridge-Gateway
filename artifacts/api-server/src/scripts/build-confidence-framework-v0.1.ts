import fs from "fs";

const TESTING_PATH = "data/intelligence/hypothesis-testing-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/confidence-framework-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function confidenceBand(score: number): string {
  if (score >= 0.85) return "very_strong";
  if (score >= 0.75) return "strong";
  if (score >= 0.6) return "moderate";
  if (score >= 0.45) return "weak";
  return "insufficient";
}

function confidenceLabel(score: number): string {
  switch (confidenceBand(score)) {
    case "very_strong":
      return "Very strong confidence";
    case "strong":
      return "Strong confidence";
    case "moderate":
      return "Moderate confidence";
    case "weak":
      return "Weak confidence";
    default:
      return "Insufficient confidence";
  }
}

const testingRegistry = readJson(TESTING_PATH);
const tests: AnyRecord[] = testingRegistry.tests ?? [];

const assessments = tests.map((t) => {
  const supportScore = t.preliminary_support_score ?? 0;
  const counterEvidencePenalty = (t.counter_evidence ?? []).length > 0 ? 0.15 : 0;
  const unresolvedPenalty = (t.unresolved_questions ?? []).length > 2 ? 0.05 : 0;

  const confidenceScore = round(
    Math.max(0, Math.min(1, supportScore - counterEvidencePenalty - unresolvedPenalty))
  );

  return {
    confidence_assessment_id: `CONF_${t.testing_id.replace("HT_", "")}`,
    confidence_version: "confidence-assessment-v0.1",

    testing_id: t.testing_id,
    hypothesis_id: t.hypothesis_id,
    driver_id: t.driver_id,
    driver_name: t.driver_name,

    confidence_score: confidenceScore,
    confidence_band: confidenceBand(confidenceScore),
    confidence_label: confidenceLabel(confidenceScore),

    components: {
      structural_support_score: supportScore,
      counter_evidence_penalty: counterEvidencePenalty,
      unresolved_questions_penalty: unresolvedPenalty,
    },

    approval_readiness:
      confidenceScore >= 0.75 && (t.counter_evidence ?? []).length === 0
        ? "eligible_for_human_principle_review"
        : "not_ready_for_principle_approval",

    governance: {
      confidence_is_provisional: true,
      approved_principle: false,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "Confidence scores are provisional and must not be treated as truth or automatic approval.",
    },
  };
});

const summary = {
  assessments_created: assessments.length,
  very_strong: assessments.filter((a) => a.confidence_band === "very_strong").length,
  strong: assessments.filter((a) => a.confidence_band === "strong").length,
  moderate: assessments.filter((a) => a.confidence_band === "moderate").length,
  weak: assessments.filter((a) => a.confidence_band === "weak").length,
  insufficient: assessments.filter((a) => a.confidence_band === "insufficient").length,
  eligible_for_human_principle_review: assessments.filter(
    (a) => a.approval_readiness === "eligible_for_human_principle_review"
  ).length,
};

const output = {
  confidence_framework_version: "confidence-framework-v0.1",
  generated_at: new Date().toISOString(),
  source_hypothesis_testing_registry: TESTING_PATH,

  policy: {
    principle:
      "Confidence framework v0.1 converts hypothesis testing diagnostics into provisional confidence assessments. Confidence is not truth and does not approve principles.",
    production_mutation_allowed: false,
    human_review_required: true,
    confidence_is_not_truth: true,
  },

  confidence_bands: {
    very_strong: ">= 0.85",
    strong: ">= 0.75",
    moderate: ">= 0.60",
    weak: ">= 0.45",
    insufficient: "< 0.45",
  },

  scoring_notes: {
    v0_1_scope:
      "Lightweight structural confidence only. Future versions should add source authority, counter-evidence scoring, directional consistency, lag checks, and statistical tests.",
  },

  summary,
  assessments,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  framework_version: output.confidence_framework_version,
  assessments_created: summary.assessments_created,
  very_strong: summary.very_strong,
  strong: summary.strong,
  moderate: summary.moderate,
  weak: summary.weak,
  insufficient: summary.insufficient,
  eligible_for_human_principle_review: summary.eligible_for_human_principle_review,
  output: OUTPUT_PATH,
});

for (const a of assessments) {
  console.log(
    `${a.confidence_assessment_id} | ${a.driver_id} | confidence=${a.confidence_score} | ${a.confidence_band} | ${a.approval_readiness}`
  );
}
