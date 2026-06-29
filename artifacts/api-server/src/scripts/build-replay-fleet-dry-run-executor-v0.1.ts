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

function inferMechanisms(record: any): string[] {
  const metric = String(record.metric_name || "").toLowerCase();
  const text = `${record.evidence_window || ""} ${record.source_title || ""}`.toLowerCase();

  const mechanisms: string[] = [];

  if (
    metric.includes("manufacturing") ||
    metric.includes("output") ||
    metric.includes("inventory") ||
    metric.includes("restocking") ||
    metric.includes("semiconductor") ||
    text.includes("recovery") ||
    text.includes("restocking")
  ) {
    mechanisms.push("MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY");
  }

  if (
    metric.includes("nodx") ||
    metric.includes("export") ||
    metric.includes("trade") ||
    metric.includes("demand") ||
    metric.includes("petroleum") ||
    text.includes("external demand")
  ) {
    mechanisms.push("MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY");
  }

  if (
    metric.includes("policy") ||
    text.includes("policy") ||
    text.includes("government") ||
    text.includes("capacity support")
  ) {
    mechanisms.push("MKT_006_POLICY_REGULATORY_IMPACT");
  }

  return Array.from(new Set(mechanisms));
}

const fleet =
  readJsonSafe(path.join(ROOT, "data/replay/fleet/replay-fleet-manifest-v0.1.json")) || {};

const readiness =
  readJsonSafe(path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json")) || {};

const fleetItems: any[] = fleet.fleet_items || [];

const blockers: string[] = [];

if (readiness.replay_readiness_status !== "ready_for_replay_dry_run") {
  blockers.push("replay_readiness_not_ready");
}

if (!fleetItems.length) blockers.push("missing_fleet_manifest_items");

const readyItems = fleetItems.filter((x) => x.fleet_status === "ready_for_fleet_replay");

if (!readyItems.length) blockers.push("no_ready_fleet_items");

const fleetRunId = `FLEET_RUN_${new Date().toISOString().replace(/[:.]/g, "-")}`;

const caseOutputs: any[] = [];

if (blockers.length === 0) {
  for (const item of readyItems) {
    const input = readJsonSafe(path.join(ROOT, item.input_file));
    const records: any[] = input?.records || [];

    const replayedRecords = records.map((record, index) => {
      const inferred = inferMechanisms(record);

      return {
        replay_record_id: `${item.case_id}_REC_${String(index + 1).padStart(4, "0")}`,
        source_record_id: record.record_id || null,
        metric_name: record.metric_name,
        period: record.period,
        value: record.value,
        direction: record.direction || "unknown",
        source_title: record.source_title,
        evidence_window: record.evidence_window,
        inferred_mechanisms: inferred,
        governance: {
          dry_run_only: true,
          production_write_allowed: false,
          lifecycle_mutation_allowed: false,
          validation_mutation_allowed: false,
        },
      };
    });

    const mechanismCounts: Record<string, number> = {};
    for (const r of replayedRecords) {
      for (const m of r.inferred_mechanisms) {
        mechanismCounts[m] = (mechanismCounts[m] || 0) + 1;
      }
    }

    caseOutputs.push({
      case_id: item.case_id,
      case_label: item.case_label,
      domain: item.domain,
      input_file: item.input_file,
      replay_status: "completed",
      records_supplied: records.length,
      records_replayed: replayedRecords.length,
      records_with_mechanisms: replayedRecords.filter((r) => r.inferred_mechanisms.length > 0).length,
      unique_mechanisms_detected: Object.keys(mechanismCounts).length,
      mechanism_counts: mechanismCounts,
      expected_mechanisms: item.expected_mechanisms || [],
      replayed_records: replayedRecords,
      governance: {
        dry_run_only: true,
        production_records_written: 0,
      },
    });
  }
}

const output = {
  registry_version: "replay-fleet-dry-run-executor-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    fleet_replay_is_dry_run_only: true,
    no_production_mutation: true,
    no_lifecycle_mutation: true,
    no_validation_mutation: true,
    fleet_outputs_require_evaluation: true,
  },
  fleet_run_id: fleetRunId,
  execution_status: blockers.length === 0 ? "fleet_replay_dry_run_completed" : "fleet_replay_blocked",
  blockers,
  inputs: {
    fleet_items: fleetItems.length,
    ready_items: readyItems.length,
  },
  summary: {
    cases_processed: caseOutputs.length,
    cases_completed: caseOutputs.filter((c) => c.replay_status === "completed").length,
    cases_failed: blockers.length > 0 ? readyItems.length : 0,
    total_records_replayed: caseOutputs.reduce((sum, c) => sum + c.records_replayed, 0),
    production_records_written: 0,
  },
  case_outputs: caseOutputs,
};

ensureDir(path.join(ROOT, "data/replay/fleet-runs"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  fleet_run_id: output.fleet_run_id,
  execution_status: output.execution_status,
  summary: output.summary,
  output: "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json",
});

if (blockers.length) {
  console.table(blockers.map((b) => ({ blocker: b })));
} else {
  console.table(
    caseOutputs.map((c) => ({
      case_id: c.case_id,
      domain: c.domain,
      records: c.records_replayed,
      mechanisms: c.unique_mechanisms_detected,
      status: c.replay_status,
    }))
  );
}
