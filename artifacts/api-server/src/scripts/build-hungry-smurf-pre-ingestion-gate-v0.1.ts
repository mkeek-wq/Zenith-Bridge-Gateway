import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const consistency = readJson(
  path.join(ROOT, "data/intelligence/dataset-consistency-audit-v0.1.json")
);

const updateScan = readJson(
  path.join(ROOT, "data/intelligence/hungry-smurf-update-scan-v0.1.json")
);

const sniff = readJson(
  path.join(ROOT, "data/intelligence/hungry-smurf-schema-sniff-v0.1.json")
);

const blockers: string[] = [];
const warnings: string[] = [];

if ((consistency.issue_count || 0) > 0) {
  blockers.push("dataset_consistency_issues");
}

if ((sniff.blocked_count || 0) > 0) {
  blockers.push("schema_sniff_blockers");
}

if ((updateScan.blocked_count || 0) > 0) {
  blockers.push("update_scan_blockers");
}

if ((consistency.warning_count || 0) > 0) {
  warnings.push("dataset_consistency_warnings");
}

if ((sniff.review_count || 0) > 0) {
  warnings.push("schema_sniff_review_items");
}

if ((updateScan.review_count || 0) > 0) {
  warnings.push("update_scan_review_items");
}

const output = {
  gate_version: "hungry-smurf-pre-ingestion-gate-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Combines consistency audit, update scan, and schema sniff before controlled ingestion.",
  mutation_allowed: false,
  decision: blockers.length === 0 ? "GO_FOR_CONTROLLED_STAGING" : "NO_GO",
  blockers,
  warnings,
  inputs: {
    consistency_audit: "data/intelligence/dataset-consistency-audit-v0.1.json",
    update_scan: "data/intelligence/hungry-smurf-update-scan-v0.1.json",
    schema_sniff: "data/intelligence/hungry-smurf-schema-sniff-v0.1.json",
  },
  summary: {
    consistency_issue_count: consistency.issue_count,
    consistency_warning_count: consistency.warning_count,
    update_ready_count: updateScan.ready_count,
    update_review_count: updateScan.review_count,
    update_blocked_count: updateScan.blocked_count,
    sniff_clean_count: sniff.clean_count,
    sniff_review_count: sniff.review_count,
    sniff_blocked_count: sniff.blocked_count,
  },
  governance: {
    production_mutation_allowed: false,
    controlled_staging_allowed: blockers.length === 0,
    human_review_required: warnings.length > 0,
  },
};

const outPath = path.join(
  ROOT,
  "data/intelligence/hungry-smurf-pre-ingestion-gate-v0.1.json"
);

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  gate_version: output.gate_version,
  decision: output.decision,
  blockers,
  warnings,
  output: path.relative(ROOT, outPath),
});
