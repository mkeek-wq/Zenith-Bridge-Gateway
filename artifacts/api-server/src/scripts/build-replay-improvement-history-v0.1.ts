import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(apiRoot, relativePath), "utf8")
  );
}

const quality = readJson(
  "data/replay/replay-quality-summary-v0.1.json"
);

const confidence = readJson(
  "data/replay/replay-confidence-engine-v0.1.json"
);

const historyPath = path.join(
  apiRoot,
  "data/replay/history/replay-improvement-history-v0.1.json"
);

let history: any[] = [];

if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
}

const snapshot = {
  snapshot_id: `REPLAY_HIST_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`,
  created_at: new Date().toISOString(),
  historical_case_count: quality.historical_case_count,
  unique_mechanism_count: quality.unique_mechanism_count,
  confidence_score: confidence.confidence_score,
  confidence_band: confidence.confidence_band
};

history.push(snapshot);

fs.writeFileSync(
  historyPath,
  JSON.stringify(history, null, 2)
);

console.log({
  snapshots: history.length,
  latest_confidence: snapshot.confidence_score
});
