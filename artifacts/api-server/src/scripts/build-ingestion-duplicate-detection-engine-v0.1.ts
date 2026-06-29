import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function evidenceKey(record: any): string {
  const metric = String(record.metric_name || record.metric || record.indicator || "").toLowerCase().trim();
  const period = String(record.period || record.date || record.year || "").toLowerCase().trim();
  const source = String(record.source_title || record.source || record.publisher || "").toLowerCase().trim();
  const value = String(record.value ?? record.raw_value ?? "").toLowerCase().trim();

  return crypto
    .createHash("sha256")
    .update(`${metric}::${period}::${source}::${value}`)
    .digest("hex");
}

function evidenceLooseKey(record: any): string {
  const metric = String(record.metric_name || record.metric || record.indicator || "").toLowerCase().trim();
  const period = String(record.period || record.date || record.year || "").toLowerCase().trim();

  return `${metric}::${period}`;
}

const currentEvidenceData =
  readJsonSafe(path.join(ROOT, "data/evidence-v5/latest.json")) || {};

const dryRun =
  readJsonSafe(path.join(ROOT, "data/ingestion/dry-runs/bulk-loader-dry-run-engine-v0.1.json")) || {};

const currentEvidence: any[] =
  currentEvidenceData.evidence ||
  currentEvidenceData.items ||
  currentEvidenceData.records ||
  [];

const candidateRecords: any[] = dryRun.accepted_records || [];

const existingExactKeys = new Set(currentEvidence.map(evidenceKey));
const existingLooseKeys = new Set(currentEvidence.map(evidenceLooseKey));

const exactDuplicates: any[] = [];
const possibleDuplicates: any[] = [];
const newRecords: any[] = [];

for (const candidate of candidateRecords) {
  const raw = {
    metric_name: candidate.metric_name,
    period: candidate.period,
    value: candidate.value,
    source_title: candidate.source_title,
  };

  const exactKey = evidenceKey(raw);
  const looseKey = evidenceLooseKey(raw);

  const result = {
    candidate_record_id: candidate.candidate_record_id,
    source_file: candidate.source_file,
    metric_name: candidate.metric_name,
    period: candidate.period,
    value: candidate.value,
    source_title: candidate.source_title,
    exact_key: exactKey,
    loose_key: looseKey,
  };

  if (existingExactKeys.has(exactKey)) {
    exactDuplicates.push({
      ...result,
      duplicate_type: "exact_duplicate",
      recommendation: "reject_or_skip",
    });
  } else if (existingLooseKeys.has(looseKey)) {
    possibleDuplicates.push({
      ...result,
      duplicate_type: "possible_duplicate_same_metric_period",
      recommendation: "manual_review",
    });
  } else {
    newRecords.push({
      ...result,
      duplicate_type: "new_record_candidate",
      recommendation: "eligible_for_ingestion_after_review",
    });
  }
}

const output = {
  registry_version: "ingestion-duplicate-detection-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    duplicate_detection_does_not_ingest: true,
    possible_duplicates_require_human_review: true,
    production_mutation_allowed: false,
  },
  inputs: {
    current_evidence_items: currentEvidence.length,
    candidate_records: candidateRecords.length,
  },
  summary: {
    exact_duplicates: exactDuplicates.length,
    possible_duplicates: possibleDuplicates.length,
    new_record_candidates: newRecords.length,
    duplicate_status:
      exactDuplicates.length > 0 || possibleDuplicates.length > 0
        ? "duplicates_or_possible_duplicates_detected"
        : "no_duplicates_detected",
  },
  exact_duplicates: exactDuplicates,
  possible_duplicates: possibleDuplicates,
  new_record_candidates: newRecords,
};

ensureDir(path.join(ROOT, "data/ingestion/dry-runs"));

fs.writeFileSync(
  path.join(ROOT, "data/ingestion/dry-runs/ingestion-duplicate-detection-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/ingestion/dry-runs/ingestion-duplicate-detection-engine-v0.1.json",
});

console.table([
  { category: "exact_duplicates", count: exactDuplicates.length },
  { category: "possible_duplicates", count: possibleDuplicates.length },
  { category: "new_record_candidates", count: newRecords.length },
]);
