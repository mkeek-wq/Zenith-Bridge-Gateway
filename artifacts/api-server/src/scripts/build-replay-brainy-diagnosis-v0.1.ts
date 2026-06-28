import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(apiRoot, relativePath), "utf8")
  );
}

const confidence = readJson(
  "data/replay/replay-confidence-engine-v0.1.json"
);

const gaps = readJson(
  "data/replay/replay-mechanism-gap-report-v0.1.json"
);

let mode = "balanced";

if (
  confidence.confidence_score < 0.70 &&
  gaps.gap_count > 20
) {
  mode = "breadth";
} else if (
  confidence.confidence_score >= 0.70 &&
  gaps.gap_count > 20
) {
  mode = "depth";
}

const output = {
  version: "replay-brainy-diagnosis-v0.1",
  generated_at: new Date().toISOString(),
  mode,
  confidence_score: confidence.confidence_score,
  gap_count: gaps.gap_count,
  top_gap_mechanisms: gaps.gaps
    .slice(0, 10)
    .map((g: any) => g.mechanism),
  recommendation:
    mode === "breadth"
      ? "Acquire additional historical cases."
      : mode === "depth"
      ? "Deepen existing historical cases."
      : "Balance breadth and depth."
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-brainy-diagnosis-v0.1.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log(output);
