import fs from "fs";
import path from "path";

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

const staged =
  readJsonSafe(path.join(ROOT, "data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json")) || {};

const manifestDir = path.join(ROOT, "data/ingestion/batch-manifests");

const manifestFiles = fs.existsSync(manifestDir)
  ? fs.readdirSync(manifestDir).filter((f) => f.endsWith(".json")).sort()
  : [];

const latestManifest = manifestFiles.length
  ? readJsonSafe(path.join(manifestDir, manifestFiles[manifestFiles.length - 1]))
  : null;

const stagedRecords: any[] = staged.staged_records || [];

const lineageItems = stagedRecords.map((record, index) => ({
  lineage_id: `LINEAGE_${String(index + 1).padStart(5, "0")}`,
  staged_evidence_id: record.staged_evidence_id,
  batch_id: record.batch_id,
  metric_name: record.metric_name,
  period: record.period,
  value: record.value,
  source_title: record.source_title,
  source_file: record.source_file,
  candidate_record_id: record.candidate_record_id,
  lineage_chain: [
    {
      step: "batch_manifest_created",
      batch_id: record.batch_id,
      status: latestManifest ? "found" : "missing",
    },
    {
      step: "dry_run_validation",
      status: "passed",
      candidate_record_id: record.candidate_record_id,
    },
    {
      step: "duplicate_detection",
      status: "new_record_candidate",
    },
    {
      step: "controlled_executor",
      status: "staged_not_promoted",
      staged_evidence_id: record.staged_evidence_id,
    },
  ],
  review_state: {
    human_reviewed: false,
    approved_for_production: false,
    rejection_reason: null,
  },
  governance: {
    lineage_complete: Boolean(latestManifest && record.batch_id && record.source_file),
    production_promotion_allowed: false,
    human_review_required: true,
  },
}));

const output = {
  registry_version: "evidence-lineage-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    every_staged_record_requires_lineage: true,
    lineage_does_not_authorize_production: true,
    human_review_required_for_promotion: true,
  },
  inputs: {
    staged_records: stagedRecords.length,
    latest_manifest_found: Boolean(latestManifest),
  },
  summary: {
    lineage_items_created: lineageItems.length,
    complete_lineage_items: lineageItems.filter((x) => x.governance.lineage_complete).length,
    incomplete_lineage_items: lineageItems.filter((x) => !x.governance.lineage_complete).length,
    approved_for_production: 0,
  },
  lineage_items: lineageItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/evidence-lineage-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/evidence-lineage-engine-v0.1.json",
});

console.table(
  lineageItems.map((x) => ({
    lineage_id: x.lineage_id,
    staged_id: x.staged_evidence_id,
    metric: x.metric_name,
    complete: x.governance.lineage_complete,
    approved: x.review_state.approved_for_production,
  }))
);
