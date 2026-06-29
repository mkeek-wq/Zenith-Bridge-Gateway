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
  const dir = path.join(ROOT, "data/replay/run-manifests");
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) return null;

  return readJsonSafe(path.join(dir, files[files.length - 1]));
}

function inferMechanisms(record: any): string[] {
  const metric = String(record.metric_name || "").toLowerCase();
  const text = `${record.evidence_window || ""} ${record.source_title || ""}`.toLowerCase();

  const mechanisms: string[] = [];

  if (
    metric.includes("manufacturing") ||
    metric.includes("output") ||
    text.includes("recovery")
  ) {
    mechanisms.push("MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY");
  }

  if (
    metric.includes("nodx") ||
    metric.includes("trade") ||
    text.includes("external trade")
  ) {
    mechanisms.push("MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY");
  }

  if (
    metric.includes("policy") ||
    text.includes("policy") ||
    text.includes("government")
  ) {
    mechanisms.push("MKT_006_POLICY_REGULATORY_IMPACT");
  }

  return mechanisms;
}

const readiness =
  readJsonSafe(path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json")) || {};

const manifest = latestManifest();

const blockers: string[] = [];

if (!manifest) blockers.push("missing_replay_manifest");
if (readiness.replay_readiness_status !== "ready_for_replay_dry_run") {
  blockers.push("replay_readiness_not_ready");
}
if (manifest?.replay_mode !== "dry_run_only") blockers.push("manifest_not_dry_run_only");
if (manifest?.production_mutation_allowed !== false) blockers.push("manifest_allows_production_mutation");

const inputPath = manifest?.input?.input_file
  ? path.join(ROOT, manifest.input.input_file)
  : null;

const input = inputPath ? readJsonSafe(inputPath) : null;

if (!input) blockers.push("missing_or_invalid_replay_input");

const records: any[] = input?.records || [];

if (manifest && records.length > Number(manifest.limits?.max_records ?? 0)) {
  blockers.push("input_exceeds_manifest_record_limit");
}

const replayedRecords = blockers.length === 0
  ? records.map((record, index) => {
      const mechanisms = inferMechanisms(record);

      return {
        replay_record_id: `REPLAY_REC_${String(index + 1).padStart(5, "0")}`,
        source_record_id: record.record_id || null,
        metric_name: record.metric_name,
        period: record.period,
        value: record.value,
        direction: record.direction || "unknown",
        source_title: record.source_title,
        evidence_window: record.evidence_window,
        inferred_mechanisms: mechanisms,
        replay_assessment: {
          signal_detected: mechanisms.length > 0,
          mechanism_count: mechanisms.length,
          replay_use: "dry_run_assessment_only"
        },
        governance: {
          dry_run_only: true,
          production_write_allowed: false,
          lifecycle_mutation_allowed: false,
          validation_mutation_allowed: false
        }
      };
    })
  : [];

const mechanismCounts: Record<string, number> = {};
for (const r of replayedRecords) {
  for (const m of r.inferred_mechanisms) {
    mechanismCounts[m] = (mechanismCounts[m] || 0) + 1;
  }
}

const output = {
  registry_version: "replay-executor-dry-run-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_execution_is_dry_run_only: true,
    no_production_mutation: true,
    no_lifecycle_mutation: true,
    no_validation_mutation: true,
    replay_outputs_require_evaluation: true
  },
  replay_run_id: manifest?.replay_run_id || null,
  execution_status: blockers.length === 0 ? "replay_dry_run_completed" : "replay_dry_run_blocked",
  blockers,
  inputs: {
    input_file: manifest?.input?.input_file || null,
    records_supplied: records.length,
    max_records_allowed: manifest?.limits?.max_records ?? null
  },
  summary: {
    records_replayed: replayedRecords.length,
    records_with_mechanisms: replayedRecords.filter((r) => r.inferred_mechanisms.length > 0).length,
    unique_mechanisms_detected: Object.keys(mechanismCounts).length,
    mechanism_counts: mechanismCounts,
    production_records_written: 0
  },
  replayed_records: replayedRecords
};

ensureDir(path.join(ROOT, "data/replay/output"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/output/replay-executor-dry-run-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  replay_run_id: output.replay_run_id,
  execution_status: output.execution_status,
  summary: output.summary,
  output: "data/replay/output/replay-executor-dry-run-v0.1.json"
});

if (blockers.length) {
  console.table(blockers.map((b) => ({ blocker: b })));
} else {
  console.table(
    replayedRecords.map((r) => ({
      record: r.replay_record_id,
      metric: r.metric_name,
      period: r.period,
      direction: r.direction,
      mechanisms: r.inferred_mechanisms.length
    }))
  );
}
