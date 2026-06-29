import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const review = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-staging-review-v0.1.json"));

const blockers: string[] = [];

if (review.decision !== "READY_FOR_HUMAN_PROMOTION_REVIEW") {
  blockers.push("staging_review_not_ready");
}

const output = {
  gate_version: "hungry-smurf-promotion-gate-v0.1",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  decision: blockers.length === 0 ? "READY_FOR_MANUAL_APPROVAL" : "PROMOTION_BLOCKED",
  blockers,
  staged_count: review.staged_count,
  staged_items: review.staged_items,
  approval: {
    human_approved: false,
    approved_by: null,
    approved_at: null
  },
  governance: {
    production_mutation_allowed: false,
    manual_approval_required_before_promotion: true,
    promotion_executor_required: true
  }
};

const outPath = path.join(ROOT, "data/ingestion/hungry-smurf-promotion-gate-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  gate_version: output.gate_version,
  decision: output.decision,
  blockers,
  staged_count: output.staged_count,
  output: path.relative(ROOT, outPath)
});
