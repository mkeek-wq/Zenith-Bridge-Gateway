import fs from "fs";
import path from "path";
import os from "os";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function fileStatus(relativePath: string) {
  const fullPath = path.join(ROOT, relativePath);
  const exists = fs.existsSync(fullPath);
  let validJson = false;
  let sizeBytes = 0;

  if (exists) {
    sizeBytes = fs.statSync(fullPath).size;
    validJson = Boolean(readJsonSafe(fullPath));
  }

  return {
    path: relativePath,
    exists,
    valid_json: validJson,
    size_bytes: sizeBytes,
    status: exists && validJson ? "ok" : "missing_or_invalid",
  };
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const requiredFiles = [
  "data/evidence-v5/latest.json",
  "data/intelligence/evidence-assessment-engine-v0.2.json",
  "data/intelligence/evidence-deduplication-engine-v0.1.json",
  "data/intelligence/mechanism-evidence-linker-v0.1.json",
  "data/intelligence/mechanism-confidence-engine-v0.2.json",
  "data/intelligence/case-construction-engine-v0.1.json",
  "data/intelligence/intelligence-brief-generator-v0.2.json",
  "data/intelligence/experience-registry-engine-v0.1.json",
  "data/intelligence/experience-confidence-engine-v0.1.json",
];

const checks = requiredFiles.map(fileStatus);

const evidence = readJsonSafe(path.join(ROOT, "data/evidence-v5/latest.json")) || {};
const evidenceItems: any[] = evidence.evidence || evidence.items || evidence.records || [];

const caseSnapshotsDir = path.join(ROOT, "data/intelligence/case-snapshots");
const snapshotCount = fs.existsSync(caseSnapshotsDir)
  ? fs.readdirSync(caseSnapshotsDir).filter((f) => f.endsWith(".json")).length
  : 0;

const readinessFailures = checks.filter((c) => c.status !== "ok");

const memory = {
  total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
  free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
  free_memory_ratio: Number((os.freemem() / os.totalmem()).toFixed(3)),
};

const systemStatus = {
  platform: os.platform(),
  uptime_seconds: Math.round(os.uptime()),
  load_average: os.loadavg(),
  memory,
};

const readinessStatus =
  readinessFailures.length === 0 && evidenceItems.length > 0 && snapshotCount > 0
    ? "ready_for_controlled_bulk_ingestion"
    : "not_ready_for_bulk_ingestion";

const output = {
  registry_version: "bulk-ingestion-readiness-check-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    readiness_check_does_not_ingest_data: true,
    bulk_ingestion_requires_manifest: true,
    human_review_required_before_bulk_run: true,
    evidence_lineage_required: true,
  },
  inputs: {
    required_files_checked: requiredFiles.length,
    current_evidence_items: evidenceItems.length,
    case_snapshots: snapshotCount,
  },
  readiness_status: readinessStatus,
  checks,
  failures: readinessFailures,
  system_status: systemStatus,
  recommendation:
    readinessStatus === "ready_for_controlled_bulk_ingestion"
      ? "System appears ready for a controlled bulk ingestion dry run. Create a batch manifest before ingestion."
      : "Do not start bulk ingestion. Resolve missing or invalid artifacts first.",
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/bulk-ingestion-readiness-check-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  readiness_status: output.readiness_status,
  current_evidence_items: output.inputs.current_evidence_items,
  case_snapshots: output.inputs.case_snapshots,
  failures: output.failures.length,
  output: "data/intelligence/bulk-ingestion-readiness-check-v0.1.json",
});

console.table(
  checks.map((c) => ({
    path: c.path,
    exists: c.exists,
    valid_json: c.valid_json,
    status: c.status,
  }))
);

