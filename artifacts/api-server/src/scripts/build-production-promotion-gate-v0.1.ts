import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const staged =
  readJsonSafe(path.join(ROOT, "data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json")) || {};

const lineage =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-lineage-engine-v0.1.json")) || {};

const report =
  readJsonSafe(path.join(ROOT, "data/ingestion/reports/ingestion-report-generator-v0.1.json")) || {};

const stagedRecords: any[] = staged.staged_records || [];
const lineageItems: any[] = lineage.lineage_items || [];

const blockers: string[] = [];
const warnings: string[] = [];

if (staged.execution_status !== "staged_successfully") blockers.push("staging_not_successful");
if (!stagedRecords.length) blockers.push("no_staged_records");
if (!lineageItems.length) blockers.push("no_lineage_items");

if (report.recommendation !== "GO_FOR_CONTROLLED_DRY_RUN_REVIEW") {
  blockers.push("report_not_clean_go");
}

const incompleteLineage = lineageItems.filter((x) => !x.governance?.lineage_complete);
if (incompleteLineage.length > 0) blockers.push("incomplete_lineage_items");

const unreviewed = lineageItems.filter((x) => x.review_state?.human_reviewed !== true);
if (unreviewed.length > 0) blockers.push("human_review_not_completed");

const notApproved = lineageItems.filter((x) => x.review_state?.approved_for_production !== true);
if (notApproved.length > 0) blockers.push("records_not_approved_for_production");

const promotionStatus =
  blockers.length === 0
    ? "eligible_for_production_promotion"
    : "production_promotion_blocked";

const output = {
  registry_version: "production-promotion-gate-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    gate_does_not_write_production: true,
    production_promotion_requires_human_review: true,
    lineage_required: true,
    clean_ingestion_report_required: true,
  },
  promotion_status: promotionStatus,
  blockers,
  warnings,
  inputs: {
    staged_records: stagedRecords.length,
    lineage_items: lineageItems.length,
    report_recommendation: report.recommendation || null,
  },
  summary: {
    eligible_records: blockers.length === 0 ? stagedRecords.length : 0,
    blocked_records: blockers.length > 0 ? stagedRecords.length : 0,
    production_records_written: 0,
  },
  review_instruction:
    blockers.length > 0
      ? "Do not promote. Resolve blockers and complete human review first."
      : "Records are eligible for a separate controlled production promotion executor.",
};

ensureDir(path.join(ROOT, "data/ingestion/promotion-gates"));

fs.writeFileSync(
  path.join(ROOT, "data/ingestion/promotion-gates/production-promotion-gate-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  promotion_status: output.promotion_status,
  blockers: output.blockers.length,
  eligible_records: output.summary.eligible_records,
  output: "data/ingestion/promotion-gates/production-promotion-gate-v0.1.json",
});

if (blockers.length) {
  console.table(blockers.map((b) => ({ blocker: b })));
}
