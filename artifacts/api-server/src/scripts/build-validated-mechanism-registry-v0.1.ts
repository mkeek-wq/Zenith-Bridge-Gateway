import fs from "fs";

const CONFIDENCE_PATH = "data/intelligence/confidence-framework-v0.1.json";
const COUNTER_PATH = "data/intelligence/counter-evidence-registry-v0.1.json";
const HYPOTHESIS_PATH = "data/intelligence/hypothesis-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/validated-mechanism-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const confidenceFramework = readJson(CONFIDENCE_PATH);
const counterRegistry = readJson(COUNTER_PATH);
const hypothesisRegistry = readJson(HYPOTHESIS_PATH);

const assessments: AnyRecord[] = confidenceFramework.assessments ?? [];
const counterReviews: AnyRecord[] = counterRegistry.counter_evidence_reviews ?? [];
const hypotheses: AnyRecord[] = hypothesisRegistry.hypotheses ?? [];

const counterByHypothesis = new Map<string, AnyRecord>();
for (const review of counterReviews) {
  counterByHypothesis.set(review.hypothesis_id, review);
}

const hypothesisById = new Map<string, AnyRecord>();
for (const hypothesis of hypotheses) {
  hypothesisById.set(hypothesis.hypothesis_id, hypothesis);
}

const mechanismCandidates = assessments.map((assessment, index) => {
  const counter = counterByHypothesis.get(assessment.hypothesis_id);
  const hypothesis = hypothesisById.get(assessment.hypothesis_id);

  return {
    mechanism_candidate_id: `VMC_${String(index + 1).padStart(3, "0")}`,
    mechanism_candidate_version: "validated-mechanism-candidate-v0.1",

    hypothesis_id: assessment.hypothesis_id,
    counter_evidence_review_id: counter?.counter_evidence_review_id ?? null,

    driver_id: assessment.driver_id,
    driver_name: assessment.driver_name,

    mechanism_statement: hypothesis?.hypothesis_statement ?? null,
    mechanism_type: hypothesis?.mechanism_type ?? null,
    expected_direction: hypothesis?.expected_direction ?? null,

    confidence_score: assessment.confidence_score,
    confidence_band: assessment.confidence_band,
    confidence_label: assessment.confidence_label,

    validation_status: "pending_counter_evidence_review",
    validated_mechanism: false,
    validated_mechanism_id: null,

    validation_requirements: [
      "Counter-evidence search completed.",
      "Pro evidence reviewed.",
      "Contra evidence reviewed.",
      "Ambiguous evidence recorded.",
      "Scope and limitations defined.",
      "Human validation decision recorded.",
    ],

    usage_constraints: {
      may_inform_confidence_adjustment: false,
      may_override_current_evidence: false,
      may_drive_primary_assessment: false,
      evidence_remains_primary: true,
    },

    governance: {
      mechanism_not_validated_yet: true,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "This is a mechanism candidate only. It may not influence evidence assessment until validated, and even then may only adjust confidence.",
    },
  };
});

const validatedMechanisms: AnyRecord[] = [];

const summary = {
  mechanism_candidates_created: mechanismCandidates.length,
  validated_mechanisms_count: validatedMechanisms.length,
  pending_counter_evidence_review: mechanismCandidates.filter(
    (m) => m.validation_status === "pending_counter_evidence_review"
  ).length,
  driver_ids: mechanismCandidates.map((m) => m.driver_id),
};

const output = {
  validated_mechanism_registry_version: "validated-mechanism-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_confidence_framework: CONFIDENCE_PATH,
  source_counter_evidence_registry: COUNTER_PATH,
  source_hypothesis_registry: HYPOTHESIS_PATH,

  policy: {
    principle:
      "Validated mechanism registry v0.1 replaces approved-principle language with confidence-based, challengeable mechanisms.",
    production_mutation_allowed: false,
    human_validation_required: true,
    mechanism_is_not_truth: true,
    mechanism_must_not_override_evidence: true,
    historical_similarity_does_not_guarantee_future_outcomes: true,
  },

  summary,
  mechanism_candidates: mechanismCandidates,
  validated_mechanisms: validatedMechanisms,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.validated_mechanism_registry_version,
  mechanism_candidates_created: summary.mechanism_candidates_created,
  validated_mechanisms_count: summary.validated_mechanisms_count,
  pending_counter_evidence_review: summary.pending_counter_evidence_review,
  output: OUTPUT_PATH,
});

for (const mechanism of mechanismCandidates) {
  console.log(
    `${mechanism.mechanism_candidate_id} | ${mechanism.driver_id} | ${mechanism.confidence_band} | ${mechanism.validation_status}`
  );
}
