import fs from "fs";

const COUNTER_PATH = "data/intelligence/counter-evidence-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/falsification-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const counterRegistry = readJson(COUNTER_PATH);
const reviews: AnyRecord[] = counterRegistry.counter_evidence_reviews ?? [];

const falsificationReviews = reviews.map((review, index) => ({
  falsification_review_id: `FAL_${String(index + 1).padStart(3, "0")}`,
  falsification_version: "falsification-review-v0.1",

  counter_evidence_review_id: review.counter_evidence_review_id,
  hypothesis_id: review.hypothesis_id,
  driver_id: review.driver_id,
  driver_name: review.driver_name,
  hypothesis_statement: review.hypothesis_statement,

  falsification_status: "not_performed",

  support_cases_reviewed: false,
  counter_cases_reviewed: false,
  ambiguous_cases_reviewed: false,

  support_findings: [],
  counter_findings: [],
  ambiguous_findings: [],

  falsification_tests: [
    "Identify cases where the expected mechanism did not occur.",
    "Identify cases where the opposite mechanism occurred.",
    "Identify cases where another driver explains the outcome better.",
    "Identify ambiguous cases where evidence can support both pro and contra interpretations.",
    "Check whether high-authority sources weaken the mechanism.",
  ],

  falsification_score: null,
  falsification_result: "pending_review",

  validation_impact: {
    may_strengthen_mechanism: false,
    may_weaken_mechanism: false,
    may_block_validation: true,
    reason: "Falsification review has not yet been performed.",
  },

  governance: {
    falsification_required_before_validation: true,
    validated_mechanism_approval_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
    note:
      "This registry prepares falsification review. It does not validate mechanisms.",
  },
}));

const summary = {
  falsification_reviews_created: falsificationReviews.length,
  not_performed: falsificationReviews.length,
  validated_mechanisms_approved: 0,
  driver_ids: falsificationReviews.map((r) => r.driver_id),
};

const output = {
  falsification_registry_version: "falsification-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_counter_evidence_registry: COUNTER_PATH,
  policy: {
    principle:
      "Falsification registry v0.1 requires mechanisms to survive explicit attempts to weaken or disprove them before validation.",
    production_mutation_allowed: false,
    human_review_required: true,
    falsification_required_before_validation: true,
  },
  summary,
  falsification_reviews: falsificationReviews,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.falsification_registry_version,
  falsification_reviews_created: summary.falsification_reviews_created,
  not_performed: summary.not_performed,
  output: OUTPUT_PATH,
});

for (const review of falsificationReviews) {
  console.log(
    `${review.falsification_review_id} | ${review.driver_id} | ${review.falsification_status}`
  );
}
