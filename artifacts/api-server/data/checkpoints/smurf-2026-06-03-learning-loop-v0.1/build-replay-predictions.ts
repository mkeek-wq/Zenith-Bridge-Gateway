import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = "data/replay-sandbox/predictions";

const [replayPlanPath] = process.argv.slice(2);

if (!replayPlanPath) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/build-replay-predictions.ts <replay_plan_path>",
      "",
      "Example:",
      "pnpm tsx src/scripts/build-replay-predictions.ts data/replay-sandbox/replay-plan-2026-06-03T09-00-00.000Z.json",
    ].join("\n"),
  );
  process.exit(1);
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function safeFileName(value: string): string {
  return value.replace(/[:/]/g, "-");
}

function getVisibleOutcomeCases(replayCases: any[]) {
  return replayCases.filter(
    (item) => item.case_visible && item.outcome_visible,
  );
}

async function main() {
  const now = new Date().toISOString();

  const replayPlan = await readJson(replayPlanPath);

  const visibleOutcomeCases = getVisibleOutcomeCases(
    replayPlan.replay_cases ?? [],
  );

  const visibleOutcomeDrivers = visibleOutcomeCases
    .map((item: any) => {
      const outcome =
        item.latest_visible_history_event?.new_state?.outcome ??
        item.latest_visible_history_event?.outcome ??
        null;

      return {
        case_id: item.case_id,
        primary_driver: outcome?.primary_driver ?? null,
        primary_driver_name: outcome?.primary_driver_name ?? null,
        confidence: outcome?.confidence ?? null,
        outcome_closed_at: item.outcome_closed_at ?? null,
      };
    })
    .filter((item: any) => item.primary_driver);

  const driverCounts: Record<string, any> = {};

  for (const outcome of visibleOutcomeDrivers) {
    const key = outcome.primary_driver;

    if (!driverCounts[key]) {
      driverCounts[key] = {
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
        supporting_cases: 0,
        supporting_case_ids: [],
      };
    }

    driverCounts[key].supporting_cases++;
    driverCounts[key].supporting_case_ids.push(outcome.case_id);
  }

  const rankedDrivers = Object.values(driverCounts).sort(
    (a: any, b: any) => b.supporting_cases - a.supporting_cases,
  );

  const topDriver: any = rankedDrivers[0] ?? null;

  const predictions = (replayPlan.replay_cases ?? []).map(
    (replayCase: any) => {
      if (!replayCase.case_visible) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "case_not_visible",
          predicted_outcome: null,
          prediction_note:
            "Case was not visible at replay date, so no prediction was attempted.",
        };
      }

      if (replayCase.outcome_visible) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "outcome_already_visible",
          predicted_outcome: null,
          prediction_note:
            "Outcome was already visible at replay date. This case is ground truth, not a prediction target.",
        };
      }

      if (!topDriver) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "no_prior_visible_outcomes",
          predicted_outcome: null,
          prediction_note:
            "No prior visible outcomes were available at replay date.",
        };
      }

      return {
        case_id: replayCase.case_id,
        prediction_available: true,
        prediction_status: "baseline_prior_outcome_prediction",
        predicted_outcome: {
          primary_driver: topDriver.primary_driver,
          primary_driver_name: topDriver.primary_driver_name,
          supporting_cases: topDriver.supporting_cases,
          supporting_case_ids: topDriver.supporting_case_ids,
          prediction_method:
            "most_common_visible_prior_outcome",
        },
        prediction_note:
          "Prediction generated from the most common visible prior outcome at replay date.",
      };
    },
  );

  const summary = {
    total_cases: predictions.length,
    visible_prior_outcomes: visibleOutcomeDrivers.length,
    prediction_targets: predictions.filter(
      (item: any) => item.prediction_status !== "case_not_visible",
    ).length,
    predictions_available: predictions.filter(
      (item: any) => item.prediction_available,
    ).length,
    no_prior_visible_outcomes: predictions.filter(
      (item: any) =>
        item.prediction_status === "no_prior_visible_outcomes",
    ).length,
    outcome_already_visible: predictions.filter(
      (item: any) =>
        item.prediction_status === "outcome_already_visible",
    ).length,
    case_not_visible: predictions.filter(
      (item: any) => item.prediction_status === "case_not_visible",
    ).length,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = path.join(
    OUTPUT_DIR,
    `replay-predictions-${safeFileName(replayPlan.replay_date)}.json`,
  );

  const result = {
    replay_prediction_version: "replay-prediction-v0.1",
    generated_at: now,
    source_replay_plan: replayPlanPath,
    replay_plan_version: replayPlan.replay_plan_version,
    replay_date: replayPlan.replay_date,
    prediction_policy: {
      principle:
        "Replay prediction v0.1 only uses outcomes visible at the replay date. No future outcomes may be used.",
      method:
        "baseline most-common visible prior outcome; not similarity-aware yet.",
      limitations: [
        "Does not yet use case similarity.",
        "Does not yet compare against future actual outcomes.",
        "Only produces predictions when at least one prior visible outcome exists.",
      ],
    },
    visible_prior_outcomes: visibleOutcomeDrivers,
    ranked_visible_drivers: rankedDrivers,
    summary,
    predictions,
  };

  await writeFile(output, JSON.stringify(result, null, 2), "utf8");

  console.log({
    replay_prediction_version: "replay-prediction-v0.1",
    replay_date: replayPlan.replay_date,
    ...summary,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
