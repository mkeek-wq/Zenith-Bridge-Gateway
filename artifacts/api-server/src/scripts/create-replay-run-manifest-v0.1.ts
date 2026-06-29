import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const now = new Date();
const replayRunId = `REPLAY_RUN_${now.toISOString().replace(/[:.]/g, "-")}`;

const manifest = {
  manifest_version: "replay-run-manifest-v0.1",
  created_at: now.toISOString(),
  replay_run_id: replayRunId,
  replay_status: "manifest_created_not_executed",
  replay_mode: "dry_run_only",
  production_mutation_allowed: false,
  scope: {
    replay_scope: "single_case",
    country: "SG",
    historical_period_start: "2020-01",
    historical_period_end: "2021-12",
    case_label: "Singapore Manufacturing Recovery Replay Pilot",
    target_domain: "manufacturing_macro_recovery"
  },
  input: {
    input_file: "data/replay/input/replay-input-sg-manufacturing-recovery-v0.1.json",
    expected_min_records: 1,
    expected_max_records: 100
  },
  limits: {
    max_records: 100,
    max_mechanisms: 10,
    max_contradictions: 25,
    max_discoveries: 10
  },
  throttle: {
    enabled: true,
    max_parallel_cases: 1,
    pause_ms_between_records: 50
  },
  governance: {
    human_approval_required_for_large_replay: true,
    output_snapshot_required: true,
    dry_run_only: true,
    no_production_write: true,
    no_lifecycle_mutation: true,
    no_validation_mutation: true
  }
};

ensureDir(path.join(ROOT, "data/replay/run-manifests"));
ensureDir(path.join(ROOT, "data/replay/input"));
ensureDir(path.join(ROOT, "data/replay/output"));
ensureDir(path.join(ROOT, "data/replay/evaluations"));

const manifestPath = path.join(
  ROOT,
  "data/replay/run-manifests",
  `${replayRunId}.json`
);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log({
  manifest_version: manifest.manifest_version,
  replay_run_id: manifest.replay_run_id,
  replay_mode: manifest.replay_mode,
  replay_status: manifest.replay_status,
  output: `data/replay/run-manifests/${replayRunId}.json`
});

console.log("\nNext input file expected:");
console.log(manifest.input.input_file);
