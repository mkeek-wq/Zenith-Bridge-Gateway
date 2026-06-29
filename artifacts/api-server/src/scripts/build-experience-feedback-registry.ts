import fs from "fs";
import path from "path";

const INPUT_PATH = "data/intelligence/prediction-accuracy-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/experience-feedback-registry-v0.1.json";

type DriverAggregate = {
  group_key: string;
  group_label: string;
  total_predictions: number;
  pending_predictions: number;
  observed_predictions: number;
  expired_predictions: number;
  scored_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  accuracy_rate: number | null;
  average_accuracy_score: number | null;
  prediction_ids: string[];
};

function feedbackType(driver: DriverAggregate): string {
  if (driver.scored_predictions === 0) return "insufficient_validated_predictions";

  if (driver.accuracy_rate !== null && driver.accuracy_rate >= 0.75) {
    return "positive_learning_signal";
  }

  if (driver.accuracy_rate !== null && driver.accuracy_rate <= 0.4) {
    return "negative_learning_signal";
  }

  return "mixed_learning_signal";
}

function recommendedAction(driver: DriverAggregate): string {
  const type = feedbackType(driver);

  if (type === "insufficient_validated_predictions") {
    return "continue_monitoring";
  }

  if (type === "positive_learning_signal") {
    return "consider_increasing_driver_confidence_after_human_review";
  }

  if (type === "negative_learning_signal") {
    return "review_driver_assumptions_before_future_use";
  }

  return "maintain_current_confidence_and_collect_more_evidence";
}

function learningAllowed(driver: DriverAggregate): boolean {
  return driver.scored_predictions > 0;
}

function main() {
  const source = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  const drivers: DriverAggregate[] = source.aggregates?.by_driver;

  if (!Array.isArray(drivers)) {
    throw new Error("Expected source.aggregates.by_driver to be an array.");
  }

  const feedback_records = drivers.map((driver) => {
    const type = feedbackType(driver);

    return {
      experience_feedback_version: "experience-feedback-v0.1",
      feedback_id: `FDB-${driver.group_key}`,
      driver_id: driver.group_key,
      driver_label: driver.group_label,

      feedback_type: type,
      feedback_status: "candidate",

      feedback_summary:
        type === "insufficient_validated_predictions"
          ? "No scored predictions are available yet. Experience update is not allowed."
          : `Driver has ${driver.scored_predictions} scored predictions with accuracy rate ${driver.accuracy_rate}.`,

      prediction_performance: {
        total_predictions: driver.total_predictions,
        pending_predictions: driver.pending_predictions,
        observed_predictions: driver.observed_predictions,
        expired_predictions: driver.expired_predictions,
        scored_predictions: driver.scored_predictions,
        correct_predictions: driver.correct_predictions,
        incorrect_predictions: driver.incorrect_predictions,
        accuracy_rate: driver.accuracy_rate,
        average_accuracy_score: driver.average_accuracy_score,
        prediction_ids: driver.prediction_ids,
      },

      recommended_action: recommendedAction(driver),

      experience_update_gate: {
        learning_allowed: learningAllowed(driver),
        reason:
          driver.scored_predictions === 0
            ? "Experience cannot be updated because no scored predictions exist."
            : "Experience update may be considered after human review.",
        minimum_scored_predictions_recommended: 3,
        current_scored_predictions: driver.scored_predictions,
      },

      governance: {
        feedback_is_not_memory_mutation: true,
        human_review_required_before_experience_update: true,
        auto_update_experience_allowed: false,
        production_mutation_allowed: false,
      },
    };
  });

  const feedbackCounts: Record<string, number> = {};
  for (const record of feedback_records) {
    feedbackCounts[record.feedback_type] =
      (feedbackCounts[record.feedback_type] || 0) + 1;
  }

  const output = {
    experience_feedback_registry_version: "experience-feedback-registry-v0.1",
    generated_at: new Date().toISOString(),
    source_prediction_accuracy_registry: INPUT_PATH,
    policy: {
      principle:
        "Experience feedback records learning signals from prediction performance without mutating experience memory.",
      prediction_accuracy_is_source_of_truth: true,
      feedback_does_not_update_experience: true,
      human_review_required_before_experience_update: true,
      production_mutation_allowed: false,
    },
    summary: {
      drivers_processed: drivers.length,
      feedback_records_generated: feedback_records.length,
      feedback_counts: feedbackCounts,
      learning_allowed_records: feedback_records.filter(
        (r) => r.experience_update_gate.learning_allowed
      ).length,
    },
    feedback_records,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    experience_feedback_registry_version:
      output.experience_feedback_registry_version,
    feedback_records_generated: feedback_records.length,
    feedback_counts: feedbackCounts,
    learning_allowed_records: output.summary.learning_allowed_records,
    output: OUTPUT_PATH,
  });
}

main();
