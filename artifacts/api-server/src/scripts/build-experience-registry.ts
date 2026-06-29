import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ACCURACY_DIR = "data/replay-sandbox/accuracy";
const OUTPUT_DIR = "data/intelligence";
const OUTPUT = path.join(OUTPUT_DIR, "experience-registry-v0.1.json");

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function percentage(numerator: number, denominator: number) {
  if (denominator === 0) return null;

  return Number(((numerator / denominator) * 100).toFixed(2));
}

async function main() {
  const now = new Date().toISOString();

  let files: string[] = [];

  try {
    files = (await readdir(ACCURACY_DIR))
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    files = [];
  }

  const driverRegistry: Record<string, any> = {};
  const strengthRegistry: Record<string, any> = {};
  const governanceRegistry: Record<string, any> = {};

  let totalPredictions = 0;
  let scorablePredictions = 0;
  let correct = 0;
  let incorrect = 0;
  let sandboxScorable = 0;
  let productionScorable = 0;

  for (const file of files) {
    const filePath = path.join(ACCURACY_DIR, file);
    const accuracyFile = await readJson(filePath);

    const governanceVersion =
      accuracyFile.prediction_governance_version ??
      "unknown_governance";

    if (!governanceRegistry[governanceVersion]) {
      governanceRegistry[governanceVersion] = {
        prediction_governance_version: governanceVersion,
        predictions_made: 0,
        scorable_predictions: 0,
        correct: 0,
        incorrect: 0,
        sandbox_scorable_predictions: 0,
        production_scorable_predictions: 0,
        accuracy_rate: null,
      };
    }

    for (const scored of accuracyFile.scored_predictions ?? []) {
      if (!scored.prediction_available) continue;

      totalPredictions++;

      const predictedDriver =
        scored.predicted_outcome?.primary_driver ?? "unknown_driver";

      const predictedDriverName =
        scored.predicted_outcome?.primary_driver_name ?? null;

      const predictionStrength =
        scored.predicted_outcome?.prediction_strength ?? "unknown_strength";

      if (!driverRegistry[predictedDriver]) {
        driverRegistry[predictedDriver] = {
          primary_driver: predictedDriver,
          primary_driver_name: predictedDriverName,
          predictions_made: 0,
          scorable_predictions: 0,
          correct: 0,
          incorrect: 0,
          unknown_actual_outcome: 0,
          sandbox_scorable_predictions: 0,
          production_scorable_predictions: 0,
          accuracy_rate: null,
        };
      }

      if (!strengthRegistry[predictionStrength]) {
        strengthRegistry[predictionStrength] = {
          prediction_strength: predictionStrength,
          predictions_made: 0,
          scorable_predictions: 0,
          correct: 0,
          incorrect: 0,
          unknown_actual_outcome: 0,
          sandbox_scorable_predictions: 0,
          production_scorable_predictions: 0,
          accuracy_rate: null,
        };
      }

      driverRegistry[predictedDriver].predictions_made++;
      strengthRegistry[predictionStrength].predictions_made++;
      governanceRegistry[governanceVersion].predictions_made++;

      if (scored.accuracy_result === "unknown_actual_outcome") {
        driverRegistry[predictedDriver].unknown_actual_outcome++;
        strengthRegistry[predictionStrength].unknown_actual_outcome++;
        continue;
      }

      if (
        scored.accuracy_result !== "correct" &&
        scored.accuracy_result !== "incorrect"
      ) {
        continue;
      }

      scorablePredictions++;

      driverRegistry[predictedDriver].scorable_predictions++;
      strengthRegistry[predictionStrength].scorable_predictions++;
      governanceRegistry[governanceVersion].scorable_predictions++;

      const isSandbox =
        scored.actual_outcome?.sandbox_only === true;

      if (isSandbox) {
        sandboxScorable++;
        driverRegistry[predictedDriver].sandbox_scorable_predictions++;
        strengthRegistry[predictionStrength].sandbox_scorable_predictions++;
        governanceRegistry[governanceVersion].sandbox_scorable_predictions++;
      } else {
        productionScorable++;
        driverRegistry[predictedDriver].production_scorable_predictions++;
        strengthRegistry[predictionStrength].production_scorable_predictions++;
        governanceRegistry[governanceVersion].production_scorable_predictions++;
      }

      if (scored.accuracy_result === "correct") {
        correct++;
        driverRegistry[predictedDriver].correct++;
        strengthRegistry[predictionStrength].correct++;
        governanceRegistry[governanceVersion].correct++;
      }

      if (scored.accuracy_result === "incorrect") {
        incorrect++;
        driverRegistry[predictedDriver].incorrect++;
        strengthRegistry[predictionStrength].incorrect++;
        governanceRegistry[governanceVersion].incorrect++;
      }
    }
  }

  for (const item of Object.values(driverRegistry) as any[]) {
    item.accuracy_rate = percentage(
      item.correct,
      item.scorable_predictions,
    );
  }

  for (const item of Object.values(strengthRegistry) as any[]) {
    item.accuracy_rate = percentage(
      item.correct,
      item.scorable_predictions,
    );
  }

  for (const item of Object.values(governanceRegistry) as any[]) {
    item.accuracy_rate = percentage(
      item.correct,
      item.scorable_predictions,
    );
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = {
    experience_registry_version: "experience-registry-v0.1",
    generated_at: now,
    source_accuracy_dir: ACCURACY_DIR,
    policy: {
      principle:
        "Experience registry aggregates measured replay prediction performance into reusable institutional memory.",
      warning:
        "Sandbox-scored predictions are useful for plumbing tests but must not be treated as production accuracy.",
    },
    summary: {
      accuracy_files_processed: files.length,
      predictions_made: totalPredictions,
      scorable_predictions: scorablePredictions,
      correct,
      incorrect,
      sandbox_scorable_predictions: sandboxScorable,
      production_scorable_predictions: productionScorable,
      overall_accuracy_rate: percentage(correct, scorablePredictions),
    },
    by_driver: Object.values(driverRegistry),
    by_prediction_strength: Object.values(strengthRegistry),
    by_prediction_governance_version: Object.values(governanceRegistry),
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log({
    experience_registry_version: "experience-registry-v0.1",
    accuracy_files_processed: files.length,
    predictions_made: totalPredictions,
    scorable_predictions: scorablePredictions,
    correct,
    incorrect,
    sandbox_scorable_predictions: sandboxScorable,
    production_scorable_predictions: productionScorable,
    overall_accuracy_rate: output.summary.overall_accuracy_rate,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
