import fs from "fs";

const VALIDATION_PATH = "data/intelligence/mechanism-validation-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/mechanism-lifecycle-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const validationRegistry = readJson(VALIDATION_PATH);
const validationReviews: AnyRecord[] = validationRegistry.validation_reviews ?? [];

const lifecycleItems = validationReviews.map((review, index) => ({
  lifecycle_id: `MLC_${String(index + 1).padStart(3, "0")}`,
  lifecycle_version: "mechanism-lifecycle-v0.1",

  mechanism_validation_review_id: review.mechanism_validation_review_id,
  mechanism_candidate_id: review.mechanism_candidate_id,
  hypothesis_id: review.hypothesis_id,

  driver_id: review.driver_id,
  driver_name: review.driver_name,
  mechanism_statement: review.mechanism_statement,
  mechanism_type: review.mechanism_type,

  lifecycle_status: "candidate_not_validated",
  validated_mechanism: false,

  confidence_score: review.confidence_score,
  confidence_band: review.confidence_band,

  lifecycle_events: [
    {
      event_type: "candidate_created",
      event_date: new Date().toISOString(),
      note: "Mechanism candidate exists but is not validated.",
    },
    {
      event_type: "validation_blocked",
      event_date: new Date().toISOString(),
      note: "Validation blocked pending falsification and counter-evidence review.",
    },
  ],

  future_lifecycle_states: [
    "validated",
    "strengthened",
    "weakened",
    "under_challenge",
    "retired",
  ],

  challenge_rules: {
    new_counter_evidence_can_weaken: true,
    failed_prediction_can_weaken: true,
    strong_new_evidence_can_strengthen: true,
    repeated_failure_can_retire: true,
    periodic_review_required: true,
  },

  permitted_use: {
    current_use: "none",
    may_adjust_confidence: false,
    may_override_evidence: false,
    may_drive_primary_assessment: false,
  },

  governance: {
    mechanism_lifecycle_tracked: true,
    human_review_required_for_state_change: true,
    production_mutation_allowed: false,
    note:
      "This lifecycle entry ensures mechanisms can be strengthened, weakened, challenged, or retired over time.",
  },
}));

const summary = {
  lifecycle_items_created: lifecycleItems.length,
  validated: 0,
  candidate_not_validated: lifecycleItems.length,
  retired: 0,
  under_challenge: 0,
};

const output = {
  mechanism_lifecycle_registry_version: "mechanism-lifecycle-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_mechanism_validation_registry: VALIDATION_PATH,

  policy: {
    principle:
      "Mechanism lifecycle registry v0.1 ensures mechanisms are challengeable over time and can be strengthened, weakened, or retired.",
    production_mutation_allowed: false,
    human_review_required_for_state_change: true,
    mechanisms_are_not_permanent_truths: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },

  summary,
  lifecycle_items: lifecycleItems,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.mechanism_lifecycle_registry_version,
  lifecycle_items_created: summary.lifecycle_items_created,
  candidate_not_validated: summary.candidate_not_validated,
  validated: summary.validated,
  retired: summary.retired,
  output: OUTPUT_PATH,
});

for (const item of lifecycleItems) {
  console.log(
    `${item.lifecycle_id} | ${item.driver_id} | ${item.lifecycle_status}`
  );
}
