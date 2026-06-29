import { execFileSync } from "node:child_process";
import fs from "node:fs";

const replayDate = process.argv[2];

if (!replayDate) {
  console.error("Usage:");
  console.error("pnpm tsx src/scripts/run-replay-cycle.ts <replay_date>");
  console.error("");
  console.error("Example:");
  console.error("pnpm tsx src/scripts/run-replay-cycle.ts 2026-06-03T09:00:00.000Z");
  process.exit(1);
}

const safeDate = replayDate.replace(/:/g, "-");

const replayPlanPath = `data/replay-sandbox/replay-plan-${safeDate}.json`;
const predictionPath = `data/replay-sandbox/predictions/replay-predictions-similarity-${safeDate}.json`;
const scorePath = `data/replay-sandbox/scores/replay-score-${safeDate}.json`;
const accuracyPath = `data/replay-sandbox/accuracy/prediction-accuracy-${safeDate}.json`;
const experienceMetricsPath = "data/replay-sandbox/experience-metrics/experience-metrics-v0.1.json";
const experienceRegistryPath = "data/intelligence/experience-registry-v0.1.json";

function runStep(label: string, args: string[]) {
  console.log(`\n==================================================`);
  console.log(label);
  console.log(`==================================================`);

  execFileSync("pnpm", ["tsx", ...args], {
    stdio: "inherit",
  });
}

function readJson(path: string) {
  if (!fs.existsSync(path)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(path, "utf8"));
}

runStep("1. Build replay sandbox plan", [
  "src/scripts/build-replay-sandbox-plan.ts",
  replayDate,
]);

runStep("2. Score replay plan", [
  "src/scripts/score-replay-plan.ts",
  replayPlanPath,
]);

runStep("3. Build similarity replay predictions", [
  "src/scripts/build-replay-predictions-similarity.ts",
  replayPlanPath,
]);

runStep("4. Build sandbox ground truth", [
  "src/scripts/build-sandbox-ground-truth.ts",
]);

runStep("5. Score replay predictions", [
  "src/scripts/score-replay-predictions.ts",
  predictionPath,
]);

runStep("6. Build experience metrics", [
  "src/scripts/build-experience-metrics.ts",
]);

runStep("7. Build experience registry", [
  "src/scripts/build-experience-registry.ts",
]);

const score = readJson(scorePath);
const predictions = readJson(predictionPath);
const accuracy = readJson(accuracyPath);
const experienceMetrics = readJson(experienceMetricsPath);
const experienceRegistry = readJson(experienceRegistryPath);

console.log(`\n==================================================`);
console.log("REPLAY CYCLE SUMMARY");
console.log(`==================================================`);

console.log({
  replay_date: replayDate,
  replay_plan: replayPlanPath,
  prediction_file: predictionPath,
  accuracy_file: accuracyPath,
  score_summary: score?.summary ?? null,
  prediction_summary: predictions?.summary ?? null,
  accuracy_summary: accuracy?.summary ?? null,
  experience_metrics_summary: experienceMetrics
    ? {
        accuracy_runs: experienceMetrics.accuracy_runs,
        total_cases: experienceMetrics.total_cases,
        predictions_available: experienceMetrics.predictions_available,
        scorable_predictions: experienceMetrics.scorable_predictions,
        correct: experienceMetrics.correct,
        incorrect: experienceMetrics.incorrect,
        not_scorable: experienceMetrics.not_scorable,
        overall_accuracy_rate: experienceMetrics.overall_accuracy_rate,
      }
    : null,
  experience_registry_summary: experienceRegistry?.summary ?? null,
});

console.log(`\nReplay cycle completed.`);
