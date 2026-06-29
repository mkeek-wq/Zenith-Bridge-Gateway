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

function latestManifest(): any | null {
  const dir = path.join(ROOT, "data/ingestion/batch-manifests");
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) return null;

  return readJsonSafe(path.join(dir, files[files.length - 1]));
}

function stableId(record: any, batchId: string): string {
  const raw = [
    batchId,
    record.metric_name,
    record.period,
    record.value,
    record.source_title,
  ].join("::");

  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

const manifest = latestManifest();
const report =
  readJsonSafe(path.join(ROOT, "data/ingestion/reports/ingestion-report-generator-v0.1.json")) || {};
const duplicate =
  readJsonSafe(path.join(ROOT, "data/ingestion/dry-runs/ingestion-duplicate-detection-engine-v0.1.json")) || {};
const dryRun =
  readJsonSafe(path.join(ROOT, "data/ingestion/dry-runs/bulk-loader-dry-run-engine-v0.1.json")) || {};

const blockers: string[] = [];
const warnings: string[] = [];

if (!manifest) blockers.push("missing_manifest");
if (!report.recommendation) blockers.push("missing_ingestion_report");

if (!["GO_FOR_CONTROLLED_DRY_RUN_REVIEW", "GO_WITH_MANUAL_DUPLICATE_REVIEW"].includes(report.recommendation)) {
  blockers.push("ingestion_report_not_go");
}

if (report.recommendation === "GO_WITH_MANUAL_DUPLICATE_REVIEW") {
  blockers.push("manual_duplicate_review_required_before_staging");
}

if (manifest?.dry_run !== true) blockers.push("manifest_not_in_dry_run_mode");
if (manifest?.human_approved_for_ingestion === true) warnings.push("manifest_has_human_approval_but_executor_is_staging_only");

const candidateRecords: any[] = duplicate.new_record_candidates || [];
const acceptedRecords: any[] = dryRun.accepted_records || [];

const acceptedById = new Map(acceptedRecords.map((r) => [r.candidate_record_id, r]));

const stagedRecords = blockers.length === 0
  ? candidateRecords.map((candidate, index) => {
      const full = acceptedById.get(candidate.candidate_record_id) || candidate;

      return {
        staged_evidence_id: `STAGED_${stableId(candidate, manifest.batch_id)}`,
        staged_record_index: index,
        batch_id: manifest.batch_id,
        ingestion_status: "staged_not_promoted",
        metric_name: candidate.metric_name,
        period: candidate.period,
        value: candidate.value,
        source_title: candidate.source_title,
        evidence_window: full.evidence_window || full.raw_record?.evidence_window || null,
        source_file: candidate.source_file,
        candidate_record_id: candidate.candidate_record_id,
        lineage: {
          manifest_batch_id: manifest.batch_id,
          source_file: candidate.source_file,
          source_record_id: candidate.candidate_record_id,
          dry_run_validated: true,
          duplicate_status: "new_record_candidate",
          production_promoted: false,
        },
        governance: {
          staged_only: true,
          production_write_allowed: false,
          human_review_required_for_promotion: true,
        },
      };
    })
  : [];

const output = {
  registry_version: "controlled-ingestion-executor-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    executor_stages_only: true,
    production_evidence_mutation_allowed: false,
    human_review_required_for_promotion: true,
    lineage_required: true,
  },
  batch_id: manifest?.batch_id || null,
  execution_status: blockers.length === 0 ? "staged_successfully" : "staging_blocked",
  blockers,
  warnings,
  inputs: {
    report_recommendation: report.recommendation || null,
    new_record_candidates: candidateRecords.length,
    accepted_records: acceptedRecords.length,
  },
  summary: {
    staged_records: stagedRecords.length,
    production_records_written: 0,
  },
  staged_records: stagedRecords,
};

ensureDir(path.join(ROOT, "data/ingestion/staged-ingestion"));

const outPath = path.join(
  ROOT,
  "data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json"
);

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.registry_version,
  execution_status: output.execution_status,
  batch_id: output.batch_id,
  staged_records: output.summary.staged_records,
  blockers: output.blockers.length,
  output: "data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json",
});

if (blockers.length) {
  console.table(blockers.map((b) => ({ blocker: b })));
} else {
  console.table(
    stagedRecords.map((r) => ({
      staged_id: r.staged_evidence_id,
      metric: r.metric_name,
      period: r.period,
      value: r.value,
      status: r.ingestion_status,
    }))
  );
}
