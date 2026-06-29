import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const stagingReview = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-staging-review-v0.1.json"));
const sniff = readJson(path.join(ROOT, "data/intelligence/hungry-smurf-schema-sniff-v0.1.json"));
const quant = readJson(path.join(ROOT, "data/intelligence/quant-smurf-ingestion-audit-v0.1.json"));
const consistency = readJson(path.join(ROOT, "data/intelligence/dataset-consistency-audit-v0.1.json"));

const blockers: string[] = [];
const warnings: string[] = [];

if (stagingReview.decision !== "READY_FOR_HUMAN_PROMOTION_REVIEW") blockers.push("staging_review_not_ready");
if ((sniff.blocked_count || 0) > 0) blockers.push("schema_sniff_blocked");
if ((quant.blocked_count || 0) > 0) blockers.push("quant_audit_blocked");
if ((consistency.issue_count || 0) > 0) blockers.push("consistency_issues");

if ((sniff.review_count || 0) > 0) warnings.push("schema_review_items");
if ((quant.review_count || 0) > 0) warnings.push("quant_review_items");
if ((consistency.warning_count || 0) > 0) warnings.push("dataset_backlog_warnings");

const confidenceScore =
  100
  - blockers.length * 25
  - warnings.length * 5;

const output = {
  review_version: "audit-smurf-promotion-review-v0.1",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  decision: blockers.length > 0 ? "BLOCK_PROMOTION" : warnings.length > 0 ? "PROMOTION_ALLOWED_WITH_REVIEW" : "PROMOTION_SAFE",
  confidence_score: Math.max(0, confidenceScore),
  blockers,
  warnings,
  inputs: {
    staging_review: "data/ingestion/hungry-smurf-staging-review-v0.1.json",
    schema_sniff: "data/intelligence/hungry-smurf-schema-sniff-v0.1.json",
    quant_audit: "data/intelligence/quant-smurf-ingestion-audit-v0.1.json",
    consistency_audit: "data/intelligence/dataset-consistency-audit-v0.1.json"
  },
  summary: {
    staged_count: stagingReview.staged_count,
    schema_clean_count: sniff.clean_count,
    quant_clean_count: quant.clean_count,
    quant_review_count: quant.review_count,
    quant_blocked_count: quant.blocked_count,
    consistency_issue_count: consistency.issue_count,
    consistency_warning_count: consistency.warning_count
  },
  governance: {
    production_mutation_allowed: false,
    human_approval_allowed: blockers.length === 0,
    human_review_required: true
  }
};

const outPath = path.join(ROOT, "data/intelligence/audit-smurf-promotion-review-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  review_version: output.review_version,
  decision: output.decision,
  confidence_score: output.confidence_score,
  blockers,
  warnings,
  output: path.relative(ROOT, outPath)
});
