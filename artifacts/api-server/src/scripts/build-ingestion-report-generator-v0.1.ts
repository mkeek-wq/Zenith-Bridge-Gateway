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

function latestManifest(): any | null {
  const dir = path.join(ROOT, "data/ingestion/batch-manifests");
  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (!files.length) return null;
  return readJsonSafe(path.join(dir, files[files.length - 1]));
}

const manifest = latestManifest();

const readiness =
  readJsonSafe(path.join(ROOT, "data/intelligence/bulk-ingestion-readiness-check-v0.1.json")) || {};

const dryRun =
  readJsonSafe(path.join(ROOT, "data/ingestion/dry-runs/bulk-loader-dry-run-engine-v0.1.json")) || {};

const duplicate =
  readJsonSafe(path.join(ROOT, "data/ingestion/dry-runs/ingestion-duplicate-detection-engine-v0.1.json")) || {};

const blockers: string[] = [];
const warnings: string[] = [];

if (!manifest) blockers.push("missing_batch_manifest");
if (manifest && manifest.dry_run !== true) blockers.push("manifest_not_in_dry_run_mode");
if (manifest && manifest.human_approved_for_ingestion === true) warnings.push("manifest_already_marked_human_approved");

if (readiness.readiness_status !== "ready_for_controlled_bulk_ingestion") {
  blockers.push("bulk_ingestion_readiness_check_not_ready");
}

if (dryRun.summary?.dry_run_status === "no_pending_files") {
  blockers.push("no_pending_files");
}

if (dryRun.summary?.rejected_records > 0) {
  blockers.push("dry_run_has_rejected_records");
}

if (duplicate.summary?.exact_duplicates > 0) {
  blockers.push("exact_duplicates_detected");
}

if (duplicate.summary?.possible_duplicates > 0) {
  warnings.push("possible_duplicates_require_manual_review");
}

const goNoGo =
  blockers.length === 0
    ? duplicate.summary?.possible_duplicates > 0
      ? "GO_WITH_MANUAL_DUPLICATE_REVIEW"
      : "GO_FOR_CONTROLLED_DRY_RUN_REVIEW"
    : "NO_GO";

const reportLines: string[] = [];

reportLines.push("# Ingestion Dry Run Report v0.1");
reportLines.push("");
reportLines.push(`Generated: ${new Date().toISOString()}`);
reportLines.push("");
reportLines.push(`## Recommendation`);
reportLines.push("");
reportLines.push(`**${goNoGo}**`);
reportLines.push("");
reportLines.push(`## Batch`);
reportLines.push("");
reportLines.push(`- Batch ID: ${manifest?.batch_id || "missing"}`);
reportLines.push(`- Batch status: ${manifest?.batch_status || "missing"}`);
reportLines.push(`- Dry run: ${manifest?.dry_run ?? "unknown"}`);
reportLines.push(`- Human approved: ${manifest?.human_approved_for_ingestion ?? "unknown"}`);
reportLines.push("");
reportLines.push(`## Dry Run Summary`);
reportLines.push("");
reportLines.push(`- Files detected: ${dryRun.inputs?.files_detected ?? 0}`);
reportLines.push(`- Records detected: ${dryRun.summary?.records_detected ?? 0}`);
reportLines.push(`- Accepted records: ${dryRun.summary?.accepted_records ?? 0}`);
reportLines.push(`- Rejected records: ${dryRun.summary?.rejected_records ?? 0}`);
reportLines.push("");
reportLines.push(`## Duplicate Summary`);
reportLines.push("");
reportLines.push(`- Exact duplicates: ${duplicate.summary?.exact_duplicates ?? 0}`);
reportLines.push(`- Possible duplicates: ${duplicate.summary?.possible_duplicates ?? 0}`);
reportLines.push(`- New record candidates: ${duplicate.summary?.new_record_candidates ?? 0}`);
reportLines.push("");
reportLines.push(`## Blockers`);
reportLines.push("");
if (blockers.length) {
  for (const blocker of blockers) reportLines.push(`- ${blocker}`);
} else {
  reportLines.push("- None");
}
reportLines.push("");
reportLines.push(`## Warnings`);
reportLines.push("");
if (warnings.length) {
  for (const warning of warnings) reportLines.push(`- ${warning}`);
} else {
  reportLines.push("- None");
}
reportLines.push("");
reportLines.push(`## Governance Note`);
reportLines.push("");
reportLines.push(
  "This report does not authorize production ingestion. Human approval and controlled executor flow remain required before any write to production evidence."
);

const markdown = reportLines.join("\n");

const output = {
  registry_version: "ingestion-report-generator-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    report_does_not_ingest: true,
    go_status_requires_human_review: true,
    production_mutation_allowed: false,
    evidence_lineage_required: true,
  },
  recommendation: goNoGo,
  blockers,
  warnings,
  inputs: {
    manifest_found: Boolean(manifest),
    readiness_status: readiness.readiness_status || null,
    dry_run_status: dryRun.summary?.dry_run_status || null,
    duplicate_status: duplicate.summary?.duplicate_status || null,
  },
  summary: {
    files_detected: dryRun.inputs?.files_detected ?? 0,
    records_detected: dryRun.summary?.records_detected ?? 0,
    accepted_records: dryRun.summary?.accepted_records ?? 0,
    rejected_records: dryRun.summary?.rejected_records ?? 0,
    exact_duplicates: duplicate.summary?.exact_duplicates ?? 0,
    possible_duplicates: duplicate.summary?.possible_duplicates ?? 0,
    new_record_candidates: duplicate.summary?.new_record_candidates ?? 0,
  },
  markdown,
};

ensureDir(path.join(ROOT, "data/ingestion/reports"));
ensureDir(path.join(ROOT, "exports/ingestion-reports"));

fs.writeFileSync(
  path.join(ROOT, "data/ingestion/reports/ingestion-report-generator-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/ingestion-reports/ingestion-dry-run-report-v0.1.md"),
  markdown
);

console.log({
  engine_version: output.registry_version,
  recommendation: output.recommendation,
  blockers: output.blockers.length,
  warnings: output.warnings.length,
  output_json: "data/ingestion/reports/ingestion-report-generator-v0.1.json",
  output_markdown: "exports/ingestion-reports/ingestion-dry-run-report-v0.1.md",
});

console.log("\n--- Ingestion Report Preview ---\n");
console.log(markdown);
