import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SIMILARITY_FILE =
  "data/intelligence/case-similarity-v0.1.json";

const HISTORICAL_OUTCOMES_FILE =
  "data/intelligence/historical-outcomes-v0.1.json";

const OUTPUT_DIR =
  "data/replay-sandbox/predictions";

const [replayPlanPath] = process.argv.slice(2);

if (!replayPlanPath) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/build-replay-predictions-similarity.ts <replay_plan_path>",
      "",
      "Example:",
      "pnpm tsx src/scripts/build-replay-predictions-similarity.ts data/replay-sandbox/replay-plan-2026-06-03T09-00-00.000Z.json",
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

function getPredictionStrength(params: {
  supportingCases: number;
  maxSimilarityPercent: number;
  averageSimilarityPercent: number;
}) {
  const {
    supportingCases,
    maxSimilarityPercent,
    averageSimilarityPercent,
  } = params;

  if (
    supportingCases >= 3 &&
    maxSimilarityPercent >= 85 &&
    averageSimilarityPercent >= 75
  ) {
    return "high";
  }

  if (
    supportingCases >= 2 &&
    maxSimilarityPercent >= 70 &&
    averageSimilarityPercent >= 60
  ) {
    return "medium";
  }

  if (supportingCases >= 1 && maxSimilarityPercent >= 60) {
    return "low";
  }

  return "none";
}

