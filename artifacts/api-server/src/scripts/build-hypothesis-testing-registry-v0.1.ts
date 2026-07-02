import fs from "fs";

const HYPOTHESIS_PATH = "data/intelligence/hypothesis-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/hypothesis-testing-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function testingId(index: number): string {
  return `HT_${String(index + 1).padStart(3, "0")}`;
}

function initialAssessment(h: AnyRecord): AnyRecord {
  const supportScore =
    (h.supporting_case_count >= 8 ? 0.35 : h.supporting_case_count >= 6 ? 0.25 : 0.15) +
    ((h.supporting_periods ?? []).length >= 4 ? 0.25 : 0.15) +
    ((h.supporting_series ?? []).length >= 3 ? 0.2 : 0.1);

  const confidencePenalty = h.confidence_distribution?.low ? 0.05 : 0;

  const preliminaryScore = round(Math.max(0, Math.min(1, supportScore - confidencePenalty)));

  return {
    preliminary_support_score: preliminaryScore,
    testing_status:
      preliminaryScore >= 0.7
        ? "survived_initial_structure_review"
        : "requires_more_testing",
    test_result: "not_final",
  };
}

const hypothesisRegistry = readJson(HYPOTHESIS_PATH);
const hypotheses: AnyRecord[] = hypothesisRegistry.hypotheses ?? [];

const tests = hypotheses.map((h, index) => {
  const assessment = initialAssessment(h);

  return {
    testing_id: testingId(index),
    testing_version: "hypothesis-testing-v0.1",

    hypothesis_id: h.hypothesis_id,
    driver_id: h.driver_id,
    driver_name: h.driver_name,
    hypothesis_statement: h.hypothesis_statement,
    mechanism_type: h.mechanism_type,

    testing_level: 1,
    testing_level_name: "qualitative_case_review",

    supporting_case_count: h.supporting_case_count,
    supporting_periods: h.supporting_periods,
    supporting_series: h.supporting_series,
    confidence_distribution: h.confidence_distribution,

    support_evidence: [
      "Hypothesis originates from a principle candidate that passed coverage and diversity screening.",
      `Supported by ${h.supporting_case_count} reviewed historical cases.`,
      `Observed across ${(h.supporting_periods ?? []).length} periods.`,
      `Observed across ${(h.supporting_series ?? []).length} series.`,
    ],

    counter_evidence: [],
    counter_evidence_required: true,

    falsification_questions: [
      "Can we identify cases where the expected mechanism did not occur?",
      "Can we identify cases where the opposite mechanism occurred?",
      "Can another driver explain the outcome better?",
      "Does the mechanism hold outside the strongest supporting cases?",
      "Does the mechanism survive review using higher-authority source material?",
    ],

    unresolved_questions: h.unresolved_questions ?? [],

    preliminary_support_score: assessment.preliminary_support_score,
    testing_status: assessment.testing_status,
    test_result: assessment.test_result,

    confidence_score_after_testing: null,
    approved_for_principle_review: false,

    governance: {
      testing_only: true,
      approved_principle: false,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "This registry starts hypothesis testing. It does not approve principles. Counter-evidence review remains required.",
    },
  };
});

const summary = {
  tests_created: tests.length,
  source_hypotheses: hypotheses.length,
  survived_initial_structure_review: tests.filter(
    (t) => t.testing_status === "survived_initial_structure_review"
  ).length,
  requires_more_testing: tests.filter(
    (t) => t.testing_status === "requires_more_testing"
  ).length,
  approved_principles: 0,
  driver_ids: tests.map((t) => t.driver_id),
};

const output = {
  hypothesis_testing_registry_version: "hypothesis-testing-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_hypothesis_registry: HYPOTHESIS_PATH,

  policy: {
    principle:
      "Hypothesis testing registry v0.1 initiates structured falsification and support review. It does not approve principles or mutate production memory.",
    production_mutation_allowed: false,
    human_review_required: true,
    counter_evidence_required_before_approval: true,
    testing_registry_is_not_principle_registry: true,
  },

  summary,
  tests,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.hypothesis_testing_registry_version,
  tests_created: summary.tests_created,
  survived_initial_structure_review: summary.survived_initial_structure_review,
  requires_more_testing: summary.requires_more_testing,
  output: OUTPUT_PATH,
});

for (const t of tests) {
  console.log(
    `${t.testing_id} | ${t.driver_id} | score=${t.preliminary_support_score} | ${t.testing_status}`
  );
}
