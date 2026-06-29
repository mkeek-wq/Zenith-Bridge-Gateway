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

const dispatch = readJson(DISPATCH_PATH);
const task = dispatch.tasks.find((t: any) => t.smurf_id === "COVERAGE");

if (!task) throw new Error("No Coverage task found.");
if (task.status !== "ready") throw new Error(`Coverage task not ready: ${task.status}`);

const started = new Date();
task.status = "running";
task.started_at = started.toISOString();
writeJson(DISPATCH_PATH, dispatch);

const scripts = [
  "src/scripts/build-dataset-coverage-engine-v0.1.ts",
  "src/scripts/build-coverage-hardening-dashboard-v0.2.ts",
  "src/scripts/build-macro-coverage-assessment-v0.1.ts",
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
    stdout_tail: result.stdout?.slice(-1000) ?? "",
    stderr_tail: result.stderr?.slice(-1000) ?? "",
  };
});

const finished = new Date();
const duration = (finished.getTime() - started.getTime()) / 1000;

task.status = results.every((r) => r.status === "completed") ? "completed" : "failed";
task.finished_at = finished.toISOString();
task.duration_seconds = duration;
task.execution_allowed = true;
task.production_mutation_allowed = false;
task.worker_results = results;

if (task.status === "completed") {
  const completed = new Set(
    dispatch.tasks
      .filter((t: any) => t.status === "completed")
      .map((t: any) => t.smurf_id)
  );

  for (const downstream of dispatch.tasks) {
    if (downstream.status !== "waiting_for_dependencies") continue;

    const internalDependencies = downstream.dependencies.filter(
      (dep: string) => dep !== "PROMOTER"
    );

    if (internalDependencies.every((dep: string) => completed.has(dep))) {
      downstream.status = "ready";
    }
  }
}

writeJson(DISPATCH_PATH, dispatch);

const output = {
  worker_version: "coverage-smurf-task-runner-v0.1",
  generated_at: new Date().toISOString(),
  task_id: task.task_id,
  smurf_id: "COVERAGE",
  status: task.status,
  duration_seconds: duration,
  scripts_run: results.length,
  results,
  governance: {
    coverage_worker_only: true,
    production_mutation_allowed: false,
    downstream_tasks_unlocked: task.status === "completed",
  },
};

writeJson(path.join(ROOT, "data/intelligence/coverage-smurf-task-runner-v0.1.json"), output);

console.log({
  worker_version: output.worker_version,
  status: output.status,
  duration_seconds: output.duration_seconds,
  output: "data/intelligence/coverage-smurf-task-runner-v0.1.json",
});

for (const r of results) {
  console.log(`${r.script} | ${r.status} | exit=${r.exit_code}`);
}
