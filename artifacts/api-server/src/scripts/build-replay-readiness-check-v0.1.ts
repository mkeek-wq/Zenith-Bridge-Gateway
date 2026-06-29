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

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function countJsonFiles(relativePath: string): number {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return 0;
  return fs.readdirSync(full).filter((f) => f.endsWith(".json")).length;
}

ensureDir(path.join(ROOT, "data/replay"));
ensureDir(path.join(ROOT, "data/replay/input"));
ensureDir(path.join(ROOT, "data/replay/output"));
ensureDir(path.join(ROOT, "data/replay/run-manifests"));
ensureDir(path.join(ROOT, "data/replay/snapshots"));
ensureDir(path.join(ROOT, "data/replay/rejected"));

const maintenance =
  readJsonSafe(path.join(ROOT, "data/maintenance/maintenance-report-generator-v0.1.json")) || {};

const moduleRegistry =
  readJsonSafe(path.join(ROOT, "data/maintenance/module-registry-v0.1.json")) || {};

const compatibility =
  readJsonSafe(path.join(ROOT, "data/maintenance/compatibility-check-engine-v0.1.json")) || {};

const replayConfigPath = "data/replay/replay-run-config-v0.1.json";

if (!exists(replayConfigPath)) {
  const defaultConfig = {
    config_version: "replay-run-config-v0.1",
    created_at: new Date().toISOString(),
    replay_mode: "dry_run_only",
    production_mutation_allowed: false,
    max_cases_per_run: 25,
    max_records_per_case: 250,
    throttle: {
      enabled: true,
      pause_ms_between_cases: 250,
      max_parallel_cases: 1
    },
    allowed_replay_scopes: [
      "single_case",
      "small_batch",
      "historical_window"
    ],
    governance: {
      human_review_required_before_large_replay: true,
      output_snapshot_required: true,
      rollback_required: true
    }
  };

  fs.writeFileSync(
    path.join(ROOT, replayConfigPath),
    JSON.stringify(defaultConfig, null, 2)
  );
}

const replayConfig = readJsonSafe(path.join(ROOT, replayConfigPath)) || {};

const checks = [
  {
    check_id: "MAINTENANCE_COMPATIBILITY",
    passed: maintenance.summary?.safe_for_standard_operations === true,
    detail: "General maintenance compatibility must be clean."
  },
  {
    check_id: "MODULE_REGISTRY_PRESENT",
    passed: Boolean(moduleRegistry.modules?.length),
    detail: "Module registry must exist."
  },
  {
    check_id: "COMPATIBILITY_CHECK_PRESENT",
    passed: compatibility.summary?.system_compatibility === "compatible_for_standard_operations",
    detail: "Compatibility check must allow standard operations."
  },
  {
    check_id: "REPLAY_CONFIG_PRESENT",
    passed: Boolean(replayConfig.config_version),
    detail: "Replay run config must exist."
  },
  {
    check_id: "REPLAY_DRY_RUN_MODE",
    passed: replayConfig.replay_mode === "dry_run_only",
    detail: "Replay must begin in dry_run_only mode."
  },
  {
    check_id: "PRODUCTION_MUTATION_BLOCKED",
    passed: replayConfig.production_mutation_allowed === false,
    detail: "Replay must not mutate production evidence."
  },
  {
    check_id: "THROTTLE_ENABLED",
    passed: replayConfig.throttle?.enabled === true && replayConfig.throttle?.max_parallel_cases === 1,
    detail: "Replay should start throttled and single-threaded."
  },
  {
    check_id: "RUN_LIMITS_PRESENT",
    passed:
      Number(replayConfig.max_cases_per_run ?? 0) > 0 &&
      Number(replayConfig.max_records_per_case ?? 0) > 0,
    detail: "Replay must have run-size limits."
  },
  {
    check_id: "REPLAY_DIRECTORIES_PRESENT",
    passed:
      exists("data/replay/input") &&
      exists("data/replay/output") &&
      exists("data/replay/run-manifests") &&
      exists("data/replay/snapshots") &&
      exists("data/replay/rejected"),
    detail: "Replay directory structure must exist."
  },
  {
    check_id: "PRE_INGESTION_BASELINE_EXISTS",
    passed: countJsonFiles("data/ingestion/pre-ingestion-snapshots") > 0,
    detail: "A baseline snapshot should exist before replay runs."
  }
];

const failedChecks = checks.filter((c) => !c.passed);

const memory = {
  total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
  free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
  free_memory_ratio: Number((os.freemem() / os.totalmem()).toFixed(3))
};

const replayReadinessStatus =
  failedChecks.length === 0
    ? "ready_for_replay_dry_run"
    : "not_ready_for_replay";

const output = {
  registry_version: "replay-readiness-check-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_readiness_is_run_specific: true,
    replay_starts_as_dry_run_only: true,
    production_mutation_forbidden: true,
    throttle_before_scale: true,
    rollback_before_replay: true
  },
  replay_readiness_status: replayReadinessStatus,
  replay_config: replayConfig,
  system_status: {
    platform: os.platform(),
    load_average: os.loadavg(),
    memory
  },
  inputs: {
    module_registry_modules: moduleRegistry.modules?.length ?? 0,
    maintenance_safe_for_standard_operations: maintenance.summary?.safe_for_standard_operations ?? false,
    compatibility_status: compatibility.summary?.system_compatibility ?? "unknown",
    replay_input_files: countJsonFiles("data/replay/input"),
    replay_run_manifests: countJsonFiles("data/replay/run-manifests"),
    replay_snapshots: countJsonFiles("data/replay/snapshots")
  },
  summary: {
    checks_total: checks.length,
    checks_passed: checks.filter((c) => c.passed).length,
    checks_failed: failedChecks.length,
    max_cases_per_run: replayConfig.max_cases_per_run ?? null,
    max_records_per_case: replayConfig.max_records_per_case ?? null,
    max_parallel_cases: replayConfig.throttle?.max_parallel_cases ?? null
  },
  checks,
  failed_checks: failedChecks,
  recommendation:
    replayReadinessStatus === "ready_for_replay_dry_run"
      ? "Replay dry-run preparation is allowed. Start with one small replay manifest only."
      : "Do not start replay. Resolve failed replay readiness checks first."
};

ensureDir(path.join(ROOT, "data/replay"));
ensureDir(path.join(ROOT, "data/maintenance"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  replay_readiness_status: output.replay_readiness_status,
  summary: output.summary,
  output: "data/replay/replay-readiness-check-v0.1.json"
});

console.table(
  checks.map((c) => ({
    check: c.check_id,
    passed: c.passed,
    detail: c.detail
  }))
);
