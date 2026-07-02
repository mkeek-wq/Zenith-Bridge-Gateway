import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseCsv(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing CSV input: ${filePath}`);

  const raw = fs.readFileSync(filePath, "utf8").trim();
  const [headerLine, ...rows] = raw.split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());

  return rows.filter(Boolean).map((row) => {
    const values = row.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

const csvPath = path.join(root, "inputs/article-generator/tablebuilder-sector-values-input-v0.1.csv");
const existingInputPath = path.join(root, "inputs/article-generator/sector-performance-input-v0.1.json");

const targetRegistry = readJson(
  path.join(root, "exports/article-generator/tablebuilder-fetch-target-registry-v0.1.json")
);

const existingInput = fs.existsSync(existingInputPath)
  ? readJson(existingInputPath)
  : {
      input_version: "sector-performance-input-v0.1",
      created_at: new Date().toISOString(),
      source_note: "Manual official-source staging file. Only verified values may be promoted.",
      metrics: []
    };

const csvRows = parseCsv(csvPath);
const targetSectors = new Set((targetRegistry.targets ?? []).map((t: any) => t.sector));

const promoted = csvRows.map((row: any) => {
  const rawValue = String(row.value ?? "").trim();

  if (!row.sector) throw new Error("Missing sector in CSV row.");
  if (!targetSectors.has(row.sector)) throw new Error(`CSV sector is not in target registry: ${row.sector}`);
  if (rawValue === "") throw new Error(`Missing value for sector: ${row.sector}`);

  const value = Number(rawValue);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric value for sector: ${row.sector}: ${row.value}`);

  if (row.verification_status !== "manual_verified") {
    throw new Error(`Sector is not manual_verified: ${row.sector}`);
  }

  return {
    sector: row.sector,
    period: row.period,
    metric: "growth_yoy",
    value,
    unit: "% YoY",
    source_name: "Singapore Department of Statistics",
    source_url: row.source_url,
    verification_status: "verified_manual_entry",
    retrieval_method: "tablebuilder_manual_csv_export",
    loaded_at: new Date().toISOString()
  };
});

const existingMetrics = existingInput.metrics ?? [];

const promotedKeys = new Set(
  promoted.map((m: any) => `${m.sector}|${m.metric}|${m.period}`)
);

const retainedMetrics = existingMetrics.filter((m: any) => {
  const key = `${m.sector}|${m.metric}|${m.period}`;
  return !promotedKeys.has(key);
});

const output = {
  ...existingInput,
  generated_at: new Date().toISOString(),
  metrics: [...retainedMetrics, ...promoted],
  tablebuilder_loader: {
    loader_version: "tablebuilder-sector-performance-loader-v0.1",
    source_target_registry: targetRegistry.registry_version,
    csv_input: csvPath,
    promoted_records: promoted.length
  }
};

fs.writeFileSync(existingInputPath, JSON.stringify(output, null, 2));

const reportPath = path.join(
  root,
  "exports/article-generator/tablebuilder-sector-performance-loader-report-v0.1.json"
);

fs.writeFileSync(reportPath, JSON.stringify({
  report_version: "tablebuilder-sector-performance-loader-report-v0.1",
  generated_at: new Date().toISOString(),
  promoted_records: promoted.length,
  promoted_sectors: promoted.map((m: any) => m.sector),
  output: existingInputPath
}, null, 2));

console.log({
  loader_version: "tablebuilder-sector-performance-loader-v0.1",
  promoted_records: promoted.length,
  promoted_sectors: promoted.map((m: any) => m.sector),
  output: existingInputPath,
  report: reportPath
});
