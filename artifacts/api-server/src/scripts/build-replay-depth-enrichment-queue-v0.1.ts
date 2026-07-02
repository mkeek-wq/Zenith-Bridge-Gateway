import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const audit = readJson("data/replay/depth/replay-case-depth-audit-v0.1.json");
const brainy = readJson("data/replay/replay-brainy-diagnosis-v0.1.json");

const priorityMechanisms = new Set(brainy.top_gap_mechanisms ?? []);

function priorityScore(item: any): number {
  const missingScore = item.missing_field_count ?? 0;
  const mechanismScore = item.mechanism_count ?? 0;
  return missingScore + mechanismScore;
}

const queue = (audit.cases ?? [])
  .filter((item: any) => item.missing_field_count > 0)
  .slice(0, 25)
  .map((item: any, index: number) => ({
    queue_id: `REPLAY_DEPTH_${String(index + 1).padStart(3, "0")}`,
    case_id: item.case_id,
    title: item.title,
    region: item.region,
    sector: item.sector,
    current_depth_score: item.depth_score,
    missing_field_count: item.missing_field_count,
    missing_fields: item.missing_fields,
    priority_score: priorityScore(item),
    status: "candidate_for_depth_enrichment"
  }))
  .sort((a: any, b: any) => b.priority_score - a.priority_score);

const output = {
  version: "replay-depth-enrichment-queue-v0.1",
  generated_at: new Date().toISOString(),
  brainy_mode: brainy.mode,
  brainy_recommendation: brainy.recommendation,
  queue_count: queue.length,
  queue
};

const outputPath = path.join(apiRoot, "data/replay/depth/replay-depth-enrichment-queue-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  depth_queue: output.version,
  brainy_mode: output.brainy_mode,
  queue_count: output.queue_count,
  output: outputPath
});
