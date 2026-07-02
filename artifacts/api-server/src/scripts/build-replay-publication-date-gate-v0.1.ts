import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/replay-evidence-population-plan-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/replay-publication-date-gate-v0.1.json";

function main() {
  const plan = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const checks = plan.plans.map((p: any) => ({
    case_id: p.case_id,
    publication_date_validation_required: true,
    future_leakage_scan_required: true,
    lineage_validation_required: true,
    gate_status: "awaiting_evidence_population"
  }));

  const output = {
    gate_version: "replay-publication-date-gate-v0.1",
    generated_at: new Date().toISOString(),
    source_plan: INPUT,
    cases_checked: checks.length,
    passed: 0,
    blocked: checks.length,
    governance_status:
      "AWAITING_EVIDENCE_POPULATION_BEFORE_REPLAY",
    checks
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    gate_version: output.gate_version,
    cases_checked: output.cases_checked,
    passed: output.passed,
    blocked: output.blocked,
    governance_status: output.governance_status,
    output: OUTPUT
  });

  for (const c of checks) {
    console.log(`${c.case_id} | ${c.gate_status}`);
  }
}

main();
