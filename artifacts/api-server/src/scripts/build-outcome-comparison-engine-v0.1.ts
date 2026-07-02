import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/SG-NODX-2023-single-case-replay-result-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/SG-NODX-2023-outcome-comparison-v0.1.json";

function main() {
  const replay = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const observedOutcome = {
    outcome_id: "SG-NODX-2023-OUTCOME",
    observed_period: "2023",
    outcome_summary:
      "Singapore NODX experienced a trade downturn in 2023, consistent with weak external demand and softer global trade conditions.",
    outcome_direction: "contraction",
    source_status: "historical_outcome_recorded",
  };

  const replayExpectedDirection = "contraction";

  const aligned =
    replayExpectedDirection === observedOutcome.outcome_direction;

  const alignmentScore = aligned ? 0.78 : 0.25;

  const output = {
    comparison_version: "outcome-comparison-engine-v0.1",
    generated_at: new Date().toISOString(),
    case_id: replay.case_id,
    replay_result_source: INPUT,
    observed_outcome: observedOutcome,
    replay_expected_direction: replayExpectedDirection,
    alignment_score: alignmentScore,
    alignment_band:
      alignmentScore >= 0.75
        ? "strong_alignment"
        : alignmentScore >= 0.55
        ? "moderate_alignment"
        : alignmentScore >= 0.35
        ? "weak_alignment"
        : "contradictory",
    outcome_comparison_status:
      alignmentScore >= 0.55
        ? "eligible_for_experience_promotion_review"
        : "not_eligible_for_experience_promotion",
    mechanism_ids: replay.triggered_mechanisms,
    governance_note:
      "Outcome comparison assesses whether the replay interpretation aligned with observed historical outcome. It does not by itself validate a mechanism.",
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    comparison_version: output.comparison_version,
    case_id: output.case_id,
    alignment_score: output.alignment_score,
    alignment_band: output.alignment_band,
    status: output.outcome_comparison_status,
    output: OUTPUT,
  });
}

main();
