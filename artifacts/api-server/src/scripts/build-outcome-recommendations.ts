import { readFile, writeFile } from "node:fs/promises";

const SIMILARITY_FILE =
  "data/intelligence/case-similarity-v0.1.json";

const HISTORICAL_FILE =
  "data/intelligence/historical-outcomes-v0.1.json";

const GOVERNANCE_FILE =
  "config/similarity-governance-v0.1.json";

const OUTPUT =
  "data/intelligence/outcome-recommendations-v0.1.json";

type HistoricalOutcome = {
  primary_driver: string;
  primary_driver_name: string;
  case_ids: string[];
};

type OutcomeLookupValue = {
  primary_driver: string;
  primary_driver_name: string;
};

type RecommendationStrength = "none" | "weak" | "moderate" | "strong";

function getRecommendationStrength(params: {
  governance: any;
  similarityPercent: number;
  supportingCases: number;
  supportRatio: number;
}): RecommendationStrength {
  const { governance, similarityPercent, supportingCases, supportRatio } =
    params;

  const levels = governance.recommendation_strength;

  if (
    similarityPercent >= levels.strong.min_similarity_percent &&
    supportingCases >= levels.strong.min_supporting_cases &&
    supportRatio >= levels.strong.min_support_ratio
  ) {
    return "strong";
  }

  if (
    similarityPercent >= levels.moderate.min_similarity_percent &&
    supportingCases >= levels.moderate.min_supporting_cases &&
    supportRatio >= levels.moderate.min_support_ratio
  ) {
    return "moderate";
  }

  if (
    similarityPercent >= levels.weak.min_similarity_percent &&
    supportingCases >= levels.weak.min_supporting_cases &&
    supportRatio >= levels.weak.min_support_ratio
  ) {
    return "weak";
  }

  return "none";
}

async function main() {
  const similarity = JSON.parse(
    await readFile(SIMILARITY_FILE, "utf8"),
  );

  const historical = JSON.parse(
    await readFile(HISTORICAL_FILE, "utf8"),
  );

  const governance = JSON.parse(
    await readFile(GOVERNANCE_FILE, "utf8"),
  );

  const outcomeLookup = new Map<string, OutcomeLookupValue>();

  for (const outcome of historical.outcomes as HistoricalOutcome[]) {
    for (const caseId of outcome.case_ids) {
      outcomeLookup.set(caseId, {
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
      });
    }
  }

  const recommendations = [];

  for (const item of similarity.similarities) {
    const counts: Record<string, any> = {};
    let eligibleSimilarCases = 0;

    for (const similar of item.similar_cases) {
      if (
        similar.similarity_percent <
        governance.minimum_similarity_percent
      ) {
        continue;
      }

      const outcome = outcomeLookup.get(similar.case_id);

      if (!outcome) continue;

      eligibleSimilarCases++;

      const key = outcome.primary_driver;

      if (!counts[key]) {
        counts[key] = {
          primary_driver: outcome.primary_driver,
          primary_driver_name: outcome.primary_driver_name,
          supporting_cases: 0,
          similarity_percents: [],
          supporting_case_ids: [],
        };
      }

      counts[key].supporting_cases++;
      counts[key].similarity_percents.push(similar.similarity_percent);
      counts[key].supporting_case_ids.push(similar.case_id);
    }

    const ranked = Object.values(counts)
      .map((candidate: any) => {
        const maxSimilarityPercent = Math.max(
          ...candidate.similarity_percents,
        );

        const averageSimilarityPercent =
          candidate.similarity_percents.reduce(
            (sum: number, value: number) => sum + value,
            0,
          ) / candidate.similarity_percents.length;

        const supportRatio =
          eligibleSimilarCases > 0
            ? candidate.supporting_cases / eligibleSimilarCases
            : 0;

        const recommendationStrength = getRecommendationStrength({
          governance,
          similarityPercent: maxSimilarityPercent,
          supportingCases: candidate.supporting_cases,
          supportRatio,
        });

        return {
          primary_driver: candidate.primary_driver,
          primary_driver_name: candidate.primary_driver_name,
          recommendation_strength: recommendationStrength,
          supporting_cases: candidate.supporting_cases,
          support_ratio: Number(supportRatio.toFixed(4)),
          max_similarity_percent: Number(
            maxSimilarityPercent.toFixed(2),
          ),
          average_similarity_percent: Number(
            averageSimilarityPercent.toFixed(2),
          ),
          supporting_case_ids: candidate.supporting_case_ids,
        };
      })
      .sort(
        (a: any, b: any) =>
          b.supporting_cases - a.supporting_cases ||
          b.max_similarity_percent - a.max_similarity_percent,
      );

    const top = ranked[0] ?? null;

    recommendations.push({
      case_id: item.case_id,
      recommendation_available:
        top !== null && top.recommendation_strength !== "none",
      recommended_outcome:
        top !== null && top.recommendation_strength !== "none"
          ? top
          : null,
      no_recommendation_reason:
        top === null
          ? "no_similar_closed_cases_above_threshold"
          : top.recommendation_strength === "none"
            ? "insufficient_similarity_governance"
            : null,
      eligible_similar_cases: eligibleSimilarCases,
      governance_applied: governance.version,
      candidate_outcomes: ranked,
    });
  }

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        recommendation_version:
          "outcome-recommendation-v0.2",

        generated_at:
          new Date().toISOString(),

        source_files: {
          similarity: SIMILARITY_FILE,
          historical_outcomes: HISTORICAL_FILE,
          governance: GOVERNANCE_FILE,
        },

        governance,

        recommendations,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log({
    recommendation_version:
      "outcome-recommendation-v0.2",

    recommendations:
      recommendations.length,

    with_recommendation:
      recommendations.filter(
        (item) => item.recommendation_available,
      ).length,

    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
