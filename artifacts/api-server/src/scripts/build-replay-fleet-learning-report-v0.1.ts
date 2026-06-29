import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const COMPARISON =
  "data/replay/wave-1/SG-NODX-2023-outcome-comparison-v0.1.json";

const GATE =
  "data/replay/wave-1/SG-NODX-2023-experience-promotion-gate-v0.1.json";

const OUTPUT_JSON =
  "data/replay/wave-1/replay-fleet-learning-report-v0.1.json";

const OUTPUT_MD =
  "exports/replay-reports/replay-fleet-learning-report-v0.1.md";

function main() {
  const comparison = JSON.parse(
    fs.readFileSync(path.join(ROOT, COMPARISON), "utf8")
  );

  const gate = JSON.parse(fs.readFileSync(path.join(ROOT, GATE), "utf8"));

  const learningItems = [
    {
      case_id: comparison.case_id,
      mechanism_ids: comparison.mechanism_ids,
      alignment_score: comparison.alignment_score,
      alignment_band: comparison.alignment_band,
      promotion_status: gate.promotion_status,
      gate_decision: gate.gate_decision,
    },
  ];

  const output = {
    report_version: "replay-fleet-learning-report-v0.1",
    generated_at: new Date().toISOString(),
    replay_cases_with_outcome_comparison: learningItems.length,
    approved_experience_candidates: learningItems.filter(
      (i) => i.promotion_status === "approved_as_experience_candidate"
    ).length,
    blocked_experience_candidates: learningItems.filter(
      (i) => i.promotion_status !== "approved_as_experience_candidate"
    ).length,
    mechanism_learning_summary: {
      MKT_010: {
        cases_observed: learningItems.filter((i) =>
          i.mechanism_ids.includes("MKT_010")
        ).length,
        strong_alignment: learningItems.filter(
          (i) =>
            i.mechanism_ids.includes("MKT_010") &&
            i.alignment_band === "strong_alignment"
        ).length,
        moderate_alignment: learningItems.filter(
          (i) =>
            i.mechanism_ids.includes("MKT_010") &&
            i.alignment_band === "moderate_alignment"
        ).length,
      },
    },
    learning_items: learningItems,
    governance_note:
      "Learning report summarizes replay outcome comparison and promotion status. It does not validate mechanisms automatically.",
  };

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_JSON)), { recursive: true });
  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_MD)), { recursive: true });

  fs.writeFileSync(path.join(ROOT, OUTPUT_JSON), JSON.stringify(output, null, 2));

  const lines: string[] = [];

  lines.push("# SMURF Replay Fleet Learning Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(
    `- Replay cases with outcome comparison: ${output.replay_cases_with_outcome_comparison}`
  );
  lines.push(
    `- Approved experience candidates: ${output.approved_experience_candidates}`
  );
  lines.push(
    `- Blocked experience candidates: ${output.blocked_experience_candidates}`
  );
  lines.push("");
  lines.push("## Learning Items");
  lines.push("");

  for (const item of learningItems) {
    lines.push(`### ${item.case_id}`);
    lines.push("");
    lines.push(`- Mechanisms: ${item.mechanism_ids.join(", ")}`);
    lines.push(`- Alignment score: ${item.alignment_score}`);
    lines.push(`- Alignment band: ${item.alignment_band}`);
    lines.push(`- Promotion status: ${item.promotion_status}`);
    lines.push(`- Gate decision: ${item.gate_decision}`);
    lines.push("");
  }

  lines.push("## Mechanism Learning Summary");
  lines.push("");
  lines.push("### MKT_010");
  lines.push("");
  lines.push(`- Cases observed: ${output.mechanism_learning_summary.MKT_010.cases_observed}`);
  lines.push(`- Strong alignment: ${output.mechanism_learning_summary.MKT_010.strong_alignment}`);
  lines.push(`- Moderate alignment: ${output.mechanism_learning_summary.MKT_010.moderate_alignment}`);
  lines.push("");
  lines.push("## Governance Note");
  lines.push("");
  lines.push(output.governance_note);
  lines.push("");

  fs.writeFileSync(path.join(ROOT, OUTPUT_MD), lines.join("\n"));

  console.log({
    report_version: output.report_version,
    replay_cases_with_outcome_comparison:
      output.replay_cases_with_outcome_comparison,
    approved_experience_candidates: output.approved_experience_candidates,
    blocked_experience_candidates: output.blocked_experience_candidates,
    output_json: OUTPUT_JSON,
    output_markdown: OUTPUT_MD,
  });
}

main();
