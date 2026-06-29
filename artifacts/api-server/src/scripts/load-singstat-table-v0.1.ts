import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const datasetId = process.argv[2];

if (!datasetId) {
  console.error("Usage: pnpm tsx src/scripts/load-singstat-table-v0.1.ts <DATASET_ID>");
  process.exit(1);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json,text/plain,*/*",
      "User-Agent": "Mozilla/5.0 ZNBW-Intelligence-DataLoader/0.1",
      "Referer": "https://tablebuilder.singstat.gov.sg/"
    }
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${raw.slice(0, 300)}`);
  }

  if (raw.trim().startsWith("<")) {
    throw new Error(`Expected JSON but received HTML: ${raw.slice(0, 300)}`);
  }

  return JSON.parse(raw);
}

function extractValues(row: any) {
  const values: { period: string; value: number | null }[] = [];

  if (Array.isArray(row.columns)) {
    for (const column of row.columns) {
      const key = String(column.key || "");
      const raw = column.value;

      if (/^\d{4}$/.test(key)) {
        values.push({
          period: key,
          value:
            raw === null || raw === undefined || raw === "" || raw === "na"
              ? null
              : Number(String(raw).replace(/,/g, "")),
        });
      }
    }
  } else {
    for (const [key, value] of Object.entries(row)) {
      if (/^\d{4}$/.test(key)) {
        const raw = value as any;

        values.push({
          period: key,
          value:
            raw === null || raw === undefined || raw === "" || raw === "na"
              ? null
              : Number(String(raw).replace(/,/g, "")),
        });
      }
    }
  }

  return values
    .filter((item) => !Number.isNaN(item.value as any))
    .sort((a, b) => a.period.localeCompare(b.period));
}

const configPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "source-download-config",
  `${datasetId}.json`
);

const registryPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "verified-dataset-registry-v0.1.json"
);

if (!fs.existsSync(configPath)) throw new Error(`Missing config: ${configPath}`);
if (!fs.existsSync(registryPath)) throw new Error(`Missing registry: ${registryPath}`);

const config = readJson(configPath);
const registry = readJson(registryPath);

if (!config.table_id) throw new Error(`Missing table_id in config for ${datasetId}`);
if (!config.series_match) throw new Error(`Missing series_match in config for ${datasetId}`);

const url = `https://tablebuilder.singstat.gov.sg/api/table/tabledata/${config.table_id}`;
const response = await getJson(url);

const data = response.Data || response.data || response;
const rows = data.row || [];

const matched = rows.find((row: any) =>
  String(row.rowText || "")
    .toLowerCase()
    .includes(String(config.series_match).toLowerCase())
);

if (!matched) {
  console.error("Available rowText values:");
  for (const row of rows.slice(0, 120)) console.error("-", row.rowText);
  throw new Error(`No row matched series_match="${config.series_match}"`);
}

let values = extractValues(matched);
if (values.length > 10) values = values.slice(-10);

const validValues = values.filter((row) => row.value !== null);

const rawDir = path.join(ROOT, "data", "intelligence", "raw-downloads");
const parsedDir = path.join(ROOT, "data", "intelligence", "parsed-datasets");
ensureDir(rawDir);
ensureDir(parsedDir);

const rawPath = path.join(rawDir, `${datasetId}.singstat.json`);
const parsedPath = path.join(parsedDir, `${datasetId}.json`);
const csvPath = path.join(rawDir, `${datasetId}.csv`);

writeJson(rawPath, response);

fs.writeFileSync(
  csvPath,
  ["period,value", ...values.map((v) => `${v.period},${v.value ?? ""}`)].join("\n")
);

const existingIndex = registry.datasets.findIndex(
  (dataset: any) => dataset.dataset_id === datasetId
);

const existing = existingIndex >= 0 ? registry.datasets[existingIndex] : {};

const loadedRecord = {
  ...existing,
  dataset_id: datasetId,
  name: config.name || existing.name || matched.rowText,
  country: config.country || existing.country || "Singapore",
  metric_type: config.metric_type || existing.metric_type || "unknown",
  frequency: config.frequency || data.frequency || existing.frequency || "unknown",
  preferred_sources: [config.source_name || data.generatedBy || "SingStat"],
  verification_status: config.verification_status_after_load || "loaded_pending_review",
  coverage_start: validValues[0]?.period || null,
  coverage_end: validValues[validValues.length - 1]?.period || null,
  values_count: validValues.length,
  source_url: url,
  local_file: csvPath,
  raw_file: rawPath,
  unit: config.unit || matched.uoM || null,
  notes: config.notes || `Loaded from SingStat table ${config.table_id}.`,
  values,
  source_metadata: {
    table_id: config.table_id,
    table_title: data.title,
    row_text: matched.rowText,
    datasource: data.datasource,
    data_last_updated: data.dataLastUpdated,
    date_generated: data.dateGenerated,
    footnote: data.footnote,
  },
  used_by_candidates: existing.used_by_candidates || [],
  created_at: existing.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

if (existingIndex >= 0) registry.datasets[existingIndex] = loadedRecord;
else registry.datasets.push(loadedRecord);

registry.generated_at = new Date().toISOString();
registry.dataset_count = registry.datasets.length;

writeJson(registryPath, registry);
writeJson(parsedPath, loadedRecord);

console.log({
  status: "loaded_from_singstat",
  dataset_id: datasetId,
  table_id: config.table_id,
  matched_row: matched.rowText,
  values_count: validValues.length,
  coverage_start: loadedRecord.coverage_start,
  coverage_end: loadedRecord.coverage_end,
  verification_status: loadedRecord.verification_status,
  csv_output: csvPath,
  parsed_output: parsedPath,
});
