import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const GOVERNANCE_FILE = "config/replay-governance-v0.1.json";
const TEMPORAL_INDEX_FILE =
  "data/replay-sandbox/temporal-index-v0.1.json";
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
      "pnpm tsx src/scripts/build-replay-sandbox-plan.ts 2026-05-27T00:00:00.000Z",
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
  const temporalIndex = await readJson(TEMPORAL_INDEX_FILE);

  const replayCases = [];

  for (const temporalCase of temporalIndex.cases ?? []) {
    const caseVisible = isOnOrBefore(
      temporalCase.replay_visible_from,
      replayDate,
    );

    const outcomeVisible = isOnOrBefore(
      temporalCase.closed_at,
      replayDate,
    );

    let historyVisibleEvents = [];

    try {
      const historyFile = await readJson(
        path.join(HISTORY_DIR, `${temporalCase.case_id}.json`),
      );

      historyVisibleEvents = (historyFile.timeline ?? []).filter(
        (event: any) =>
          isOnOrBefore(event.timestamp, replayDate),
      );
    } catch {
      historyVisibleEvents = [];
    }

    replayCases.push({
      case_id: temporalCase.case_id,
      case_file: temporalCase.case_file,

      case_visible: caseVisible,
      replay_visible_from: temporalCase.replay_visible_from,
      replay_visibility_basis:
        temporalCase.replay_visibility_basis,

      observation_period:
        temporalCase.observation_period ?? null,
      observation_date:
        temporalCase.observation_date ?? null,

      publication_date:
        temporalCase.publication_date ?? null,
      publication_date_source:
        temporalCase.publication_date_source ?? null,
      publication_date_confidence:
        temporalCase.publication_date_confidence ?? null,

      opened_at: temporalCase.opened_at ?? null,
      ingested_at: temporalCase.ingested_at ?? null,

      current_case_status:
        temporalCase.current_case_status ?? null,
      current_conclusion_status:
        temporalCase.current_conclusion_status ?? null,
      current_revision_number:
        temporalCase.current_revision_number ?? null,

      outcome_visible: outcomeVisible,
      outcome_closed_at: temporalCase.closed_at ?? null,

      visible_history_events: historyVisibleEvents.length,
      latest_visible_history_event:
        historyVisibleEvents.at(-1) ?? null,

      replay_note: caseVisible
        ? "Case is visible to replay based on temporal index."
        : "Case is hidden because replay_visible_from is after replay date.",
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
    replay_plan_version: "replay-sandbox-plan-v0.2",
    generated_at: now,
    replay_date: replayDateArg,
    governance_version: governance.version,
    source_temporal_index: TEMPORAL_INDEX_FILE,
    temporal_index_version:
      temporalIndex.temporal_index_version,
    governance,
    summary: {
      total_cases_checked: replayCases.length,
      visible_cases: visibleCases.length,
      hidden_cases: replayCases.length - visibleCases.length,
      visible_outcomes: visibleOutcomes.length,
      using_publication_date: replayCases.filter(
        (item) =>
          item.replay_visibility_basis === "publication_date",
      ).length,
      using_fallback_opened_at: replayCases.filter(
        (item) =>
          item.replay_visibility_basis === "fallback_opened_at",
      ).length,
    },
    replay_cases: replayCases,
  };

  await writeFile(
    output,
    JSON.stringify(replayPlan, null, 2),
    "utf8",
  );

  console.log({
    replay_plan_version: "replay-sandbox-plan-v0.2",
    replay_date: replayDateArg,
    total_cases_checked: replayCases.length,
    visible_cases: visibleCases.length,
    hidden_cases: replayCases.length - visibleCases.length,
    visible_outcomes: visibleOutcomes.length,
    using_publication_date:
      replayPlan.summary.using_publication_date,
    using_fallback_opened_at:
      replayPlan.summary.using_fallback_opened_at,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