async function main() {
  const now = new Date().toISOString();

  const replayPlan = await readJson(replayPlanPath);
  const similarity = await readJson(SIMILARITY_FILE);
  const historicalOutcomes = await readJson(HISTORICAL_OUTCOMES_FILE);

  const visibleOutcomeCaseIds = new Set(
    (replayPlan.replay_cases ?? [])
      .filter(
        (item: any) => item.case_visible && item.outcome_visible,
      )
      .map((item: any) => item.case_id),
  );

  const outcomeLookup = new Map<string, any>();

  for (const outcome of historicalOutcomes.outcomes ?? []) {
    for (const caseId of outcome.case_ids ?? []) {
      outcomeLookup.set(caseId, {
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
      });
    }
  }

  const similarityLookup = new Map(
    (similarity.similarities ?? []).map((item: any) => [
      item.case_id,
      item,
    ]),
  );

  const predictions = (replayPlan.replay_cases ?? []).map(
    (replayCase: any) => {
      if (!replayCase.case_visible) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "case_not_visible",
          predicted_outcome: null,
          prediction_note:
            "Case was not visible at replay date.",
        };
      }

      if (replayCase.outcome_visible) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "outcome_already_visible",
          predicted_outcome: null,
          prediction_note:
            "Outcome was already visible at replay date. Case is treated as ground truth, not a prediction target.",
        };
      }

      const similarityRecord = similarityLookup.get(
        replayCase.case_id,
      );

      if (!similarityRecord) {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status: "missing_similarity_record",
          predicted_outcome: null,
          prediction_note:
            "No similarity record found for this case.",
        };
      }

      const candidates: Record<string, any> = {};

      for (const similarCase of similarityRecord.similar_cases ?? []) {
        if (!visibleOutcomeCaseIds.has(similarCase.case_id)) {
          continue;
        }

        const outcome = outcomeLookup.get(similarCase.case_id);

        if (!outcome) continue;

        const key = outcome.primary_driver;

        if (!candidates[key]) {
          candidates[key] = {
            primary_driver: outcome.primary_driver,
            primary_driver_name: outcome.primary_driver_name,
            supporting_cases: 0,
            supporting_case_ids: [],
            similarity_percents: [],
          };
        }

        candidates[key].supporting_cases++;
        candidates[key].supporting_case_ids.push(
          similarCase.case_id,
        );
        candidates[key].similarity_percents.push(
          similarCase.similarity_percent,
        );
      }

      const rankedCandidates = Object.values(candidates)
        .map((candidate: any) => {
          const maxSimilarityPercent = Math.max(
            ...candidate.similarity_percents,
          );

          const averageSimilarityPercent =
            candidate.similarity_percents.reduce(
              (sum: number, value: number) => sum + value,
              0,
            ) / candidate.similarity_percents.length;

          const predictionStrength = getPredictionStrength({
            supportingCases: candidate.supporting_cases,
            maxSimilarityPercent,
            averageSimilarityPercent,
          });

          return {
            primary_driver: candidate.primary_driver,
            primary_driver_name: candidate.primary_driver_name,
            supporting_cases: candidate.supporting_cases,
            supporting_case_ids: candidate.supporting_case_ids,
            max_similarity_percent: Number(
              maxSimilarityPercent.toFixed(2),
            ),
            average_similarity_percent: Number(
              averageSimilarityPercent.toFixed(2),
            ),
            prediction_strength: predictionStrength,
          };
        })
        .sort(
          (a: any, b: any) =>
            b.supporting_cases - a.supporting_cases ||
            b.max_similarity_percent - a.max_similarity_percent,
        );

      const topCandidate: any = rankedCandidates[0] ?? null;

      if (!topCandidate || topCandidate.prediction_strength === "none") {
        return {
          case_id: replayCase.case_id,
          prediction_available: false,
          prediction_status:
            "no_visible_similar_outcome_above_threshold",
          predicted_outcome: null,
          candidate_outcomes: rankedCandidates,
          prediction_note:
            "No visible similar outcome met the minimum similarity threshold.",
        };
      }

      return {
        case_id: replayCase.case_id,
        prediction_available: true,
        prediction_status: "similarity_prediction_available",
        predicted_outcome: {
          ...topCandidate,
          prediction_method:
            "similar_visible_historical_outcome",
        },
        candidate_outcomes: rankedCandidates,
        prediction_note:
          "Prediction generated from replay-visible similar historical outcomes only.",
      };
    },
  );

  const summary = {
    total_cases: predictions.length,
    visible_prior_outcomes: visibleOutcomeCaseIds.size,
    predictions_available: predictions.filter(
      (item: any) => item.prediction_available,
    ).length,
    case_not_visible: predictions.filter(
      (item: any) => item.prediction_status === "case_not_visible",
    ).length,
    outcome_already_visible: predictions.filter(
      (item: any) =>
        item.prediction_status === "outcome_already_visible",
    ).length,
    no_visible_similar_outcome_above_threshold:
      predictions.filter(
        (item: any) =>
          item.prediction_status ===
          "no_visible_similar_outcome_above_threshold",
      ).length,
    missing_similarity_record: predictions.filter(
      (item: any) =>
        item.prediction_status === "missing_similarity_record",
    ).length,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = path.join(
    OUTPUT_DIR,
    `replay-predictions-similarity-${safeFileName(
      replayPlan.replay_date,
    )}.json`,
  );

  const result = {
    replay_prediction_version: "replay-prediction-v0.2-similarity",
    generated_at: now,
    source_replay_plan: replayPlanPath,
    source_similarity_file: SIMILARITY_FILE,
    source_historical_outcomes_file: HISTORICAL_OUTCOMES_FILE,
    replay_date: replayPlan.replay_date,
    prediction_policy: {
      principle:
        "Similarity replay prediction may only use outcomes visible at the replay date. Hidden or future outcomes must be excluded.",
      method:
        "Filter similar cases to replay-visible outcomes, then rank outcome drivers by support and similarity.",
      strength_thresholds: {
        low: ">=1 supporting case and max similarity >=60",
        medium:
          ">=2 supporting cases, max similarity >=70, average similarity >=60",
        high:
          ">=3 supporting cases, max similarity >=85, average similarity >=75",
      },
    },
    summary,
    predictions,
  };

  await writeFile(output, JSON.stringify(result, null, 2), "utf8");

  console.log({
    replay_prediction_version:
      "replay-prediction-v0.2-similarity",
    replay_date: replayPlan.replay_date,
    ...summary,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
