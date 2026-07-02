import { readFile, writeFile } from "node:fs/promises";

const SIMILARITY_FILE =
  "data/intelligence/case-similarity-v0.1.json";

const HISTORICAL_FILE =
  "data/intelligence/historical-outcomes-v0.1.json";

const OUTPUT =
  "data/intelligence/outcome-recommendations-v0.1.json";

async function main() {
  const similarity = JSON.parse(
    await readFile(SIMILARITY_FILE, "utf8"),
  );

  const historical = JSON.parse(
    await readFile(HISTORICAL_FILE, "utf8"),
  );

  const outcomeLookup = new Map();

  for (const outcome of historical.outcomes) {
    for (const caseId of outcome.case_ids) {
      outcomeLookup.set(caseId, {
        primary_driver: outcome.primary_driver,
        primary_driver_name:
          outcome.primary_driver_name,
      });
    }
  }

  const recommendations = [];

  for (const item of similarity.similarities) {
    const counts: Record<string, any> = {};

    for (const similar of item.similar_cases) {
      const outcome = outcomeLookup.get(
        similar.case_id,
      );

      if (!outcome) continue;

      const key = outcome.primary_driver;

      if (!counts[key]) {
        counts[key] = {
          primary_driver:
            outcome.primary_driver,

          primary_driver_name:
            outcome.primary_driver_name,

          supporting_cases: 0,
        };
      }

      counts[key].supporting_cases++;
    }

    const ranked = Object.values(counts)
      .sort(
        (a: any, b: any) =>
          b.supporting_cases -
          a.supporting_cases,
      );

    recommendations.push({
      case_id: item.case_id,

      recommended_outcome:
        ranked[0] ?? null,

      candidate_outcomes:
        ranked,
    });
  }

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        recommendation_version:
          "outcome-recommendation-v0.1",

        generated_at:
          new Date().toISOString(),

        recommendations,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log({
    recommendation_version:
      "outcome-recommendation-v0.1",

    recommendations:
      recommendations.length,

    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
