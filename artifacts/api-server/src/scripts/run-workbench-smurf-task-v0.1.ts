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
const task = dispatch.tasks.find((t: any) => t.smurf_id === "WORKBENCH");

if (!task) throw new Error("No Workbench task found.");
if (task.status !== "ready") throw new Error(`Workbench task not ready: ${task.status}`);

const completed = new Set(
  dispatch.tasks
    .filter((t: any) => t.status === "completed")
    .map((t: any) => t.smurf_id)
);

const requiredDeps = task.dependencies.filter((d: string) => d !== "PROMOTER");
const missingDeps = requiredDeps.filter((d: string) => !completed.has(d));

if (missingDeps.length > 0) {
  throw new Error(`Workbench dependencies not completed: ${missingDeps.join(", ")}`);
}

const started = new Date();
task.status = "running";
task.started_at = started.toISOString();
writeJson(DISPATCH_PATH, dispatch);

const scripts = [
  "src/scripts/build-article-workbench-package-v0.2.ts",
  "src/scripts/build-interpretation-workbench-package-v0.1.ts",
  "src/scripts/build-graph-data-workbench-package-v0.1.ts",
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

writeJson(DISPATCH_PATH, dispatch);

const output = {
  worker_version: "workbench-smurf-task-runner-v0.1",
  generated_at: new Date().toISOString(),
  task_id: task.task_id,
  smurf_id: "WORKBENCH",
  status: task.status,
  duration_seconds: task.duration_seconds,
  dependencies_verified: true,
  dependencies_required: requiredDeps,
  governance: {
    workbench_worker_only: true,
    production_mutation_allowed: false,
  },
  results,
};

writeJson(path.join(ROOT, "data/intelligence/workbench-smurf-task-runner-v0.1.json"), output);

console.log({
  worker_version: output.worker_version,
  status: output.status,
  duration_seconds: output.duration_seconds,
  output: "data/intelligence/workbench-smurf-task-runner-v0.1.json",
});

for (const r of results) {
  console.log(`${r.script} | ${r.status} | exit=${r.exit_code}`);
}
