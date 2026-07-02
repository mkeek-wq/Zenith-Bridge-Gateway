import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";

async function main() {
  const files = await readdir(CASE_DIR);

  const caseFiles = files.filter(
    (f) => f.startsWith("case-SG-") && f.endsWith(".json"),
  );

  let processed = 0;

  for (const file of caseFiles) {
    const fullPath = path.join(CASE_DIR, file);

    const caseFile = JSON.parse(
      await readFile(fullPath, "utf8"),
    );

    if (!caseFile.outcome) {
      caseFile.outcome = {
        primary_driver: null,
        primary_driver_name: null,
        confidence: null,
        closed_at: null,
      };
    }

    await writeFile(
      fullPath,
      JSON.stringify(caseFile, null, 2),
      "utf8",
    );

    processed++;
  }

  console.log({
    outcome_engine_version: "case-outcome-v0.1",
    cases_processed: processed,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
