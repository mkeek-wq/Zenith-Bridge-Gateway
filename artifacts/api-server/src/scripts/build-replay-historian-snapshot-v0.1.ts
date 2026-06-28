import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const quality = readJson("data/replay/replay-quality-summary-v0.1.json");
const confidence = readJson("data/replay/replay-confidence-engine-v0.1.json");
const envelope = readJson("data/replay/replay-forecast-envelope-v0.1.json");

const output = {
  version: "replay-historian-snapshot-v0.1",
  generated_at: new Date().toISOString(),
  subsystem: "Replay",
  status: "early_learning",
  historical_case_count: quality.historical_case_count,
  unique_mechanism_count: quality.unique_mechanism_count,
  confidence_score: confidence.confidence_score,
  confidence_band: confidence.confidence_band,
  envelope_count: envelope.envelope_count,
  doctrine: envelope.doctrine,
  next_target: quality.next_target
};

const outputPath = path.join(apiRoot, "data/replay/replay-historian-snapshot-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
