import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const HISTORICAL_OUTCOMES_FILE =
  "data/intelligence/historical-outcomes-v0.1.json";

const SANDBOX_OVERRIDES_FILE =
  "data/replay-sandbox/ground-truth/sandbox-overrides-v0.1.json";

const OUTPUT_DIR =
  "data/replay-sandbox/ground-truth";

const OUTPUT = path.join(
  OUTPUT_DIR,
  "sandbox-ground-truth-v0.1.json",
);

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

async function main() {
  const now = new Date().toISOString();

  const historicalOutcomes = await readJson(
    HISTORICAL_OUTCOMES_FILE,
  );

  const sandboxOverrides = await readJsonIfExists(
    SANDBOX_OVERRIDES_FILE,
  );

  const recordMap = new Map<string, any>();

  for (const outcome of historicalOutcomes.outcomes ?? []) {
    for (const caseId of outcome.case_ids ?? []) {
      recordMap.set(caseId, {
        case_id: caseId,
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
        ground_truth_source: "historical_outcomes",
        ground_truth_confidence: "high",
        sandbox_only: false,
      });
    }
  }

  for (const override of sandboxOverrides?.records ?? []) {
    recordMap.set(override.case_id, {
      ...override,
      sandbox_only: true,
      ground_truth_source:
        override.ground_truth_source ?? "sandbox_override",
      ground_truth_confidence:
        override.ground_truth_confidence ?? "test",
    });
  }

  const records = Array.from(recordMap.values()).sort(
    (a: any, b: any) => a.case_id.localeCompare(b.case_id),
  );

  const output = {
    sandbox_ground_truth_version: "sandbox-ground-truth-v0.2",
    generated_at: now,
    source_historical_outcomes_file: HISTORICAL_OUTCOMES_FILE,
    source_sandbox_overrides_file: sandboxOverrides
      ? SANDBOX_OVERRIDES_FILE
      : null,
    policy: {
      principle:
        "Sandbox ground truth may be used for replay accuracy testing without mutating production case files.",
      production_mutation_allowed: false,
      sandbox_only_records_allowed: true,
      override_policy:
        "Sandbox overrides may supersede historical records inside sandbox output only.",
    },
    summary: {
      records: records.length,
      production_historical_records: records.filter(
        (item) => item.sandbox_only === false,
      ).length,
      sandbox_only_records: records.filter(
        (item) => item.sandbox_only === true,
      ).length,
    },
    records,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(
    OUTPUT,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log({
    sandbox_ground_truth_version: "sandbox-ground-truth-v0.2",
    records: output.summary.records,
    production_historical_records:
      output.summary.production_historical_records,
    sandbox_only_records:
      output.summary.sandbox_only_records,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
