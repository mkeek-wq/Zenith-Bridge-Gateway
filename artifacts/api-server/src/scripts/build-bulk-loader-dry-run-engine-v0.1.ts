import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function listPendingFiles(): string[] {
  const pendingDir = path.join(ROOT, "data/ingestion/pending");
  ensureDir(pendingDir);

  return fs
    .readdirSync(pendingDir)
    .filter((f) => !f.startsWith("."))
    .map((f) => path.join(pendingDir, f));
}

function extractRecords(filePath: string): any[] {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    const data = readJsonSafe(filePath);
    if (!data) return [];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.evidence)) return data.evidence;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.records)) return data.records;

    return [data];
  }

  if (ext === ".txt" || ext === ".csv") {
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);

    return lines.map((line, index) => ({
      source_line: index + 1,
      raw_text: line,
    }));
  }

  return [];
}

function validateRecord(record: any) {
  const issues: string[] = [];

  const metric = record.metric_name || record.metric || record.indicator;
  const period = record.period || record.date || record.year;
  const value = record.value ?? record.raw_value ?? null;
  const source = record.source_title || record.source || record.publisher || record.document_title;

  if (!metric) issues.push("missing_metric");
  if (!period) issues.push("missing_period");
  if (value === null || value === undefined || value === "") issues.push("missing_value");
  if (!source) issues.push("missing_source");

  return {
    valid: issues.length === 0,
    issues,
  };
}

const pendingFiles = listPendingFiles();

const fileReports: any[] = [];
const acceptedRecords: any[] = [];
const rejectedRecords: any[] = [];

for (const filePath of pendingFiles) {
  const relativePath = path.relative(ROOT, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const sizeBytes = fs.statSync(filePath).size;
  const records = extractRecords(filePath);

  let accepted = 0;
  let rejected = 0;

  records.forEach((record, index) => {
    const validation = validateRecord(record);

    const normalized = {
      candidate_record_id: `CAND_${String(acceptedRecords.length + rejectedRecords.length + 1).padStart(6, "0")}`,
      source_file: relativePath,
      source_record_index: index,
      metric_name: record.metric_name || record.metric || record.indicator || null,
      period: record.period || record.date || record.year || null,
      value: record.value ?? record.raw_value ?? null,
      source_title: record.source_title || record.source || record.publisher || record.document_title || null,
      evidence_window: record.evidence_window || record.summary || record.text || record.raw_text || null,
      raw_record: record,
      validation,
    };

    if (validation.valid) {
      accepted++;
      acceptedRecords.push(normalized);
    } else {
      rejected++;
      rejectedRecords.push(normalized);
    }
  });

  fileReports.push({
    file: relativePath,
    extension: ext,
    size_bytes: sizeBytes,
    records_detected: records.length,
    accepted_records: accepted,
    rejected_records: rejected,
    status: rejected === 0 ? "file_passed_dry_run" : "file_has_rejections",
  });
}

const output = {
  registry_version: "bulk-loader-dry-run-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    dry_run_only: true,
    production_evidence_mutation_allowed: false,
    intelligence_mutation_allowed: false,
    human_review_required_before_ingestion: true,
  },
  inputs: {
    pending_directory: "data/ingestion/pending",
    files_detected: pendingFiles.length,
  },
  summary: {
    records_detected: acceptedRecords.length + rejectedRecords.length,
    accepted_records: acceptedRecords.length,
    rejected_records: rejectedRecords.length,
    files_with_rejections: fileReports.filter((f) => f.rejected_records > 0).length,
    dry_run_status:
      pendingFiles.length === 0
        ? "no_pending_files"
        : rejectedRecords.length === 0
          ? "dry_run_passed"
          : "dry_run_has_rejections",
  },
  file_reports: fileReports,
  accepted_records: acceptedRecords,
  rejected_records: rejectedRecords,
};

ensureDir(path.join(ROOT, "data/ingestion/dry-runs"));

fs.writeFileSync(
  path.join(ROOT, "data/ingestion/dry-runs/bulk-loader-dry-run-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  files_detected: output.inputs.files_detected,
  summary: output.summary,
  output: "data/ingestion/dry-runs/bulk-loader-dry-run-engine-v0.1.json",
});

console.table(
  fileReports.map((f) => ({
    file: f.file,
    records: f.records_detected,
    accepted: f.accepted_records,
    rejected: f.rejected_records,
    status: f.status,
  }))
);
