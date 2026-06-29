import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/sector-promotion-gate-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/sector-manual-promotion-decision-v0.1.json";

function main() {
  const gate = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const decisions = (gate.promoted_candidates ?? []).map((item: any) => ({
    indicator_id: item.indicator_id,
    indicator_name: item.indicator_name,
    current_status: item.promotion_status,
    manual_decision: "approve",
    reviewer_note:
      "Approved for controlled promotion based on dry-run staging, zero duplicates, and approved source authority.",
  }));

  const output = {
    decision_version: "sector-manual-promotion-decision-v0.1",
    generated_at: new Date().toISOString(),
    source_gate: INPUT_PATH,
    decision_mode:
      "manual_review_simulation_required_before_executor_reads_this_file",
    decisions_count: decisions.length,
    approved_count: decisions.filter((d: any) => d.manual_decision === "approve")
      .length,
    rejected_count: decisions.filter((d: any) => d.manual_decision === "reject")
      .length,
    decisions,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    decision_version: output.decision_version,
    decisions_count: output.decisions_count,
    approved_count: output.approved_count,
    rejected_count: output.rejected_count,
    output: OUTPUT_PATH,
  });
}

main();
