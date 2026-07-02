import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/SG-NODX-2023-outcome-comparison-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/SG-NODX-2023-experience-promotion-gate-v0.1.json";

function main() {
  const comparison = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const eligible =
    comparison.outcome_comparison_status ===
    "eligible_for_experience_promotion_review";

  const strongEnough =
    comparison.alignment_band === "strong_alignment" ||
    comparison.alignment_band === "moderate_alignment";

  const gateDecision =
    eligible && strongEnough
      ? "GO_FOR_EXPERIENCE_CANDIDATE_REGISTRATION"
      : "NO_GO_EXPERIENCE_PROMOTION";

  const output = {
    gate_version: "experience-promotion-gate-v0.1",
    generated_at: new Date().toISOString(),
    case_id: comparison.case_id,
    source_comparison: INPUT,
    alignment_score: comparison.alignment_score,
    alignment_band: comparison.alignment_band,
    mechanism_ids: comparison.mechanism_ids,
    gate_decision: gateDecision,
    promotion_status:
      gateDecision === "GO_FOR_EXPERIENCE_CANDIDATE_REGISTRATION"
        ? "approved_as_experience_candidate"
        : "blocked",
    governance_note:
      "This gate approves experience candidate registration only. It does not create a validated experience or validated mechanism.",
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    gate_version: output.gate_version,
    case_id: output.case_id,
    alignment_band: output.alignment_band,
    gate_decision: output.gate_decision,
    output: OUTPUT,
  });
}

main();
