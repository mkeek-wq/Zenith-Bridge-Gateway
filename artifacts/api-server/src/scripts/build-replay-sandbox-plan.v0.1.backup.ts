import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const GOVERNANCE_FILE = "config/replay-governance-v0.1.json";
const CASE_DIR = "data/cases";
const HISTORY_DIR = "data/case-history";
const OUTPUT_DIR = "data/replay-sandbox";

const [replayDateArg] = process.argv.slice(2);

if (!replayDateArg) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/build-replay-sandbox-plan.ts <replay_date>",
      "",
      "Example:",
      "pnpm tsx src/scripts/build-replay-sandbox-plan.ts 2026-06-02",
    ].join("\n"),
  );
  process.exit(1);
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function isOnOrBefore(value: string | null | undefined, replayDate: Date) {
  if (!value) return false;

  const parsed = parseDate(value);

  return parsed.getTime() <= replayDate.getTime();
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const now = new Date().toISOString();
  const replayDate = parseDate(replayDateArg);

  const governance = await readJson(GOVERNANCE_FILE);

  const caseIndex = await readJson(
    path.join(CASE_DIR, "case-index-v0.1.json"),
  );

  const replayCases = [];

  for (const item of caseIndex.cases ?? []) {
    const caseFile = await readJson(item.file);

    const caseVisible = isOnOrBefore(
      caseFile.opened_at,
      replayDate,
    );

    const outcomeClosedAt =
      caseFile.outcome?.closed_at ?? null;

    const outcomeVisible = isOnOrBefore(
      outcomeClosedAt,
      replayDate,
    );

    let historyVisibleEvents = [];

    try {
      const historyFile = await readJson(
        path.join(HISTORY_DIR, `${caseFile.case_id}.json`),
      );

      historyVisibleEvents = (historyFile.timeline ?? []).filter(
        (event: any) =>
          isOnOrBefore(event.timestamp, replayDate),
      );
    } catch {
      historyVisibleEvents = [];
    }

    replayCases.push({
      case_id: caseFile.case_id,
      case_file: item.file,
      case_visible: caseVisible,
      opened_at: caseFile.opened_at ?? null,
      current_case_status: caseFile.case_status ?? null,
      current_conclusion_status:
        caseFile.conclusion_status ?? null,
      outcome_visible: outcomeVisible,
      outcome_closed_at: outcomeClosedAt,
      visible_history_events: historyVisibleEvents.length,
      latest_visible_history_event:
        historyVisibleEvents.at(-1) ?? null,
      replay_note: caseVisible
        ? "Case is visible to replay."
        : "Case is hidden because it opened after replay date.",
    });
  }

  const visibleCases = replayCases.filter(
    (item) => item.case_visible,
  );

  const visibleOutcomes = replayCases.filter(
    (item) => item.outcome_visible,
  );

  await mkdir(OUTPUT_DIR, { recursive: true });

  const safeReplayDate = replayDateArg.replace(/[:]/g, "-");

  const output = path.join(
    OUTPUT_DIR,
    `replay-plan-${safeReplayDate}.json`,
  );

  const replayPlan = {
    replay_plan_version: "replay-sandbox-plan-v0.1",
    generated_at: now,
    replay_date: replayDateArg,
    governance_version: governance.version,
    governance,
    summary: {
      total_cases_checked: replayCases.length,
      visible_cases: visibleCases.length,
      hidden_cases: replayCases.length - visibleCases.length,
      visible_outcomes: visibleOutcomes.length,
    },
    replay_cases: replayCases,
  };

  await writeFile(
    output,
    JSON.stringify(replayPlan, null, 2),
    "utf8",
  );

  console.log({
    replay_plan_version: "replay-sandbox-plan-v0.1",
    replay_date: replayDateArg,
    total_cases_checked: replayCases.length,
    visible_cases: visibleCases.length,
    hidden_cases: replayCases.length - visibleCases.length,
    visible_outcomes: visibleOutcomes.length,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
