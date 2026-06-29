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
  const completed = new Set(dispatch.tasks.filter((t: any) => t.status === "completed").map((t: any) => t.smurf_id));
  for (const downstream of dispatch.tasks) {
    if (downstream.status !== "waiting_for_dependencies") continue;
    const deps = downstream.dependencies.filter((d: string) => d !== "PROMOTER");
    if (deps.every((d: string) => completed.has(d))) downstream.status = "ready";
  }
}

const dispatch = readJson(DISPATCH_PATH);
const task = dispatch.tasks.find((t: any) => t.smurf_id === "GRAPH");

if (!task) throw new Error("No Graph task found.");
if (task.status !== "ready") throw new Error(`Graph task not ready: ${task.status}`);

const started = new Date();
task.status = "running";
task.started_at = started.toISOString();
writeJson(DISPATCH_PATH, dispatch);

const scripts = [
  "src/scripts/build-graph-data-package-v0.1.ts",
  "src/scripts/build-graph-specification-package-v0.1.ts",
  "src/scripts/render-graph-specification-v0.3.ts",
];

const results = scripts.map((script) => {
  const result = spawnSync("pnpm", ["tsx", script], { cwd: ROOT, encoding: "utf8" });
  return {
    script,
    status: result.status === 0 ? "completed" : "failed",
    exit_code: result.status,
    stdout_tail: result.stdout?.slice(-1000) ?? "",
    stderr_tail: result.stderr?.slice(-1000) ?? "",
  };
});

const finished = new Date();
task.status = results.every((r) => r.status === "completed") ? "completed" : "failed";
task.finished_at = finished.toISOString();
task.duration_seconds = (finished.getTime() - started.getTime()) / 1000;
task.execution_allowed = true;
task.production_mutation_allowed = false;
task.worker_results = results;

if (task.status === "completed") unlockReadyTasks(dispatch);

writeJson(DISPATCH_PATH, dispatch);

const output = {
  worker_version: "graph-smurf-task-runner-v0.1",
  generated_at: new Date().toISOString(),
  task_id: task.task_id,
  smurf_id: "GRAPH",
  status: task.status,
  duration_seconds: task.duration_seconds,
  results,
};

writeJson(path.join(ROOT, "data/intelligence/graph-smurf-task-runner-v0.1.json"), output);

console.log(output);
for (const r of results) console.log(`${r.script} | ${r.status} | exit=${r.exit_code}`);
