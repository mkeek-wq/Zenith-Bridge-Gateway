import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const confidencePath = path.join(
  apiRoot,
  "data/replay/replay-confidence-engine-v0.1.json"
);

const historyPath = path.join(
  apiRoot,
  "data/replay/replay-confidence-history-v0.1.json"
);

const confidence = JSON.parse(fs.readFileSync(confidencePath, "utf8"));

const history = fs.existsSync(historyPath)
  ? JSON.parse(fs.readFileSync(historyPath, "utf8"))
  : {
      version: "replay-confidence-history-v0.1",
      created_at: new Date().toISOString(),
      entries: []
    };

const entry = {
  recorded_at: new Date().toISOString(),
  confidence_score: confidence.confidence_score,
  confidence_band: confidence.confidence_band,
  historical_case_count: confidence.drivers?.historical_case_count,
  unique_mechanism_count: confidence.drivers?.unique_mechanism_count,
  average_analogue_score: confidence.drivers?.average_analogue_score,
  taxonomy_aware: confidence.drivers?.taxonomy_aware
};

history.entries.push(entry);
history.updated_at = new Date().toISOString();
history.entry_count = history.entries.length;

fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

console.log({
  history: history.version,
  entry_count: history.entry_count,
  latest_confidence_score: entry.confidence_score,
  latest_confidence_band: entry.confidence_band,
  output: historyPath
});
