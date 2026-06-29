import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const datasetId = process.argv[2];

if (!datasetId) {
  console.error("Usage: pnpm tsx src/scripts/load-csv-dataset-v0.1.ts <DATASET_ID>");
  process.exit(1);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

const configPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "source-download-config",
  `${datasetId}.json`
);

const csvPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "raw-downloads",
  `${datasetId}.csv`
);

const registryPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "verified-dataset-registry-v0.1.json"
);

if (!fs.existsSync(configPath)) throw new Error(`Missing config: ${configPath}`);
if (!fs.existsSync(csvPath)) throw new Error(`Missing CSV: ${csvPath}`);
if (!fs.existsSync(registryPath)) throw new Error(`Missing registry: ${registryPath}`);

const config = readJson(configPath);
const registry = readJson(registryPath);
const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));

const periodColumn = config.period_column || "period";
const valueColumn = config.value_column || "value";

const values = rows
  .map((row) => {
    const rawValue = row[valueColumn];

    return {
      period: row[periodColumn],
      value:
        rawValue === undefined || rawValue === null || rawValue === ""
          ? null
          : Number(String(rawValue).replace(/,/g, "")),
    };
  })
  .filter((row) => row.period);

const validValues = values.filter(
  (row) => row.value !== null && !Number.isNaN(row.value)
);

const existingIndex = registry.datasets.findIndex(
  (dataset: any) => dataset.dataset_id === datasetId
);

const existing =
  existingIndex >= 0 ? registry.datasets[existingIndex] : {};

const loadedRecord = {
  ...existing,
  dataset_id: datasetId,
  name: config.name || existing.name || datasetId,
  country: config.country || existing.country || "unknown",
  metric_type: config.metric_type || existing.metric_type || "unknown",
  frequency: config.frequency || existing.frequency || "unknown",
  preferred_sources: config.preferred_sources || [config.source_name].filter(Boolean),
  verification_status:
    config.verification_status_after_load || "loaded_pending_review",
  coverage_start: validValues[0]?.period || null,
  coverage_end: validValues[validValues.length - 1]?.period || null,
  values_count: validValues.length,
  source_url: config.source_url || null,
  local_file: csvPath,
  unit: config.unit || null,
  notes: config.notes || "CSV dataset loaded pending review.",
  values,
  used_by_candidates: existing.used_by_candidates || [],
  created_at: existing.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

if (existingIndex >= 0) {
  registry.datasets[existingIndex] = loadedRecord;
} else {
  registry.datasets.push(loadedRecord);
}

registry.generated_at = new Date().toISOString();
registry.dataset_count = registry.datasets.length;

writeJson(registryPath, registry);

const parsedOut = path.join(
  ROOT,
  "data",
  "intelligence",
  "parsed-datasets",
  `${datasetId}.json`
);

writeJson(parsedOut, loadedRecord);

console.log({
  status: "loaded_from_csv",
  dataset_id: datasetId,
  rows: rows.length,
  valid_values: validValues.length,
  coverage_start: loadedRecord.coverage_start,
  coverage_end: loadedRecord.coverage_end,
  verification_status: loadedRecord.verification_status,
  parsed_output: parsedOut,
});
