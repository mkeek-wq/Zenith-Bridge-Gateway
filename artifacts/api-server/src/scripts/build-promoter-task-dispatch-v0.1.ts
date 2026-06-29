import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function writeJson(rel: string, data: any) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2));
}

const preview = readJson("data/intelligence/promoter-dispatch-preview-v0.1.json");
const registry = readJson("data/intelligence/smurf-registry-v0.1.json");
const promotion = readJson("data/ingestion/hungry-smurf-promotion-package-v0.2.json");

if (!preview.promotion_allowed) {
  throw new Error("Promotion dispatch not allowed.");
}

const dispatchId = `DSP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;

const tasks = preview.wake_plan.map((wake: any, index: number) => {
  const smurf = registry.smurfs.find((s: any) => s.smurf_id === wake.smurf_id);

  return {
    task_id: `${dispatchId}-TASK-${String(index + 1).padStart(3, "0")}`,
    dispatch_id: dispatchId,
    smurf_id: wake.smurf_id,
    smurf_name: wake.name,
    stage: wake.stage,
    parallel_group: wake.parallel_group,
    dependencies: wake.dependencies,
    status: wake.stage === 1 ? "ready" : "waiting_for_dependencies",
    trigger_event: "dataset_promoted",
    dataset_count: promotion.staged_count,
    assigned_worker: null,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
    duration_seconds: null,
    expected_runtime_seconds: smurf?.scaling?.expected_runtime_seconds ?? null,
    yellow_runtime_seconds: smurf?.scaling?.yellow_runtime_seconds ?? null,
    red_runtime_seconds: smurf?.scaling?.red_runtime_seconds ?? null,
    scaling: smurf?.scaling ?? null,
    outputs_expected: smurf?.outputs ?? [],
    production_mutation_allowed: false,
    execution_allowed: false,
  };
});

const output = {
  dispatch_version: "promoter-task-dispatch-v0.1",
  dispatch_id: dispatchId,
  generated_at: new Date().toISOString(),
  purpose: "Creates queued downstream Smurf tasks after human-approved promotion. Does not execute tasks.",
  source_preview: "data/intelligence/promoter-dispatch-preview-v0.1.json",
  source_registry: "data/intelligence/smurf-registry-v0.1.json",
  task_count: tasks.length,
  tasks,
  governance: {
    dispatch_only: true,
    production_mutation_allowed: false,
    execution_allowed: false,
    papa_approval_required_for_execution: true,
  },
};

writeJson("data/intelligence/promoter-task-dispatch-v0.1.json", output);

console.log({
  dispatch_version: output.dispatch_version,
  dispatch_id: dispatchId,
  task_count: output.task_count,
  output: "data/intelligence/promoter-task-dispatch-v0.1.json",
});

for (const t of tasks) {
  console.log(`${t.task_id} | ${t.smurf_id} | stage=${t.stage} | ${t.status}`);
}
