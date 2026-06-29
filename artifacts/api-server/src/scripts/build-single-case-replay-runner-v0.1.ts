import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const EVIDENCE =
  "data/replay/wave-1/evidence-files/SG-NODX-2023-replay-evidence-v0.1.json";

const VALIDATION =
  "data/replay/wave-1/SG-NODX-2023-evidence-validation-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/SG-NODX-2023-single-case-replay-result-v0.1.json";

function main() {
  const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, EVIDENCE), "utf8"));
  const validation = JSON.parse(fs.readFileSync(path.join(ROOT, VALIDATION), "utf8"));

  if (validation.governance_status !== "READY_FOR_SINGLE_CASE_REPLAY") {
    throw new Error(
      `Replay blocked. Validation status: ${validation.governance_status}`
    );
  }

  const metrics = new Set(
    (evidence.evidence_records ?? []).map((r: any) => r.metric)
  );

  const triggeredMechanisms: string[] = [];

  if (metrics.has("NODX") || metrics.has("GLOBAL_TRADE_VOLUME")) {
    triggeredMechanisms.push("MKT_010");
  }

  const signalStrength =
    metrics.has("NODX") && metrics.has("GLOBAL_TRADE_VOLUME") && metrics.has("GLOBAL_PMI")
      ? "moderate"
      : "low";

  const confidence =
    signalStrength === "moderate" ? 0.68 : 0.45;

  const output = {
    replay_result_version: "single-case-replay-runner-v0.1",
    generated_at: new Date().toISOString(),
    case_id: evidence.case_id,
    domain: evidence.domain,
    period: evidence.period,
    replay_decision_date: evidence.replay_decision_date,
    governance_status: "REPLAY_EXECUTED_WITH_VALIDATED_EVIDENCE",
    evidence_records_used: evidence.evidence_records.length,
    signals_observed: Array.from(metrics),
    triggered_mechanisms: triggeredMechanisms,
    replay_interpretation:
      "SG-NODX-2023 shows a trade-linked downturn context where NODX weakness is consistent with external demand pressure and weaker global trade conditions.",
    replay_confidence_score: confidence,
    replay_confidence_band:
      confidence >= 0.7 ? "high" : confidence >= 0.55 ? "moderate" : "low",
    experience_candidate: {
      candidate_created: true,
      mechanism_ids: triggeredMechanisms,
      candidate_note:
        "Potential experience candidate for external demand shock / trade downturn mechanism. Requires outcome comparison before experience promotion."
    },
    doctrine: {
      replay_result_is_not_truth: true,
      evidence_validation_required_before_execution: true,
      outcome_comparison_required_before_learning: true
    }
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    replay_result_version: output.replay_result_version,
    case_id: output.case_id,
    evidence_records_used: output.evidence_records_used,
    triggered_mechanisms: output.triggered_mechanisms,
    confidence: output.replay_confidence_score,
    band: output.replay_confidence_band,
    output: OUTPUT
  });
}

main();
