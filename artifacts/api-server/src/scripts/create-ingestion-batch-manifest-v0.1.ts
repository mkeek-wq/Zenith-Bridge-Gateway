import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-");

const batchId = `INGEST_BATCH_${timestamp}`;

const manifest = {
  manifest_version: "ingestion-batch-manifest-v0.1",
  created_at: now.toISOString(),
  batch_id: batchId,
  batch_status: "manifest_created_not_ingested",
  ingestion_mode: "controlled_bulk_dry_run",
  dry_run: true,
  human_approved_for_ingestion: false,
  source_scope: {
    source_family: "manual_or_controlled_bulk_source",
    source_description: "To be filled before ingestion.",
    country: "SG",
    sector_or_domain: "macro_economic_intelligence",
    date_range_start: null,
    date_range_end: null,
  },
  expected_inputs: {
    input_directory: "data/ingestion/pending",
    expected_file_count: null,
    accepted_file_types: ["json", "csv", "txt"],
    maximum_expected_records: null,
  },
  lineage_controls: {
    stable_batch_id_required: true,
    source_url_or_file_reference_required: true,
    raw_input_preservation_required: true,
    transformed_output_separated_from_raw_input: true,
    production_mutation_allowed: false,
  },
  governance: {
    autopublish_allowed: false,
    automatic_lifecycle_mutation_allowed: false,
    human_review_required_before_acceptance: true,
    post_ingestion_comparison_required: true,
  },
  next_steps: [
    "Place candidate source files in data/ingestion/pending",
    "Edit manifest source_scope and expected_inputs",
    "Run readiness check",
    "Take pre-ingestion snapshot",
    "Run controlled ingestion dry run",
    "Rebuild intelligence stack",
    "Run post-ingestion comparison",
    "Human review before acceptance",
  ],
};

const manifestDir = path.join(ROOT, "data/ingestion/batch-manifests");
ensureDir(manifestDir);
ensureDir(path.join(ROOT, "data/ingestion/pending"));
ensureDir(path.join(ROOT, "data/ingestion/raw"));
ensureDir(path.join(ROOT, "data/ingestion/processed"));
ensureDir(path.join(ROOT, "data/ingestion/rejected"));

const manifestPath = path.join(manifestDir, `${batchId}.json`);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log({
  manifest_version: manifest.manifest_version,
  batch_id: manifest.batch_id,
  batch_status: manifest.batch_status,
  dry_run: manifest.dry_run,
  human_approved_for_ingestion: manifest.human_approved_for_ingestion,
  output: `data/ingestion/batch-manifests/${batchId}.json`,
});

console.log("\nEdit this manifest before ingestion:");
console.log(`nano data/ingestion/batch-manifests/${batchId}.json`);
