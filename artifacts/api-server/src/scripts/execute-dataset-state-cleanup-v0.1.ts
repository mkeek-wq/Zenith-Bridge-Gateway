import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const PLAN_PATH = path.join(
  ROOT,
  "data/intelligence/dataset-state-cleanup-plan-v0.1.json"
);

const BACKUP_DIR = path.join(
  ROOT,
  "data/intelligence/parsed-datasets-backups/state-cleanup-v0.1"
);

const MUTABLE_GOVERNANCE_FIELDS = [
  "verification_status",
  "reviewed_at",
  "approval_status",
  "approved_at",
  "rejected_at",
  "governance_status",
];

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const plan = readJson(PLAN_PATH);
const items = Array.isArray(plan.cleanup_plan) ? plan.cleanup_plan : [];

ensureDir(BACKUP_DIR);

const results = items.map((item: any) => {
  const parsedPath = path.join(ROOT, item.parsed_file);

  if (!fs.existsSync(parsedPath)) {
    return {
      dataset_id: item.dataset_id,
      status: "skipped_missing_file",
      parsed_file: item.parsed_file,
      removed_fields: [],
    };
  }

  const parsed = readJson(parsedPath);
  const backupPath = path.join(BACKUP_DIR, `${item.dataset_id}.json`);

  fs.copyFileSync(parsedPath, backupPath);

  const removed: string[] = [];

  for (const field of MUTABLE_GOVERNANCE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(parsed, field)) {
      delete parsed[field];
      removed.push(field);
    }
  }

  parsed.dataset_state_source_of_truth =
    "data/intelligence/verified-dataset-registry-v0.1.json";
  parsed.updated_at = new Date().toISOString();

  writeJson(parsedPath, parsed);

  return {
    dataset_id: item.dataset_id,
    status: removed.length > 0 ? "cleaned" : "no_action_required",
    parsed_file: item.parsed_file,
    backup_file: path.relative(ROOT, backupPath),
    removed_fields: removed,
  };
});

const output = {
  executor_version: "dataset-state-cleanup-executor-v0.1",
  generated_at: new Date().toISOString(),
  source_plan: "data/intelligence/dataset-state-cleanup-plan-v0.1.json",
  mutation_performed: true,
  backup_directory: path.relative(ROOT, BACKUP_DIR),
  result_count: results.length,
  cleaned_count: results.filter((r: any) => r.status === "cleaned").length,
  results,
  governance: {
    dataset_lifecycle_state_source_of_truth:
      "data/intelligence/verified-dataset-registry-v0.1.json",
    parsed_datasets_mutable_governance_fields_removed: true,
    rollback_available: true,
  },
};

const outPath = path.join(
  ROOT,
  "data/intelligence/dataset-state-cleanup-executor-v0.1.json"
);

writeJson(outPath, output);

console.log({
  executor_version: output.executor_version,
  result_count: output.result_count,
  cleaned_count: output.cleaned_count,
  backup_directory: output.backup_directory,
  output: path.relative(ROOT, outPath),
});

for (const result of results) {
  console.log(
    `${result.dataset_id} | ${result.status} | removed=${result.removed_fields.join(",") || "-"}`
  );
}
