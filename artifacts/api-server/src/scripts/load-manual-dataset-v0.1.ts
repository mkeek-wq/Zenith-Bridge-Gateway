import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const datasetId = process.argv[2];

if (!datasetId) {
  console.error("Usage: pnpm tsx src/scripts/load-manual-dataset-v0.1.ts <DATASET_ID>");
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

const manualPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "manual-datasets",
  `${datasetId}.json`
);

if (!fs.existsSync(registryPath)) {
  throw new Error(`Missing registry: ${registryPath}`);
}

if (!fs.existsSync(manualPath)) {
  throw new Error(`Missing manual dataset file: ${manualPath}`);
}

const registry = readJson(registryPath);
const manual = readJson(manualPath);

const values = Array.isArray(manual.values) ? manual.values : [];
const validValues = values.filter(
  (row: any) =>
    row &&
    row.period !== undefined &&
    row.period !== null &&
    row.value !== undefined &&
    row.value !== null &&
    row.value !== ""
);

const existingIndex = registry.datasets.findIndex(
  (dataset: any) => dataset.dataset_id === datasetId
);

const loadedRecord = {
  dataset_id: manual.dataset_id,
  name: manual.name,
  country: manual.country,
  metric_type: manual.metric_type,
  frequency: manual.frequency,
  preferred_sources: manual.preferred_sources || [manual.source_name].filter(Boolean),
  verification_status: manual.verification_status || "loaded_pending_review",
  coverage_start: manual.coverage_start || validValues[0]?.period || null,
  coverage_end: manual.coverage_end || validValues[validValues.length - 1]?.period || null,
  max_history_years_requested: manual.max_history_years_requested ?? null,
  max_forecast_years_requested: manual.max_forecast_years_requested ?? null,
  values_count: validValues.length,
  source_url: manual.source_url || null,
  local_file: manualPath,
  unit: manual.unit || null,
  notes: manual.notes || "Manual dataset loaded pending review.",
  values,
  used_by_candidates:
    existingIndex >= 0
      ? registry.datasets[existingIndex].used_by_candidates || []
      : [],
  created_at:
    existingIndex >= 0
      ? registry.datasets[existingIndex].created_at
      : new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

if (existingIndex >= 0) {
  registry.datasets[existingIndex] = {
    ...registry.datasets[existingIndex],
    ...loadedRecord,
  };
} else {
  registry.datasets.push(loadedRecord);
}

registry.generated_at = new Date().toISOString();
registry.dataset_count = registry.datasets.length;

writeJson(registryPath, registry);

console.log({
  status: "loaded",
  dataset_id: datasetId,
  verification_status: loadedRecord.verification_status,
  values_count: loadedRecord.values_count,
  coverage_start: loadedRecord.coverage_start,
  coverage_end: loadedRecord.coverage_end,
  registry: registryPath,
});
