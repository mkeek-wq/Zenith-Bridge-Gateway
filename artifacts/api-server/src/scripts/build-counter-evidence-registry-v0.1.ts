import fs from "fs";

const TESTING_PATH = "data/intelligence/hypothesis-testing-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/counter-evidence-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const testingRegistry = readJson(TESTING_PATH);
const tests: AnyRecord[] = testingRegistry.tests ?? [];

const counterEvidenceReviews = tests.map((test, index) => ({
  counter_evidence_review_id: `CER_${String(index + 1).padStart(3, "0")}`,
  counter_evidence_version: "counter-evidence-review-v0.1",

  testing_id: test.testing_id,
  hypothesis_id: test.hypothesis_id,
  driver_id: test.driver_id,
  driver_name: test.driver_name,
  hypothesis_statement: test.hypothesis_statement,

  review_status: "counter_evidence_search_required",

  known_support_evidence: test.support_evidence ?? [],
  known_counter_evidence: test.counter_evidence ?? [],

  counter_evidence_search_questions: [
    "Where did the expected mechanism fail?",
    "Where did the opposite mechanism occur?",
    "Where did another driver explain the outcome better?",
    "Where was evidence mixed or ambiguous?",
    "Could the same evidence support both pro and contra interpretations?",
    "Are there high-authority sources that weaken the hypothesis?"
  ],

  evidence_interpretation_rules: {
    evidence_can_support_multiple_sides: true,
    pro_and_contra_required: true,
    source_authority_required: true,
    ambiguity_must_be_recorded: true,
  },

  preliminary_counter_evidence_strength: "not_assessed",
  confidence_adjustment_recommendation: "no_adjustment_until_counter_evidence_reviewed",

  governance: {
    counter_evidence_required_before_validation: true,
    validated_mechanism_approval_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
    note:
      "This registry creates the counter-evidence review layer. It does not validate mechanisms or approve conclusions.",
  },
}));

const summary = {
  counter_evidence_reviews_created: counterEvidenceReviews.length,
  source_tests: tests.length,
  counter_evidence_search_required: counterEvidenceReviews.length,
  validated_mechanisms_approved: 0,
  driver_ids: counterEvidenceReviews.map((r) => r.driver_id),
};

const output = {
  counter_evidence_registry_version: "counter-evidence-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_hypothesis_testing_registry: TESTING_PATH,

  policy: {
    principle:
      "Counter-evidence registry v0.1 requires hypotheses to be challenged before any mechanism can be validated.",
    production_mutation_allowed: false,
    human_review_required: true,
    pro_and_contra_evidence_required: true,
    counter_evidence_can_weaken_confidence: true,
  },

  summary,
  counter_evidence_reviews: counterEvidenceReviews,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.counter_evidence_registry_version,
  counter_evidence_reviews_created: summary.counter_evidence_reviews_created,
  counter_evidence_search_required: summary.counter_evidence_search_required,
  output: OUTPUT_PATH,
});

for (const review of counterEvidenceReviews) {
  console.log(
    `${review.counter_evidence_review_id} | ${review.driver_id} | ${review.review_status}`
  );
}
