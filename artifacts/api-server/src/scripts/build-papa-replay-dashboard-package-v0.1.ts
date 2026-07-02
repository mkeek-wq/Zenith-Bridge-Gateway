import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const quality = readJson("data/replay/replay-quality-summary-v0.1.json");
const analogue = readJson("data/replay/replay-analogue-summary-v0.1.json");
const explanation = readJson("data/replay/replay-explanation-summary-v0.1.json");

const output = {
  version: "papa-replay-dashboard-package-v0.1",
  generated_at: new Date().toISOString(),
  replay_status: quality.dashboard_status,
  historical_case_count: quality.historical_case_count,
  unique_mechanism_count: quality.unique_mechanism_count,
  thin_mechanism_count: quality.thin_mechanism_count,
  very_thin_mechanism_count: quality.very_thin_mechanism_count,
  taxonomy_aware: analogue.taxonomy_aware,
  replay_record_count: analogue.replay_record_count,
  top_analogues: analogue.top_analogues,
  explanations: explanation.explanations,
  next_target: quality.next_target
};

const outputPath = path.join(
  apiRoot,
  "data/replay/papa-replay-dashboard-package-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
