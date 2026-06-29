import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function writeJson(rel: string, data: any) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2));
}

function avg(values: number[]) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return null;
  return Number((clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(3));
}

const history = readJson("data/intelligence/village-execution-history-v0.1.json");
const tasks = history.runs.flatMap((run: any) =>
  run.tasks.map((task: any) => ({
    ...task,
    run_id: run.run_id,
    dispatch_id: run.dispatch_id,
    recorded_at: run.recorded_at,
  }))
);

const smurfIds = Array.from(new Set(tasks.map((t: any) => t.smurf_id)));

const smurf_summary = smurfIds.map((smurf_id) => {
  const rows = tasks.filter((t: any) => t.smurf_id === smurf_id);
  const durations = rows.map((r: any) => Number(r.duration_seconds)).filter((n: number) => Number.isFinite(n));

  return {
    smurf_id,
    observations: rows.length,
    completed: rows.filter((r: any) => r.status === "completed").length,
    failed: rows.filter((r: any) => r.status === "failed").length,
    ready: rows.filter((r: any) => r.status === "ready").length,
    waiting: rows.filter((r: any) => r.status === "waiting_for_dependencies").length,
    avg_duration_seconds: avg(durations),
    max_duration_seconds: durations.length ? Math.max(...durations) : null,
    yellow_bottlenecks: rows.filter((r: any) => r.bottleneck_band === "yellow").length,
    red_bottlenecks: rows.filter((r: any) => r.bottleneck_band === "red").length,
  };
});

const output = {
  summary_version: "historian-smurf-summary-v0.1",
  generated_at: new Date().toISOString(),
  history_source: "data/intelligence/village-execution-history-v0.1.json",
  run_count: history.run_count,
  smurf_count: smurf_summary.length,
  smurf_summary,
  governance: {
    summary_only: true,
    used_by_brainy: true,
    production_mutation_allowed: false,
  },
};

writeJson("data/intelligence/historian-smurf-summary-v0.1.json", output);

console.log({
  summary_version: output.summary_version,
  run_count: output.run_count,
  smurf_count: output.smurf_count,
  output: "data/intelligence/historian-smurf-summary-v0.1.json",
});

for (const s of smurf_summary) {
  console.log(`${s.smurf_id} | completed=${s.completed} | failed=${s.failed} | avg=${s.avg_duration_seconds ?? "-"}`);
}
