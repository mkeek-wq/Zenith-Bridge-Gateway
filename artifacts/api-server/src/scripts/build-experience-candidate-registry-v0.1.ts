import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const GATE =
  "data/replay/wave-1/SG-NODX-2023-experience-promotion-gate-v0.1.json";

const COMPARISON =
  "data/replay/wave-1/SG-NODX-2023-outcome-comparison-v0.1.json";

const OUTPUT =
  "data/intelligence/experience-candidate-registry-v0.1.json";

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function main() {
  const gate = readJson(GATE);
  const comparison = readJson(COMPARISON);

  const candidate = {
    experience_candidate_id: `${gate.case_id}-EXP-CANDIDATE-v0.1`,
    case_id: gate.case_id,
    mechanism_ids: gate.mechanism_ids,
    source_comparison: COMPARISON,
    source_gate: GATE,
    alignment_score: gate.alignment_score,
    alignment_band: gate.alignment_band,
    promotion_status: gate.promotion_status,
    candidate_status: "registered_candidate",
    candidate_summary:
      "Replay outcome aligned with observed NODX contraction, supporting MKT_010 as an external demand/trade downturn explanation candidate.",
    observed_outcome: comparison.observed_outcome,
    governance_note:
      "Candidate registration does not validate the mechanism or permanently promote the experience.",
  };

  const output = {
    registry_version: "experience-candidate-registry-v0.1",
    generated_at: new Date().toISOString(),
    candidates_registered: 1,
    candidates: [candidate],
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    registry_version: output.registry_version,
    candidates_registered: output.candidates_registered,
    output: OUTPUT,
  });

  console.log(`${candidate.experience_candidate_id} | ${candidate.candidate_status}`);
}

main();
