import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function writeJson(rel: string, data: any) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2));
}

const dispatch = readJson("data/intelligence/promoter-task-dispatch-v0.1.json");

const tasks = dispatch.tasks || [];

const healthTasks = tasks.map((task: any) => {
  let bottleneck_risk = "none";

  if (task.status === "running" && task.duration_seconds !== null) {
    if (task.duration_seconds >= task.red_runtime_seconds) bottleneck_risk = "red";
    else if (task.duration_seconds >= task.yellow_runtime_seconds) bottleneck_risk = "yellow";
  }

  return {
    task_id: task.task_id,
    smurf_id: task.smurf_id,
    stage: task.stage,
    status: task.status,
    expected_runtime_seconds: task.expected_runtime_seconds,
    duration_seconds: task.duration_seconds,
    bottleneck_risk,
    parallelizable: task.scaling?.parallelizable ?? null,
    parallel_unit: task.scaling?.parallel_unit ?? null,
    scale_strategy: task.scaling?.scale_strategy ?? null,
  };
});

const output = {
  health_version: "village-task-health-v0.1",
  generated_at: new Date().toISOString(),
  dispatch_id: dispatch.dispatch_id,
  task_count: healthTasks.length,
  ready_count: healthTasks.filter((t: any) => t.status === "ready").length,
  waiting_count: healthTasks.filter((t: any) => t.status === "waiting_for_dependencies").length,
  running_count: healthTasks.filter((t: any) => t.status === "running").length,
  completed_count: healthTasks.filter((t: any) => t.status === "completed").length,
  failed_count: healthTasks.filter((t: any) => t.status === "failed").length,
  bottleneck_yellow_count: healthTasks.filter((t: any) => t.bottleneck_risk === "yellow").length,
  bottleneck_red_count: healthTasks.filter((t: any) => t.bottleneck_risk === "red").length,
  tasks: healthTasks,
  governance: {
    health_report_only: true,
    execution_allowed: false,
    bottleneck_policy: "split parallelizable jobs first, add worker or VPS capacity second, redesign last",
  },
};

writeJson("data/intelligence/village-task-health-v0.1.json", output);

console.log({
  health_version: output.health_version,
  dispatch_id: output.dispatch_id,
  ready_count: output.ready_count,
  waiting_count: output.waiting_count,
  completed_count: output.completed_count,
  failed_count: output.failed_count,
  output: "data/intelligence/village-task-health-v0.1.json",
});

for (const t of healthTasks) {
  console.log(`${t.smurf_id} | stage=${t.stage} | ${t.status} | bottleneck=${t.bottleneck_risk}`);
}
