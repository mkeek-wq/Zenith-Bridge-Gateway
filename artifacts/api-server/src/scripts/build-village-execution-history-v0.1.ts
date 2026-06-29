import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(rel: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

function writeJson(rel: string, data: any) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2));
}

const dispatch = readJson("data/intelligence/promoter-task-dispatch-v0.1.json");
if (!dispatch) throw new Error("Missing promoter task dispatch.");

const historyPath = "data/intelligence/village-execution-history-v0.1.json";
const existing = readJson(historyPath);

const previousRuns = Array.isArray(existing?.runs) ? existing.runs : [];

const run = {
  run_id: `VILLAGE_RUN_${new Date().toISOString().replace(/[:.]/g, "-")}`,
  dispatch_id: dispatch.dispatch_id,
  recorded_at: new Date().toISOString(),
  task_count: dispatch.tasks.length,
  completed_count: dispatch.tasks.filter((t: any) => t.status === "completed").length,
  failed_count: dispatch.tasks.filter((t: any) => t.status === "failed").length,
  ready_count: dispatch.tasks.filter((t: any) => t.status === "ready").length,
  waiting_count: dispatch.tasks.filter((t: any) => t.status === "waiting_for_dependencies").length,
  tasks: dispatch.tasks.map((t: any) => ({
    task_id: t.task_id,
    smurf_id: t.smurf_id,
    stage: t.stage,
    status: t.status,
    started_at: t.started_at,
    finished_at: t.finished_at,
    duration_seconds: t.duration_seconds,
    expected_runtime_seconds: t.expected_runtime_seconds,
    yellow_runtime_seconds: t.yellow_runtime_seconds,
    red_runtime_seconds: t.red_runtime_seconds,
    bottleneck_band:
      t.duration_seconds === null || t.duration_seconds === undefined
        ? "not_measured"
        : t.duration_seconds >= t.red_runtime_seconds
          ? "red"
          : t.duration_seconds >= t.yellow_runtime_seconds
            ? "yellow"
            : "green",
  })),
};

const output = {
  history_version: "village-execution-history-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Historian Smurf records village task execution history for Brainy, Papa, bottleneck tracking, and future scaling decisions.",
  run_count: previousRuns.length + 1,
  runs: [...previousRuns, run],
  governance: {
    records_only: true,
    no_execution: true,
    no_production_mutation: true,
  },
};

writeJson(historyPath, output);

console.log({
  history_version: output.history_version,
  run_count: output.run_count,
  latest_run_id: run.run_id,
  output: historyPath,
});

for (const t of run.tasks) {
  console.log(`${t.smurf_id} | ${t.status} | duration=${t.duration_seconds ?? "-"} | bottleneck=${t.bottleneck_band}`);
}

