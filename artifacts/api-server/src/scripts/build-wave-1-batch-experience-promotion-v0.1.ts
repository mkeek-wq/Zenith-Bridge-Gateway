import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/wave-1-batch-outcome-comparison-v0.1.json";

const OUTPUT =
  "data/intelligence/wave-1-batch-experience-promotion-v0.1.json";

function main() {
  const batch = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const promoted = (batch.comparisons ?? []).map((c: any) => {
    const eligible =
      c.outcome_comparison_status ===
      "eligible_for_experience_promotion_review";

    return {
      experience_candidate_id: `${c.case_id}-EXP-CANDIDATE-v0.1`,
      case_id: c.case_id,
      mechanism_ids: c.mechanism_ids,
      alignment_score: c.alignment_score,
      alignment_band: c.alignment_band,
      promotion_status: eligible
        ? "promoted_to_experience_memory"
        : "candidate_only",
      gate_decision: eligible
        ? "GO_FOR_EXPERIENCE_MEMORY_ENTRY"
        : "NO_GO_REMAIN_CANDIDATE_ONLY",
      observed_outcome: c.observed_outcome,
      governance_note:
        "Batch promotion adds experience memory entries only; mechanisms remain unvalidated.",
    };
  });

  const output = {
    promotion_batch_version: "wave-1-batch-experience-promotion-v0.1",
    generated_at: new Date().toISOString(),
    source_comparison_batch: INPUT,
    candidates_reviewed: promoted.length,
    promoted_to_experience_memory: promoted.filter(
      (p: any) => p.promotion_status === "promoted_to_experience_memory"
    ).length,
    candidate_only: promoted.filter(
      (p: any) => p.promotion_status !== "promoted_to_experience_memory"
    ).length,
    promoted,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    promotion_batch_version: output.promotion_batch_version,
    candidates_reviewed: output.candidates_reviewed,
    promoted_to_experience_memory: output.promoted_to_experience_memory,
    candidate_only: output.candidate_only,
    output: OUTPUT,
  });

  for (const p of promoted) {
    console.log(`${p.case_id} | ${p.promotion_status}`);
  }
}

main();
