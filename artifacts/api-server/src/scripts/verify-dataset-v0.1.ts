import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const datasetId = process.argv[2];
const newStatus = process.argv[3] || "verified";

const allowed = new Set([
  "requested_not_loaded",
  "loaded_pending_review",
  "verified",
  "rejected",
]);

if (!datasetId) {
  console.error("Usage: pnpm tsx src/scripts/verify-dataset-v0.1.ts <DATASET_ID> [verified|loaded_pending_review|rejected]");
  process.exit(1);
}

if (!allowed.has(newStatus)) {
  console.error(`Invalid status: ${newStatus}`);
  process.exit(1);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const registryPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "verified-dataset-registry-v0.1.json"
);

const registry = readJson(registryPath);

const dataset = registry.datasets.find(
  (item: any) => item.dataset_id === datasetId
);

if (!dataset) {
  throw new Error(`Dataset not found: ${datasetId}`);
}

const valuesCount = Number(dataset.values_count || 0);

if (newStatus === "verified" && valuesCount === 0) {
  throw new Error(
    `Cannot mark ${datasetId} as verified because values_count is 0. Load real values first.`
  );
}

dataset.verification_status = newStatus;
dataset.reviewed_at = new Date().toISOString();
dataset.updated_at = new Date().toISOString();

registry.generated_at = new Date().toISOString();

writeJson(registryPath, registry);

console.log({
  status: "updated",
  dataset_id: datasetId,
  verification_status: dataset.verification_status,
  values_count: dataset.values_count,
});
