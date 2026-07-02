import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ACCURACY_DIR = "data/replay-sandbox/accuracy";
const OUTPUT_DIR = "data/replay-sandbox/experience-metrics";
const OUTPUT = path.join(OUTPUT_DIR, "experience-metrics-v0.1.json");

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const now = new Date().toISOString();

  await mkdir(OUTPUT_DIR, { recursive: true });

  let files: string[] = [];

  try {
    files = (await readdir(ACCURACY_DIR))
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    files = [];
  }

  const accuracyRuns = [];

  for (const file of files) {
    const filePath = path.join(ACCURACY_DIR, file);
    const accuracyFile = await readJson(filePath);

    accuracyRuns.push({
      file: filePath,
      replay_date: accuracyFile.replay_date,
      prediction_accuracy_version:
        accuracyFile.prediction_accuracy_version,
      replay_prediction_version:
        accuracyFile.replay_prediction_version,
      prediction_governance_version:
        accuracyFile.prediction_governance_version,
      summary: accuracyFile.summary,
    });
  }

  const totals = accuracyRuns.reduce(
    (acc: any, run: any) => {
      const s = run.summary ?? {};

      acc.total_cases += s.total_cases ?? 0;
      acc.predictions_available += s.predictions_available ?? 0;
      acc.scorable_predictions += s.scorable_predictions ?? 0;
      acc.correct += s.correct ?? 0;
      acc.incorrect += s.incorrect ?? 0;
      acc.unknown_actual_outcome += s.unknown_actual_outcome ?? 0;
      acc.not_scorable += s.not_scorable ?? 0;

      return acc;
    },
    {
      total_cases: 0,
      predictions_available: 0,
      scorable_predictions: 0,
      correct: 0,
      incorrect: 0,
      unknown_actual_outcome: 0,
      not_scorable: 0,
    },
  );

  const overallAccuracyRate =
    totals.scorable_predictions > 0
      ? Number(
          ((totals.correct / totals.scorable_predictions) * 100).toFixed(
            2,
          ),
        )
      : null;

  const byGovernance: Record<string, any> = {};

  for (const run of accuracyRuns) {
    const key =
      run.prediction_governance_version ?? "no_governance_version";

    if (!byGovernance[key]) {
      byGovernance[key] = {
        prediction_governance_version: key,
        runs: 0,
        total_cases: 0,
        predictions_available: 0,
        scorable_predictions: 0,
        correct: 0,
        incorrect: 0,
        unknown_actual_outcome: 0,
        not_scorable: 0,
        accuracy_rate: null,
      };
    }

    const s = run.summary ?? {};

    byGovernance[key].runs++;
    byGovernance[key].total_cases += s.total_cases ?? 0;
    byGovernance[key].predictions_available +=
      s.predictions_available ?? 0;
    byGovernance[key].scorable_predictions +=
      s.scorable_predictions ?? 0;
    byGovernance[key].correct += s.correct ?? 0;
    byGovernance[key].incorrect += s.incorrect ?? 0;
    byGovernance[key].unknown_actual_outcome +=
      s.unknown_actual_outcome ?? 0;
    byGovernance[key].not_scorable += s.not_scorable ?? 0;
  }

  for (const key of Object.keys(byGovernance)) {
    const item = byGovernance[key];

    item.accuracy_rate =
      item.scorable_predictions > 0
        ? Number(
            ((item.correct / item.scorable_predictions) * 100).toFixed(2),
          )
        : null;
  }

  const output = {
    experience_metrics_version: "experience-metrics-v0.1",
    generated_at: now,
    source_accuracy_dir: ACCURACY_DIR,
    metrics_policy: {
      principle:
        "Experience metrics aggregate replay prediction accuracy over time. Accuracy remains null until actual outcomes are available.",
      current_limitations: [
        "Only accuracy files present in the replay sandbox are included.",
        "Accuracy is only computed when actual historical outcomes exist.",
        "Current pilot may show null accuracy because predicted cases are not yet closed.",
      ],
    },
    summary: {
      accuracy_runs: accuracyRuns.length,
      ...totals,
      overall_accuracy_rate: overallAccuracyRate,
    },
    by_prediction_governance_version: Object.values(byGovernance),
    accuracy_runs: accuracyRuns,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log({
    experience_metrics_version: "experience-metrics-v0.1",
    accuracy_runs: accuracyRuns.length,
    ...totals,
    overall_accuracy_rate: overallAccuracyRate,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
