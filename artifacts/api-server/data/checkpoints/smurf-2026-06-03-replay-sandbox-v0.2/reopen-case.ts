import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const HISTORY_DIR = "data/case-history";
const GOVERNANCE_FILE = "config/reopen-governance-v0.1.json";

const [caseId, reopenReason, ...noteParts] = process.argv.slice(2);
const note = noteParts.join(" ");

if (!caseId || !reopenReason) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/reopen-case.ts <case_id> <reopen_reason> [note]",
      "",
      "Allowed reasons are governed by config/reopen-governance-v0.1.json",
      "",
      "Example:",
      "pnpm tsx src/scripts/reopen-case.ts SG-M355381-1_1_3-2026-apr new_evidence \"New source contradicts original attribution\"",
    ].join("\n"),
  );
  process.exit(1);
}

function casePath(caseId: string): string {
  return path.join(CASE_DIR, `case-${caseId}.json`);
}

function historyPath(caseId: string): string {
  return path.join(HISTORY_DIR, `${caseId}.json`);
}

async function main() {
  const now = new Date().toISOString();

  const governance = JSON.parse(
    await readFile(GOVERNANCE_FILE, "utf8"),
  );

  if (!governance.allowed_reopen_reasons.includes(reopenReason)) {
    throw new Error(
      `Invalid reopen reason "${reopenReason}". Allowed: ${governance.allowed_reopen_reasons.join(", ")}`,
    );
  }

  const filePath = casePath(caseId);
  const historyFilePath = historyPath(caseId);

  const caseFile = JSON.parse(await readFile(filePath, "utf8"));

  const previousState = {
    case_status: caseFile.case_status ?? null,
    conclusion_status: caseFile.conclusion_status ?? null,
    confidence: caseFile.confidence ?? null,
    outcome: caseFile.outcome ?? null,
    workflow: caseFile.workflow ?? null,
    last_updated_at: caseFile.last_updated_at ?? null,
  };

  caseFile.case_status = governance.reopened_case_status;
  caseFile.conclusion_status = governance.reopened_conclusion_status;
  caseFile.last_updated_at = now;

  caseFile.reopen_control = {
    version: governance.version,
    reopened_at: now,
    reopen_reason: reopenReason,
    reopen_note: note || null,
    previous_state: previousState,
  };

  caseFile.outcome_history = [
    ...(caseFile.outcome_history ?? []),
    {
      archived_at: now,
      archive_reason: "case_reopened",
      outcome: caseFile.outcome ?? null,
      previous_case_status: previousState.case_status,
      previous_conclusion_status: previousState.conclusion_status,
    },
  ];

  caseFile.workflow = {
    ...(caseFile.workflow ?? {}),
    next_action: governance.reopened_next_action,
    publication_status:
      caseFile.workflow?.publication_status ?? "not_published",
    state_last_evaluated_at: now,
  };

  await writeFile(filePath, JSON.stringify(caseFile, null, 2), "utf8");

  let history: any;

  try {
    history = JSON.parse(await readFile(historyFilePath, "utf8"));
  } catch {
    await mkdir(HISTORY_DIR, { recursive: true });

    history = {
      case_history_version: "case-history-v0.1",
      case_id: caseId,
      created_at: now,
      last_updated_at: now,
      timeline: [],
    };
  }

  history.last_updated_at = now;

  history.timeline = [
    ...(history.timeline ?? []),
    {
      timestamp: now,
      event_type: "case_reopened",
      governance_version: governance.version,
      reopen_reason: reopenReason,
      reopen_note: note || null,
      previous_state: previousState,
      new_state: {
        case_status: caseFile.case_status,
        conclusion_status: caseFile.conclusion_status,
        next_action: caseFile.workflow?.next_action ?? null,
      },
      note:
        "Case reopened under governance controls. Previous outcome preserved in outcome_history.",
    },
  ];

  await writeFile(
    historyFilePath,
    JSON.stringify(history, null, 2),
    "utf8",
  );

  console.log({
    reopen_engine_version: "case-reopen-v0.1",
    case_id: caseId,
    reopen_reason: reopenReason,
    case_status: caseFile.case_status,
    conclusion_status: caseFile.conclusion_status,
    previous_outcome_preserved: true,
    case_file: filePath,
    history_file: historyFilePath,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
