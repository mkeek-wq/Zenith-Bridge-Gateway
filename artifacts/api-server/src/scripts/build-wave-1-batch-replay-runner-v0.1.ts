import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const VALIDATION =
  "data/replay/wave-1/wave-1-batch-evidence-validation-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/wave-1-batch-replay-results-v0.1.json";

function evidencePath(caseId: string): string {
  return `data/replay/wave-1/evidence-files/${caseId}-replay-evidence-v0.1.json`;
}

function inferMechanisms(metrics: Set<string>, caseId: string): string[] {
  const mechanisms = new Set<string>();

  if (
    metrics.has("GOODS_EXPORTS") ||
    metrics.has("GLOBAL_TRADE_VOLUME") ||
    metrics.has("GLOBAL_PMI")
  ) {
    mechanisms.add("MKT_010");
  }

  if (
    metrics.has("UNEMPLOYMENT_RATE") ||
    metrics.has("RETRENCHMENTS")
  ) {
    mechanisms.add("MKT_005");
  }

  if (metrics.has("POLICY_SUPPORT")) {
    mechanisms.add("MKT_006");
  }

  if (
    metrics.has("MARKET_VOLATILITY") ||
    metrics.has("CREDIT_CONDITIONS") ||
    metrics.has("INTEREST_RATES")
  ) {
    mechanisms.add("MKT_007");
  }

  if (caseId.includes("FINANCE")) {
    mechanisms.add("MKT_010");
  }

  return Array.from(mechanisms);
}

function interpretation(caseId: string): string {
  if (caseId === "SG-GOODS-EXPORTS-2020") {
    return "Goods export weakness is consistent with external demand pressure during the 2020 global trade shock.";
  }

  if (caseId === "SG-LABOUR-MARKET-2020") {
    return "Labour market deterioration is consistent with employment shock and policy support mechanisms during the 2020 downturn.";
  }

  if (caseId === "SG-FINANCE-2020") {
    return "Finance-sector conditions reflected market volatility, credit conditions, and macro-financial stress during the 2020 shock.";
  }

  return "Replay interpretation generated from validated evidence.";
}

function main() {
  const validation = JSON.parse(
    fs.readFileSync(path.join(ROOT, VALIDATION), "utf8")
  );

  const ready = (validation.validations ?? []).filter(
    (v: any) => v.governance_status === "READY_FOR_SINGLE_CASE_REPLAY"
  );

  const results = ready.map((v: any) => {
    const evidence = JSON.parse(
      fs.readFileSync(path.join(ROOT, evidencePath(v.case_id)), "utf8")
    );

    const metrics = new Set(
      (evidence.evidence_records ?? []).map((r: any) => r.metric)
    );

    const mechanisms = inferMechanisms(metrics, v.case_id);
    const confidence =
      mechanisms.length >= 2 ? 0.72 : mechanisms.length === 1 ? 0.66 : 0.45;

    return {
      replay_result_version: "wave-1-batch-replay-runner-v0.1",
      generated_at: new Date().toISOString(),
      case_id: evidence.case_id,
      domain: evidence.domain,
      period: evidence.period,
      replay_decision_date: evidence.replay_decision_date,
      governance_status: "REPLAY_EXECUTED_WITH_VALIDATED_EVIDENCE",
      evidence_records_used: evidence.evidence_records.length,
      signals_observed: Array.from(metrics),
      triggered_mechanisms: mechanisms,
      replay_interpretation: interpretation(evidence.case_id),
      replay_confidence_score: confidence,
      replay_confidence_band:
        confidence >= 0.7 ? "high" : confidence >= 0.55 ? "moderate" : "low",
      experience_candidate: {
        candidate_created: true,
        mechanism_ids: mechanisms,
        candidate_note:
          "Experience candidate requires outcome comparison before promotion.",
      },
    };
  });

  const output = {
    batch_replay_version: "wave-1-batch-replay-runner-v0.1",
    generated_at: new Date().toISOString(),
    cases_executed: results.length,
    results,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    batch_replay_version: output.batch_replay_version,
    cases_executed: output.cases_executed,
    output: OUTPUT,
  });

  for (const r of results) {
    console.log(
      `${r.case_id} | mechanisms=${r.triggered_mechanisms.join(",")} | ${r.replay_confidence_band}`
    );
  }
}

main();
