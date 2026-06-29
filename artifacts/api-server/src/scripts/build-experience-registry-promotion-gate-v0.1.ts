import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/experience-candidate-registry-v0.1.json";

const OUTPUT =
  "data/intelligence/experience-registry-promotion-gate-v0.1.json";

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const gateItems = (registry.candidates ?? []).map((candidate: any) => {
    const alignedEnough =
      candidate.alignment_band === "strong_alignment" ||
      candidate.alignment_band === "moderate_alignment";

    const decision = alignedEnough
      ? "GO_FOR_EXPERIENCE_MEMORY_ENTRY"
      : "NO_GO_REMAIN_CANDIDATE_ONLY";

    return {
      experience_candidate_id: candidate.experience_candidate_id,
      case_id: candidate.case_id,
      mechanism_ids: candidate.mechanism_ids,
      alignment_score: candidate.alignment_score,
      alignment_band: candidate.alignment_band,
      gate_decision: decision,
      resulting_status:
        decision === "GO_FOR_EXPERIENCE_MEMORY_ENTRY"
          ? "promoted_to_experience_memory"
          : "candidate_only",
      governance_note:
        "Promotion to experience memory strengthens experience history but does not validate a mechanism.",
    };
  });

  const output = {
    gate_version: "experience-registry-promotion-gate-v0.1",
    generated_at: new Date().toISOString(),
    source_registry: INPUT,
    candidates_reviewed: gateItems.length,
    promoted_to_experience_memory: gateItems.filter(
      (g: any) => g.resulting_status === "promoted_to_experience_memory"
    ).length,
    candidate_only: gateItems.filter(
      (g: any) => g.resulting_status === "candidate_only"
    ).length,
    gate_items: gateItems,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    gate_version: output.gate_version,
    candidates_reviewed: output.candidates_reviewed,
    promoted_to_experience_memory: output.promoted_to_experience_memory,
    candidate_only: output.candidate_only,
    output: OUTPUT,
  });

  for (const item of gateItems) {
    console.log(`${item.case_id} | ${item.gate_decision}`);
  }
}

main();
