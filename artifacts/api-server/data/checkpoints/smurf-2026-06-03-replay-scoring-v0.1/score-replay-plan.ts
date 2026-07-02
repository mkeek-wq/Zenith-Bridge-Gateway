import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const REPLAY_DIR = "data/replay-sandbox";
const OUTPUT_DIR = "data/replay-sandbox/scores";

const [replayPlanPath] = process.argv.slice(2);

if (!replayPlanPath) {
  console.error(
    [
      "Usage:",
      "pnpm tsx src/scripts/score-replay-plan.ts <replay_plan_path>",
      "",
      "Example:",
      "pnpm tsx src/scripts/score-replay-plan.ts data/replay-sandbox/replay-plan-2026-06-03T09-00-00.000Z.json",
    ].join("\n"),
  );

  process.exit(1);
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function safeFileName(value: string): string {
  return value.replace(/[:/]/g, "-");
}

function classifyReplayCase(replayCase: any): string {
  if (!replayCase.case_visible) {
    return "not_visible";
  }

  if (!replayCase.outcome_visible) {
    return "visible_no_outcome_yet";
  }

  if (replayCase.outcome_visible) {
    return "visible_with_outcome";
  }

  return "not_scorable";
}

async function main() {
  const now = new Date().toISOString();

  const replayPlan = await readJson(replayPlanPath);

  const scoredCases = (replayPlan.replay_cases ?? []).map(
    (replayCase: any) => {
      const replayScoreStatus = classifyReplayCase(replayCase);

      return {
        case_id: replayCase.case_id,
        replay_date: replayPlan.replay_date,
        case_visible: replayCase.case_visible,
        outcome_visible: replayCase.outcome_visible,

        replay_score_status: replayScoreStatus,

        scorable:
          replayScoreStatus === "visible_with_outcome",

        scoring_note:
          replayScoreStatus === "not_visible"
            ? "Case was not visible at replay date."
            : replayScoreStatus === "visible_no_outcome_yet"
              ? "Case was visible, but no outcome was visible yet."
              : replayScoreStatus === "visible_with_outcome"
                ? "Case and outcome were visible. Future scoring can compare predicted vs actual outcome."
                : "Replay case is not scorable.",

        replay_visibility_basis:
          replayCase.replay_visibility_basis ?? null,

        replay_visible_from:
          replayCase.replay_visible_from ?? null,

        publication_date:
          replayCase.publication_date ?? null,

        publication_date_confidence:
          replayCase.publication_date_confidence ?? null,

        outcome_closed_at:
          replayCase.outcome_closed_at ?? null,

        current_case_status:
          replayCase.current_case_status ?? null,

        current_conclusion_status:
          replayCase.current_conclusion_status ?? null,

        current_revision_number:
          replayCase.current_revision_number ?? null,
      };
    },
  );

  const summary = {
    total_cases: scoredCases.length,
    not_visible: scoredCases.filter(
      (item: any) => item.replay_score_status === "not_visible",
    ).length,
    visible_no_outcome_yet: scoredCases.filter(
      (item: any) =>
        item.replay_score_status === "visible_no_outcome_yet",
    ).length,
    visible_with_outcome: scoredCases.filter(
      (item: any) =>
        item.replay_score_status === "visible_with_outcome",
    ).length,
    not_scorable: scoredCases.filter(
      (item: any) => item.replay_score_status === "not_scorable",
    ).length,
    scorable_cases: scoredCases.filter((item: any) => item.scorable)
      .length,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = path.join(
    OUTPUT_DIR,
    `replay-score-${safeFileName(replayPlan.replay_date)}.json`,
  );

  const result = {
    replay_score_version: "replay-score-v0.1",
    generated_at: now,
    source_replay_plan: replayPlanPath,
    replay_plan_version: replayPlan.replay_plan_version,
    replay_date: replayPlan.replay_date,
    scoring_policy: {
      principle:
        "Replay score v0.1 only classifies visibility and scoring readiness. It does not yet judge correctness.",
      statuses: [
        "not_visible",
        "visible_no_outcome_yet",
        "visible_with_outcome",
        "not_scorable",
      ],
    },
    summary,
    scored_cases: scoredCases,
  };

  await writeFile(output, JSON.stringify(result, null, 2), "utf8");

  console.log({
    replay_score_version: "replay-score-v0.1",
    replay_date: replayPlan.replay_date,
    ...summary,
    output,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
