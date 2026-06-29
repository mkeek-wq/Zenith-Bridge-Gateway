import fs from "fs";
import path from "path";

type PredictionCandidate = {
  prediction_id: string;
  driver_id: string;
  driver_name: string;
  indicator: string;
  prediction_horizon: string;
  confidence_level: string;
  hypothesis: string;
  evidence_basis: string[];
  validation_status: string;
  governance: {
    prediction_is_not_fact: boolean;
    human_review_required: boolean;
    auto_publish_allowed: boolean;
    production_mutation_allowed: boolean;
  };
};

const INPUT_PATH = "data/intelligence/prediction-candidate-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/prediction-validation-registry-v0.1.json";

function horizonToValidationWindowMonths(horizon: string): {
  min_months: number | null;
  max_months: number | null;
} {
  if (horizon === "3_to_6_months") return { min_months: 3, max_months: 6 };
  if (horizon === "6_to_12_months") return { min_months: 6, max_months: 12 };
  if (horizon === "12_to_24_months") return { min_months: 12, max_months: 24 };
  if (horizon === "24_plus_months") return { min_months: 24, max_months: 36 };

  return { min_months: null, max_months: null };
}

function addMonths(date: Date, months: number | null): string | null {
  if (months === null) return null;

  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result.toISOString();
}

function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const source = JSON.parse(raw);

  const predictions: PredictionCandidate[] = source.predictions;

  if (!Array.isArray(predictions)) {
    throw new Error("Expected source.predictions to be an array.");
  }

  const generatedAt = new Date();
  const predictionCreatedAt = source.generated_at
    ? new Date(source.generated_at)
    : generatedAt;

  const validations = predictions.map((prediction) => {
    const validationWindow = horizonToValidationWindowMonths(
      prediction.prediction_horizon
    );

    return {
      prediction_validation_version: "prediction-validation-v0.1",
      prediction_id: prediction.prediction_id,
      source_prediction_registry:
        "data/intelligence/prediction-candidate-registry-v0.1.json",

      driver_id: prediction.driver_id,
      driver_name: prediction.driver_name,
      indicator: prediction.indicator,

      hypothesis: prediction.hypothesis,
      prediction_horizon: prediction.prediction_horizon,
      confidence_level: prediction.confidence_level,
      evidence_basis: prediction.evidence_basis,

      prediction_created_at: predictionCreatedAt.toISOString(),
      validation_window: {
        min_months: validationWindow.min_months,
        max_months: validationWindow.max_months,
        earliest_review_at: addMonths(
          predictionCreatedAt,
          validationWindow.min_months
        ),
        final_review_due_at: addMonths(
          predictionCreatedAt,
          validationWindow.max_months
        ),
      },

      validation_status: "pending",
      outcome_observed: false,
      outcome_observed_at: null,
      outcome_summary: null,

      correctness: null,
      accuracy_score: null,

      validation_evidence: {
        supporting_evidence: [],
        contradicting_evidence: [],
        neutral_evidence: [],
        evidence_gap_notes: [],
      },

      analyst_review: {
        analyst_assessment: "",
        review_notes: "",
        reviewed_by: null,
        reviewed_at: null,
      },

      governance: {
        prediction_is_not_fact: true,
        validation_is_required_before_learning: true,
        human_review_required: true,
        auto_scoring_allowed: false,
        auto_publish_allowed: false,
        production_mutation_allowed: false,
      },
    };
  });

  const output = {
    prediction_validation_registry_version:
      "prediction-validation-registry-v0.1",
    generated_at: generatedAt.toISOString(),
    source_prediction_candidates: INPUT_PATH,
    policy: {
      principle:
        "Prediction validation records track whether evidence-backed hypotheses were later supported, contradicted, or left unresolved.",
      human_review_required: true,
      auto_scoring_allowed: false,
      production_mutation_allowed: false,
    },
    summary: {
      validations_generated: validations.length,
      pending_validations: validations.length,
      observed_validations: 0,
      expired_validations: 0,
      scored_validations: 0,
    },
    validations,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    prediction_validation_registry_version:
      output.prediction_validation_registry_version,
    validations_generated: validations.length,
    output: OUTPUT_PATH,
  });
}

main();
