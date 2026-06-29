import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PACKAGE_PATH = path.join(ROOT, "data/ingestion/hungry-smurf-promotion-package-v0.2.json");

const action = (process.argv[2] || "").toLowerCase();

if (!["approve", "reject"].includes(action)) {
  console.error("Usage: pnpm tsx src/scripts/execute-hungry-smurf-human-approval-v0.1.ts approve|reject");
  process.exit(1);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const pkg = readJson(PACKAGE_PATH);

if (pkg.decision !== "READY_FOR_HUMAN_APPROVAL") {
  throw new Error(`Package is not ready for approval: ${pkg.decision}`);
}

pkg.approval = {
  human_approved: action === "approve",
  human_rejected: action === "reject",
  approved_by: action === "approve" ? "M Keek" : null,
  rejected_by: action === "reject" ? "M Keek" : null,
  approved_at: action === "approve" ? new Date().toISOString() : null,
  rejected_at: action === "reject" ? new Date().toISOString() : null,
};

pkg.human_decision = action === "approve" ? "APPROVED" : "REJECTED";
pkg.updated_at = new Date().toISOString();

writeJson(PACKAGE_PATH, pkg);

const logPath = path.join(ROOT, "data/ingestion/hungry-smurf-human-approval-v0.1.json");

writeJson(logPath, {
  approval_version: "hungry-smurf-human-approval-v0.1",
  generated_at: new Date().toISOString(),
  action,
  human_decision: pkg.human_decision,
  package_path: "data/ingestion/hungry-smurf-promotion-package-v0.2.json",
  mutation_performed: "approval_metadata_only",
  production_mutation_allowed: false,
  approval: pkg.approval,
});

console.log({
  approval_version: "hungry-smurf-human-approval-v0.1",
  action,
  human_decision: pkg.human_decision,
  production_mutation_allowed: false,
  output: "data/ingestion/hungry-smurf-human-approval-v0.1.json",
});
