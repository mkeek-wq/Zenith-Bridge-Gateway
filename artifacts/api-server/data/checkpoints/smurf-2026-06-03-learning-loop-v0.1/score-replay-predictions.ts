import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const HISTORICAL_OUTCOMES_FILE =
  "data/intelligence/historical-outcomes-v0.1.json";

const SANDBOX_GROUND_TRUTH_FILE =
  "data/replay-sandbox/ground-truth/sandbox-ground-truth-v0.1.json";

const OUTPUT_DIR =
  "data/replay-sandbox/accuracy";

const [predictionFilePath] = process.argv.slice(2);

if (!predictionFilePath) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/score-replay-predictions.ts <prediction_file>",
      "",
      "Example:",
      "pnpm tsx src/scripts/score-replay-predictions.ts data/replay-sandbox/predictions/replay-predictions-similarity-2026-06-03T09-00-00.000Z.json",
    ].join("\n"),
  );

  process.exit(1);
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath: string) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

function safeFileName(value: string): string {
  return value.replace(/[:/]/g, "-");
}

async function main() {
  const now = new Date().toISOString();

  const predictionsFile = await readJson(predictionFilePath);

  const historicalOutcomes = await readJson(
    HISTORICAL_OUTCOMES_FILE,
  );

  const sandboxGroundTruth = await readJsonIfExists(
    SANDBOX_GROUND_TRUTH_FILE,
  );

  const actualOutcomeLookup = new Map<string, any>();

  for (const outcome of historicalOutcomes.outcomes ?? []) {
    for (const caseId of outcome.case_ids ?? []) {
      actualOutcomeLookup.set(caseId, {
        case_id: caseId,
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
        ground_truth_source: "historical_outcomes",
        ground_truth_confidence: "high",
        sandbox_only: false,
      });
    }
  }

  for (const record of sandboxGroundTruth?.records ?? []) {
    actualOutcomeLookup.set(record.case_id, {
      case_id: record.case_id,
      primary_driver: record.primary_driver,
      primary_driver_name: record.primary_driver_name,
      ground_truth_source:
        record.ground_truth_source ?? "sandbox_ground_truth",
      ground_truth_confidence:
        record.ground_truth_confidence ?? "unknown",
      sandbox_only: record.sandbox_only ?? true,
    });
  }

  const scoredPredictions = (predictionsFile.predictions ?? []).map(
    (prediction: any) => {
      const actualOutcome =
        actualOutcomeLookup.get(prediction.case_id) ?? null;

      if (!prediction.prediction_available) {
        return {
          case_id: prediction.case_id,
          prediction_available: false,
          prediction_status: prediction.prediction_status,
          predicted_outcome: null,
          actual_outcome: actualOutcome,
          accuracy_result: "not_scorable",
          accuracy_note:
            "No prediction was available for this case, so accuracy was not scored.",
        };
      }

      if (!actualOutcome) {
        return {
          case_id: prediction.case_id,
          prediction_available: true,
          prediction_status: prediction.prediction_status,
          predicted_outcome: prediction.predicted_outcome,
          actual_outcome: null,
          accuracy_result: "unknown_actual_outcome",
          accuracy_note:
            "Prediction exists, but no actual or sandbox ground truth outcome is available yet.",
        };
      }

      const predictedDriver =
        prediction.predicted_outcome?.primary_driver ?? null;

      const actualDriver =
        actualOutcome.primary_driver ?? null;

      const accuracyResult =
        predictedDriver === actualDriver ? "correct" : "incorrect";

      return {
        case_id: prediction.case_id,
        prediction_available: true,
        prediction_status: prediction.prediction_status,
        predicted_outcome: prediction.predicted_outcome,
        actual_outcome: actualOutcome,
        accuracy_result: accuracyResult,
        accuracy_note:
          accuracyResult === "correct"
            ? "Predicted driver matches ground truth driver."
            : "Predicted driver does not match ground truth driver.",
      };
    },
  );

  const scorablePredictions = scoredPredictions.filter(
    (item: any) =>
      item.accuracy_result === "correct" ||
      item.accuracy_result === "incorrect",
  );

  const correct = scoredPredictions.filter(
    (item: any) => item.accuracy_result === "correct",
  ).length;

  const incorrect = scoredPredictions.filter(
    (item: any) => item.accuracy_result === "incorrect",
  ).length;

  const sandboxScorable = scorablePredictions.filter(
    (item: any) => item.actual_outcome?.sandbox_only === true,
  ).length;

  const productionScorable = scorablePredictions.filter(
    (item: any) => item.actual_outcome?.sandbox_only === false,
  ).length;

  const summary = {
    total_cases: scoredPredictions.length,
    predictions_available: scoredPredictions.filter(
      (item: any) => item.prediction_available,
    ).length,
    scorable_predictions: scorablePredictions.length,
    correct,
    incorrect,
    unknown_actual_outcome: scoredPredictions.filter(
      (item: any) =>
        item.accuracy_result === "unknown_actual_outcome",
    ).length,
    not_scorable: scoredPredictions.filter(
      (item: any) => item.accuracy_result === "not_scorable",
    ).length,
    sandbox_scorable_predictions: sandboxScorable,
    production_scorable_predictions: productionScorable,
    accuracy_rate:
      scorablePredictions.length > 0
        ? Number(
            (
              (correct / scorablePredictions.length) *
              100
            ).toFixed(2),
          )
        : null,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = path.join(
    OUTPUT_DIR,
    `prediction-accuracy-${safeFileName(
      predictionsFile.replay_date,
    )}.json`,
  );

  const result = {
    prediction_accuracy_version: "prediction-accuracy-v0.2",
    generated_at: now,
    source_prediction_file: predictionFilePath,
    source_historical_outcomes_file: HISTORICAL_OUTCOMES_FILE,
    source_sandbox_ground_truth_file: sandboxGroundTruth
      ? SANDBOX_GROUND_TRUTH_FILE
      : null,
    sandbox_ground_truth_version:
      sandboxGroundTruth?.sandbox_ground_truth_version ?? null,
    replay_prediction_version:
      predictionsFile.replay_prediction_version,
    prediction_governance_version:
      predictionsFile.prediction_governance_version ?? null,
    replay_date: predictionsFile.replay_date,
    scoring_policy: {
      principle:
        "Prediction accuracy v0.2 can score against production historical outcomes and sandbox-only ground truth records.",
      production_mutation_allowed: false,
      labels: [
        "correct",
        "incorrect",
        "unknown_actual_outcome",
        "not_scorable",
      ],
    },
    summary,
    scored_predictions: scoredPredictions,
  };

  await writeFile(output, JSON.stringify(result, null, 2), "utf8");

  console.log({
    prediction_accuracy_version: "prediction-accuracy-v0.2",
    sandbox_ground_truth_version:
      sandboxGroundTruth?.sandbox_ground_truth_version ?? null,
    replay_date: predictionsFile.replay_date,
    ...summary,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
