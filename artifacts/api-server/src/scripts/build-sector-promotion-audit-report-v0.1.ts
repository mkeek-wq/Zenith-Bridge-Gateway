import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/sector-indicator-promotion-executor-v0.1.json";

const REGISTRY_PATH =
  "data/intelligence/sector-macro-registry-v0.1.json";

const OUTPUT_PATH =
  "exports/macro-reports/sector-promotion-audit-report-v0.1.md";

function main() {
  const execution = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, REGISTRY_PATH), "utf8")
  );

  const promotedIndicators = (registry.indicators ?? []).filter(
    (i: any) => i.ingestion_status === "promoted"
  );

  const candidateIndicators = (registry.indicators ?? []).filter(
    (i: any) => i.ingestion_status === "candidate_not_ingested"
  );

  const lines: string[] = [];

  lines.push("# SMURF Sector Promotion Audit Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- Promoted this run: ${execution.promoted_count}`);
  lines.push(`- Not promoted this run: ${execution.not_promoted_count}`);
  lines.push(`- Total promoted indicators in registry: ${promotedIndicators.length}`);
  lines.push(`- Remaining candidate indicators: ${candidateIndicators.length}`);
  lines.push("");
  lines.push("## Promoted Indicators");
  lines.push("");

  for (const item of execution.promoted) {
    lines.push(`### ${item.indicator_id}`);
    lines.push("");
    lines.push(`- Name: ${item.indicator_name}`);
    lines.push(`- Domain: ${item.domain}`);
    lines.push(`- Status: ${item.ingestion_status}`);
    lines.push("");
  }

  lines.push("## Remaining Candidates");
  lines.push("");

  for (const item of candidateIndicators) {
    lines.push(`- ${item.indicator_id} (${item.domain}) — ${item.source_authority}`);
  }

  lines.push("");
  lines.push("## Governance Note");
  lines.push("");
  lines.push(
    "Promotion was controlled and limited to indicators explicitly approved in the manual decision file. Remaining candidates require source review or future controlled ingestion."
  );

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), {
    recursive: true,
  });

  fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), lines.join("\n"));

  console.log({
    report_version: "sector-promotion-audit-report-v0.1",
    promoted_this_run: execution.promoted_count,
    remaining_candidates: candidateIndicators.length,
    output: OUTPUT_PATH,
  });
}

main();
