import fs from "fs";

const MECHANISM_PATH = "data/intelligence/validated-mechanism-registry-v0.1.json";
const FALSIFICATION_PATH = "data/intelligence/falsification-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/mechanism-validation-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const mechanismRegistry = readJson(MECHANISM_PATH);
const falsificationRegistry = readJson(FALSIFICATION_PATH);

const candidates: AnyRecord[] = mechanismRegistry.mechanism_candidates ?? [];
const falsificationReviews: AnyRecord[] =
  falsificationRegistry.falsification_reviews ?? [];

const falsificationByHypothesis = new Map<string, AnyRecord>();
for (const review of falsificationReviews) {
  falsificationByHypothesis.set(review.hypothesis_id, review);
}

const validationReviews = candidates.map((candidate, index) => {
  const falsification = falsificationByHypothesis.get(candidate.hypothesis_id);

  return {
    mechanism_validation_review_id: `MVR_${String(index + 1).padStart(3, "0")}`,
    validation_version: "mechanism-validation-review-v0.1",

    mechanism_candidate_id: candidate.mechanism_candidate_id,
    hypothesis_id: candidate.hypothesis_id,
    falsification_review_id: falsification?.falsification_review_id ?? null,

    driver_id: candidate.driver_id,
    driver_name: candidate.driver_name,
    mechanism_statement: candidate.mechanism_statement,
    mechanism_type: candidate.mechanism_type,

    confidence_score: candidate.confidence_score,
    confidence_band: candidate.confidence_band,

    validation_status: "blocked_pending_falsification",
    validated_mechanism: false,
    validated_mechanism_id: null,

    validation_decision: {
      decision: "not_validated",
      reason:
        "Counter-evidence and falsification review must be completed before validation.",
      reviewer: null,
      reviewed_at: null,
    },

    required_before_validation: [
      "Counter-evidence review completed.",
      "Falsification review completed.",
      "Ambiguous evidence assessed.",
      "Scope and limits defined.",
      "Human validation decision recorded.",
    ],

    usage_permissions_after_validation: {
      may_adjust_confidence: true,
      may_override_evidence: false,
      may_determine_case_outcome: false,
      maximum_confidence_adjustment: 0.15,
    },

    governance: {
      validation_blocked: true,
      human_validation_required: true,
      production_mutation_allowed: false,
      note:
        "Validation is blocked until falsification and counter-evidence review are completed.",
    },
  };
});

const summary = {
  validation_reviews_created: validationReviews.length,
  validated_mechanisms_count: 0,
  blocked_pending_falsification: validationReviews.length,
  driver_ids: validationReviews.map((r) => r.driver_id),
};

const output = {
  mechanism_validation_registry_version: "mechanism-validation-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_validated_mechanism_registry: MECHANISM_PATH,
  source_falsification_registry: FALSIFICATION_PATH,

  policy: {
    principle:
      "Mechanism validation registry v0.1 controls whether mechanism candidates can become validated mechanisms. No mechanism is validated automatically.",
    production_mutation_allowed: false,
    human_validation_required: true,
    no_automatic_validation: true,
    evidence_remains_primary: true,
  },

  summary,
  validation_reviews: validationReviews,
  validated_mechanisms: [],
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.mechanism_validation_registry_version,
  validation_reviews_created: summary.validation_reviews_created,
  validated_mechanisms_count: summary.validated_mechanisms_count,
  blocked_pending_falsification: summary.blocked_pending_falsification,
  output: OUTPUT_PATH,
});

for (const review of validationReviews) {
  console.log(
    `${review.mechanism_validation_review_id} | ${review.driver_id} | ${review.validation_status}`
  );
}
