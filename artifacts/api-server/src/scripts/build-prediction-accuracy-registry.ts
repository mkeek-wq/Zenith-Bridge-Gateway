import fs from "fs";
import path from "path";

type ValidationRecord = {
  prediction_id: string;
  driver_id: string;
  driver_name: string;
  indicator: string;
  prediction_horizon: string;
  validation_status: string;
  correctness: "correct" | "incorrect" | null;
  accuracy_score: number | null;
};

const INPUT_PATH = "data/intelligence/prediction-validation-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/prediction-accuracy-registry-v0.1.json";

type Aggregate = {
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

function createAggregate(groupKey: string, groupLabel: string): Aggregate {
  return {
    group_key: groupKey,
    group_label: groupLabel,
    total_predictions: 0,
    pending_predictions: 0,
    observed_predictions: 0,
    expired_predictions: 0,
    scored_predictions: 0,
    correct_predictions: 0,
    incorrect_predictions: 0,
    accuracy_rate: null,
    average_accuracy_score: null,
    prediction_ids: [],
  };
}

function addToAggregate(aggregate: Aggregate, record: ValidationRecord) {
  aggregate.total_predictions += 1;
  aggregate.prediction_ids.push(record.prediction_id);

  if (record.validation_status === "pending") {
    aggregate.pending_predictions += 1;
  }

  if (record.validation_status === "observed") {
    aggregate.observed_predictions += 1;
  }

  if (record.validation_status === "expired") {
    aggregate.expired_predictions += 1;
  }

  if (record.accuracy_score !== null && record.accuracy_score !== undefined) {
    aggregate.scored_predictions += 1;
  }

  if (record.correctness === "correct") {
    aggregate.correct_predictions += 1;
  }

  if (record.correctness === "incorrect") {
    aggregate.incorrect_predictions += 1;
  }
}

function finalizeAggregate(aggregate: Aggregate) {
  if (aggregate.scored_predictions > 0) {
    aggregate.accuracy_rate =
      aggregate.correct_predictions / aggregate.scored_predictions;

    aggregate.average_accuracy_score =
      aggregate.correct_predictions / aggregate.scored_predictions;
  }

  return aggregate;
}

function buildAggregates(
  records: ValidationRecord[],
  keyFn: (record: ValidationRecord) => string,
  labelFn: (record: ValidationRecord) => string
): Aggregate[] {
  const map = new Map<string, Aggregate>();

  for (const record of records) {
    const key = keyFn(record);
    const label = labelFn(record);

    if (!map.has(key)) {
      map.set(key, createAggregate(key, label));
    }

    addToAggregate(map.get(key)!, record);
  }

  return Array.from(map.values())
    .map(finalizeAggregate)
    .sort((a, b) => a.group_key.localeCompare(b.group_key));
}

function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const source = JSON.parse(raw);

  const validations: ValidationRecord[] = source.validations;

  if (!Array.isArray(validations)) {
    throw new Error("Expected source.validations to be an array.");
  }

  const scoredValidations = validations.filter(
    (v) => v.accuracy_score !== null && v.accuracy_score !== undefined
  );

  const correctValidations = validations.filter((v) => v.correctness === "correct");
  const incorrectValidations = validations.filter(
    (v) => v.correctness === "incorrect"
  );

  const output = {
    prediction_accuracy_registry_version: "prediction-accuracy-registry-v0.1",
    generated_at: new Date().toISOString(),
    source_prediction_validations: INPUT_PATH,
    policy: {
      principle:
        "Prediction accuracy is calculated only from validated and scored prediction records.",
      pending_predictions_do_not_affect_accuracy: true,
      human_review_required_for_scoring: true,
      auto_learning_allowed: false,
      production_mutation_allowed: false,
    },
    summary: {
      total_predictions: validations.length,
      pending_predictions: validations.filter((v) => v.validation_status === "pending")
        .length,
      observed_predictions: validations.filter(
        (v) => v.validation_status === "observed"
      ).length,
      expired_predictions: validations.filter((v) => v.validation_status === "expired")
        .length,
      scored_predictions: scoredValidations.length,
      correct_predictions: correctValidations.length,
      incorrect_predictions: incorrectValidations.length,
      overall_accuracy_rate:
        scoredValidations.length > 0
          ? correctValidations.length / scoredValidations.length
          : null,
    },
    aggregates: {
      by_driver: buildAggregates(
        validations,
        (v) => v.driver_id,
        (v) => `${v.driver_id} ${v.driver_name}`
      ),
      by_indicator: buildAggregates(
        validations,
        (v) => v.indicator,
        (v) => v.indicator
      ),
      by_prediction_horizon: buildAggregates(
        validations,
        (v) => v.prediction_horizon,
        (v) => v.prediction_horizon
      ),
      by_validation_status: buildAggregates(
        validations,
        (v) => v.validation_status,
        (v) => v.validation_status
      ),
    },
    governance: {
      accuracy_is_not_available_until_predictions_are_scored: true,
      validation_registry_is_source_of_truth: true,
      experience_feedback_requires_accuracy_registry: true,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    prediction_accuracy_registry_version:
      output.prediction_accuracy_registry_version,
    total_predictions: output.summary.total_predictions,
    scored_predictions: output.summary.scored_predictions,
    output: OUTPUT_PATH,
  });
}

main();
