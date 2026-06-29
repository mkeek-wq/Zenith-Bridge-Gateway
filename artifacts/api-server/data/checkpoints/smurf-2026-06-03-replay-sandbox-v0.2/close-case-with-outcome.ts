import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const HISTORY_DIR = "data/case-history";

const args = process.argv.slice(2);

const [
  caseId,
  primaryDriver,
  primaryDriverName,
  outcomeConfidence,
  ...noteParts
] = args;

const closureNote = noteParts.join(" ");

if (!caseId || !primaryDriver || !primaryDriverName || !outcomeConfidence) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/close-case-with-outcome.ts <case_id> <primary_driver> <primary_driver_name> <confidence> [note]",
      "",
      "Example:",
      "pnpm tsx src/scripts/close-case-with-outcome.ts SG-M355381-1_1_3-2026-apr MKT_001 \"Global Demand Surge\" high \"Reclosed after manual review\"",
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
    reopen_control: caseFile.reopen_control ?? null,
  };

  const previousRevisionNumber =
    typeof caseFile.revision_number === "number"
      ? caseFile.revision_number
      : caseFile.reopen_control
        ? 1
        : 0;

  const newRevisionNumber =
    caseFile.case_status === "reopened" ||
    caseFile.conclusion_status === "under_review"
      ? previousRevisionNumber + 1
      : Math.max(previousRevisionNumber, 1);

  if (caseFile.outcome) {
    caseFile.outcome_history = [
      ...(caseFile.outcome_history ?? []),
      {
        archived_at: now,
        archive_reason: "case_closed_with_new_outcome",
        revision_number: previousRevisionNumber || 1,
        outcome: caseFile.outcome,
        previous_case_status: previousState.case_status,
        previous_conclusion_status: previousState.conclusion_status,
      },
    ];
  }

  caseFile.case_status = "closed";
  caseFile.conclusion_status = "attributed";
  caseFile.revision_number = newRevisionNumber;
  caseFile.last_updated_at = now;

  caseFile.outcome = {
    primary_driver: primaryDriver,
    primary_driver_name: primaryDriverName,
    confidence: outcomeConfidence,
    closed_at: now,
    revision_number: newRevisionNumber,
    closure_note: closureNote || null,
  };

  caseFile.workflow = {
    ...(caseFile.workflow ?? {}),
    next_action: "none",
    publication_status:
      caseFile.workflow?.publication_status ?? "not_published",
    state_last_evaluated_at: now,
  };

  caseFile.revision_control = {
    version: "case-closure-revision-v0.1",
    revised_at: now,
    revision_number: newRevisionNumber,
    previous_revision_number: previousRevisionNumber || null,
    closure_note: closureNote || null,
    previous_state: previousState,
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
      event_type: "case_closed_with_outcome",
      closure_engine_version: "case-closure-revision-v0.1",
      revision_number: newRevisionNumber,
      previous_revision_number: previousRevisionNumber || null,
      previous_state: previousState,
      new_state: {
        case_status: caseFile.case_status,
        conclusion_status: caseFile.conclusion_status,
        next_action: caseFile.workflow?.next_action ?? null,
        outcome: caseFile.outcome,
      },
      note:
        closureNote ||
        "Case closed with outcome under revision-aware closure controls.",
    },
  ];

  await writeFile(
    historyFilePath,
    JSON.stringify(history, null, 2),
    "utf8",
  );

  console.log({
    closure_engine_version: "case-closure-revision-v0.1",
    case_id: caseId,
    case_status: caseFile.case_status,
    conclusion_status: caseFile.conclusion_status,
    revision_number: caseFile.revision_number,
    outcome: caseFile.outcome,
    previous_outcome_archived: previousState.outcome !== null,
    case_file: filePath,
    history_file: historyFilePath,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
