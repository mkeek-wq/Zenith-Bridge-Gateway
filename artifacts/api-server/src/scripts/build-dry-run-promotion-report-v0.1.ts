import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/controlled-bulk-ingestion-batch-v0.1.json";

const OUTPUT_PATH =
  "exports/macro-reports/dry-run-promotion-report-v0.1.md";

function main() {
  const batch = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const lines: string[] = [];

  lines.push("# SMURF Dry Run Promotion Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Batch Summary");
  lines.push("");
  lines.push(`- Batch size: ${batch.batch_size}`);
  lines.push(`- Governance status: ${batch.governance_status}`);
  lines.push("");

  lines.push("## Dry Run Candidates");
  lines.push("");

  for (const item of batch.items) {
    lines.push(`### ${item.indicator_id}`);
    lines.push("");
    lines.push(`- Name: ${item.indicator_name}`);
    lines.push(`- Domain: ${item.domain}`);
    lines.push(`- Action: ${item.ingestion_action}`);
    lines.push(`- Lineage: ${item.lineage_status}`);
    lines.push("");
  }

  lines.push("## Governance Note");
  lines.push("");
  lines.push(
    "Items in this batch are approved for dry-run staging only. Promotion remains subject to duplicate review, lineage review, and manual promotion gate approval."
  );

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), {
    recursive: true,
  });

  fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), lines.join("\n"));

  console.log({
    report_version: "dry-run-promotion-report-v0.1",
    output: OUTPUT_PATH,
  });
}

main();
