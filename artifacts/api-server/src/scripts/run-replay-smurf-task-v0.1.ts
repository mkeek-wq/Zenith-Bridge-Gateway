import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const DISPATCH_PATH = path.join(ROOT, "data/intelligence/promoter-task-dispatch-v0.1.json");

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function unlockReadyTasks(dispatch: any) {
  const completed = new Set(
    dispatch.tasks
      .filter((t: any) => t.status === "completed")
      .map((t: any) => t.smurf_id)
  );

  for (const downstream of dispatch.tasks) {
    if (downstream.status !== "waiting_for_dependencies") continue;

    const deps = downstream.dependencies.filter((d: string) => d !== "PROMOTER");

    if (deps.every((d: string) => completed.has(d))) {
      downstream.status = "ready";
    }
  }
}

const dispatch = readJson(DISPATCH_PATH);
const task = dispatch.tasks.find((t: any) => t.smurf_id === "REPLAY");

if (!task) throw new Error("No Replay task found.");
if (task.status !== "ready") throw new Error(`Replay task not ready: ${task.status}`);

const started = new Date();

task.status = "running";
task.started_at = started.toISOString();
writeJson(DISPATCH_PATH, dispatch);

const scripts = [
  "src/scripts/build-replay-readiness-check-v0.1.ts",
  "src/scripts/build-replay-fleet-dry-run-executor-v0.1.ts",
  "src/scripts/build-replay-fleet-evaluation-engine-v0.1.ts",
  "src/scripts/build-replay-calibration-engine-v0.2.ts",
];

const results = scripts.map((script) => {
  const result = spawnSync("pnpm", ["tsx", script], {
    cwd: ROOT,
    encoding: "utf8",
  });

  return {
    script,
    status: result.status === 0 ? "completed" : "failed",
    exit_code: result.status,
    stdout_tail: result.stdout?.slice(-1500) ?? "",
    stderr_tail: result.stderr?.slice(-1500) ?? "",
  };
});

const finished = new Date();

task.status = results.every((r) => r.status === "completed") ? "completed" : "failed";
task.finished_at = finished.toISOString();
task.duration_seconds = (finished.getTime() - started.getTime()) / 1000;
task.execution_allowed = true;
task.production_mutation_allowed = false;
task.worker_results = results;

if (task.status === "completed") {
  unlockReadyTasks(dispatch);
}

writeJson(DISPATCH_PATH, dispatch);

const readiness = fs.existsSync(path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json"))
  ? readJson(path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json"))
  : null;

const fleetRun = fs.existsSync(path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json"))
  ? readJson(path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json"))
  : null;

const fleetEval = fs.existsSync(path.join(ROOT, "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json"))
  ? readJson(path.join(ROOT, "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json"))
  : null;

const calibration = fs.existsSync(path.join(ROOT, "data/replay/replay-calibration-engine-v0.2.json"))
  ? readJson(path.join(ROOT, "data/replay/replay-calibration-engine-v0.2.json"))
  : null;

const output = {
  worker_version: "replay-smurf-task-runner-v0.1",
  generated_at: new Date().toISOString(),
  task_id: task.task_id,
  smurf_id: "REPLAY",
  status: task.status,
  duration_seconds: task.duration_seconds,
  governance: {
    replay_worker_only: true,
    dry_run_only: true,
    production_mutation_allowed: false,
    downstream_tasks_unlocked: task.status === "completed",
  },
  replay_summary: {
    readiness_status: readiness?.replay_readiness_status ?? null,
    fleet_execution_status: fleetRun?.execution_status ?? null,
    cases_processed: fleetRun?.summary?.cases_processed ?? null,
    total_records_replayed: fleetRun?.summary?.total_records_replayed ?? null,
    fleet_quality_score: fleetEval?.summary?.fleet_quality_score ?? null,
    fleet_mechanism_coverage: fleetEval?.summary?.fleet_mechanism_coverage ?? null,
    average_calibration_score: calibration?.summary?.average_calibration_score ?? null,
    mechanisms_calibrated: calibration?.summary?.mechanisms_calibrated ?? null,
  },
  results,
};

writeJson(path.join(ROOT, "data/intelligence/replay-smurf-task-runner-v0.1.json"), output);

console.log({
  worker_version: output.worker_version,
  status: output.status,
  duration_seconds: output.duration_seconds,
  replay_summary: output.replay_summary,
  output: "data/intelligence/replay-smurf-task-runner-v0.1.json",
});

for (const r of results) {
  console.log(`${r.script} | ${r.status} | exit=${r.exit_code}`);
}
