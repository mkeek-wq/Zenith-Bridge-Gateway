import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const historyPath = path.join(
  apiRoot,
  "data/replay/history/replay-improvement-history-v0.1.json"
);

const history = JSON.parse(
  fs.readFileSync(historyPath, "utf8")
);

const latest = history[history.length - 1];
const previous = history[history.length - 2];

let report: any = {
  version: "replay-improvement-report-v0.1",
  generated_at: new Date().toISOString(),
  snapshot_count: history.length
};

if (previous) {
  report = {
    ...report,
    confidence_delta:
      latest.confidence_score -
      previous.confidence_score,
    case_delta:
      latest.historical_case_count -
      previous.historical_case_count,
    mechanism_delta:
      latest.unique_mechanism_count -
      previous.unique_mechanism_count
  };
} else {
  report = {
    ...report,
    message:
      "Only one snapshot available. Awaiting future comparison."
  };
}

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-improvement-report-v0.1.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2)
);

console.log(report);
