import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const staging = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-controlled-staging-v0.1.json"));
const sniff = readJson(path.join(ROOT, "data/intelligence/hungry-smurf-schema-sniff-v0.1.json"));
const consistency = readJson(path.join(ROOT, "data/intelligence/dataset-consistency-audit-v0.1.json"));

const blockers: string[] = [];
const warnings: string[] = [];

if ((staging.staged_count || 0) === 0) blockers.push("no_staged_datasets");
if ((sniff.blocked_count || 0) > 0) blockers.push("schema_sniff_blockers");
if ((consistency.issue_count || 0) > 0) blockers.push("dataset_consistency_issues");

if ((consistency.warning_count || 0) > 0) warnings.push("requested_not_loaded_backlog_exists");
if ((sniff.review_count || 0) > 0) warnings.push("schema_review_items_exist");

const output = {
  review_version: "hungry-smurf-staging-review-v0.1",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  decision: blockers.length === 0 ? "READY_FOR_HUMAN_PROMOTION_REVIEW" : "STAGING_REVIEW_BLOCKED",
  blockers,
  warnings,
  staged_count: staging.staged_count,
  staged_items: staging.staged_items,
  governance: {
    production_mutation_allowed: false,
    human_review_required: true,
    promotion_requires_separate_gate: true
  }
};

const outPath = path.join(ROOT, "data/ingestion/hungry-smurf-staging-review-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  review_version: output.review_version,
  decision: output.decision,
  blockers,
  warnings,
  staged_count: output.staged_count,
  output: path.relative(ROOT, outPath)
});
