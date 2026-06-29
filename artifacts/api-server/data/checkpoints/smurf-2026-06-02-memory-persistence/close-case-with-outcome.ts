import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";

const args = process.argv.slice(2);

const [
  caseId,
  primaryDriver,
  primaryDriverName,
  outcomeConfidence,
] = args;

if (!caseId || !primaryDriver || !primaryDriverName || !outcomeConfidence) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/close-case-with-outcome.ts <case_id> <primary_driver> <primary_driver_name> <confidence>",
      "",
      "Example:",
      "pnpm tsx src/scripts/close-case-with-outcome.ts SG-M355381-1_1_3-2026-apr MKT_001 \"Global Demand Surge\" high",
    ].join("\n"),
  );

  process.exit(1);
}

function casePath(caseId: string): string {
  return path.join(CASE_DIR, `case-${caseId}.json`);
}

async function main() {
  const filePath = casePath(caseId);
  const caseFile = JSON.parse(await readFile(filePath, "utf8"));

  const now = new Date().toISOString();

  caseFile.case_status = "closed";
  caseFile.conclusion_status = "attributed";
  caseFile.last_updated_at = now;

  caseFile.outcome = {
    primary_driver: primaryDriver,
    primary_driver_name: primaryDriverName,
    confidence: outcomeConfidence,
    closed_at: now,
  };

  caseFile.workflow = {
    ...(caseFile.workflow ?? {}),
    next_action: "none",
    publication_status:
      caseFile.workflow?.publication_status ?? "not_published",
    state_last_evaluated_at: now,
  };

  await writeFile(filePath, JSON.stringify(caseFile, null, 2), "utf8");

  console.log({
    closure_engine_version: "case-closure-v0.1",
    case_id: caseId,
    case_status: caseFile.case_status,
    conclusion_status: caseFile.conclusion_status,
    outcome: caseFile.outcome,
    file: filePath,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
