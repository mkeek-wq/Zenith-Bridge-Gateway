import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const gate = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-promotion-gate-v0.1.json"));
const audit = readJson(path.join(ROOT, "data/intelligence/audit-smurf-promotion-review-v0.1.json"));
const quant = readJson(path.join(ROOT, "data/intelligence/quant-smurf-ingestion-audit-v0.1.json"));

const blockers: string[] = [];

if (gate.decision !== "READY_FOR_MANUAL_APPROVAL") blockers.push("promotion_gate_not_ready");
if (!audit.governance?.human_approval_allowed) blockers.push("audit_smurf_blocks_approval");

const output = {
  package_version: "hungry-smurf-promotion-package-v0.2",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  decision: blockers.length === 0 ? "READY_FOR_HUMAN_APPROVAL" : "NOT_READY",
  blockers,
  confidence_score: audit.confidence_score,
  staged_count: gate.staged_count,
  approval: {
    human_approved: false,
    approved_by: null,
    approved_at: null
  },
  included_reports: {
    promotion_gate: "data/ingestion/hungry-smurf-promotion-gate-v0.1.json",
    audit_smurf_review: "data/intelligence/audit-smurf-promotion-review-v0.1.json",
    quant_smurf_audit: "data/intelligence/quant-smurf-ingestion-audit-v0.1.json"
  },
  staged_items: gate.staged_items,
  quant_summary: quant.audits.map((a: any) => ({
    dataset_id: a.dataset_id,
    quant_status: a.quant_status,
    latest_change_z_score: a.latest_change_z_score,
    warnings: a.warnings,
    issues: a.issues
  })),
  governance: {
    production_mutation_allowed: false,
    approval_required_before_promotion_executor: true,
    approve_package_not_raw_data: true
  }
};

const outPath = path.join(ROOT, "data/ingestion/hungry-smurf-promotion-package-v0.2.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  decision: output.decision,
  confidence_score: output.confidence_score,
  staged_count: output.staged_count,
  blockers,
  output: path.relative(ROOT, outPath)
});
