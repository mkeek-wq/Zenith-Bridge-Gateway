import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/macro-specificity-hardening-queue-v0.1.json";

const OUTPUT_PATH =
  "exports/macro-reports/macro-specificity-hardening-report-v0.1.md";

function main() {
  const inputAbs = path.join(ROOT, INPUT_PATH);

  if (!fs.existsSync(inputAbs)) {
    throw new Error(`Missing input: ${INPUT_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(inputAbs, "utf8"));

  const lines: string[] = [];

  lines.push("# SMURF Macro Specificity Hardening Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- Cases reviewed: ${data.cases_reviewed}`);
  lines.push(`- Hardening queue count: ${data.queue_count}`);
  lines.push(`- Critical items: ${data.critical_count}`);
  lines.push(`- High-priority items: ${data.high_count}`);
  lines.push(`- Medium-priority items: ${data.medium_count}`);
  lines.push("");
  lines.push("## Governance Interpretation");
  lines.push("");
  lines.push(
    "This queue does not invalidate macro attribution. It identifies replay cases where explanation quality depends too heavily on broad macro drivers."
  );
  lines.push("");
  lines.push(
    "The purpose is to strengthen sector-specific, policy-specific, and mechanism-specific macro context before allowing the replay fleet to feed stronger experience learning."
  );
  lines.push("");
  lines.push("## Hardening Queue");
  lines.push("");

  for (const q of data.hardening_queue) {
    lines.push(`### ${q.case_id}`);
    lines.push("");
    lines.push(`- Label: ${q.case_label ?? "N/A"}`);
    lines.push(`- Domain: ${q.domain}`);
    lines.push(`- Priority: ${q.priority}`);
    lines.push(`- Trigger band: ${q.trigger_band}`);
    lines.push(`- Diversity score: ${q.diversity_score}`);
    lines.push(
      `- Dominant/high driver share: ${q.dominant_or_high_driver_share}`
    );
    lines.push(`- Missing dimension: ${q.missing_dimension}`);
    lines.push("");
    lines.push("Recommended hardening actions:");
    lines.push("");
    for (const action of q.recommended_hardening_actions) {
      lines.push(`- ${action}`);
    }
    lines.push("");
  }

  lines.push("## Recommended Next Build");
  lines.push("");
  lines.push(
    "Build a Macro Hardening Intake Template v0.1 so new indicators can be added in a controlled, repeatable way with source, domain, mechanism, and lineage fields."
  );
  lines.push("");

  const outputAbs = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, lines.join("\n"));

  console.log({
    report_version: "macro-specificity-hardening-report-v0.1",
    input: INPUT_PATH,
    output: OUTPUT_PATH,
  });
}

main();
