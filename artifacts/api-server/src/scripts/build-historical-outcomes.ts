import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const OUTPUT =
  "data/intelligence/historical-outcomes-v0.1.json";

async function main() {
  const files = await readdir(CASE_DIR);

  const caseFiles = files.filter(
    (f) => f.startsWith("case-SG-") && f.endsWith(".json"),
  );

  const outcomeStats: Record<string, any> = {};

  for (const file of caseFiles) {
    const caseFile = JSON.parse(
      await readFile(
        path.join(CASE_DIR, file),
        "utf8",
      ),
    );

    const outcome = caseFile.outcome;

    if (
      !outcome ||
      !outcome.primary_driver
    ) {
      continue;
    }

    const key = outcome.primary_driver;

    if (!outcomeStats[key]) {
      outcomeStats[key] = {
        primary_driver: key,
        primary_driver_name:
          outcome.primary_driver_name,
        cases: 0,

        confidence_distribution: {
          low: 0,
          medium: 0,
          high: 0,
        },

        case_ids: [],
      };
    }

    outcomeStats[key].cases += 1;

    outcomeStats[key].case_ids.push(
      caseFile.case_id,
    );

    const confidence =
      outcome.confidence ?? "low";

    if (
      outcomeStats[key]
        .confidence_distribution[
        confidence
      ] !== undefined
    ) {
      outcomeStats[key]
        .confidence_distribution[
        confidence
      ] += 1;
    }
  }

  const output = {
    historical_outcomes_version:
      "historical-outcomes-v0.1",

    generated_at:
      new Date().toISOString(),

    outcome_count:
      Object.keys(outcomeStats).length,

    outcomes:
      Object.values(outcomeStats),
  };

  await writeFile(
    OUTPUT,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log({
    historical_outcomes_version:
      "historical-outcomes-v0.1",

    outcomes:
      Object.keys(outcomeStats).length,

    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
