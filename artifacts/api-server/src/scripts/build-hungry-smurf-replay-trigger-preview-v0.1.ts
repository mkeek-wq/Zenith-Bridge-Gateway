import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const gate = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-promotion-gate-v0.1.json"));

const triggers = (gate.staged_items || []).map((item: any) => ({
  dataset_id: item.dataset_id,
  coverage_start: item.coverage_start,
  coverage_end: item.coverage_end,
  values_count: item.values_count,
  trigger_status: "preview_only",
  downstream_candidates: {
    signal_scan: true,
    dataset_coverage_refresh: true,
    article_workbench_refresh: true,
    replay_refresh: true,
    graph_refresh: true
  }
}));

const output = {
  preview_version: "hungry-smurf-replay-trigger-preview-v0.1",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  source_gate: "data/ingestion/hungry-smurf-promotion-gate-v0.1.json",
  gate_decision: gate.decision,
  trigger_count: triggers.length,
  triggers,
  governance: {
    replay_execution_allowed: false,
    preview_only: true,
    requires_promotion_before_execution: true
  }
};

const outPath = path.join(ROOT, "data/intelligence/hungry-smurf-replay-trigger-preview-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  preview_version: output.preview_version,
  gate_decision: output.gate_decision,
  trigger_count: output.trigger_count,
  output: path.relative(ROOT, outPath)
});
