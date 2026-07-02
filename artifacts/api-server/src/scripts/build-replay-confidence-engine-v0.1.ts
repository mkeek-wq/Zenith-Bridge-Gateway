import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const quality = readJson("data/replay/replay-quality-summary-v0.1.json");
const dashboard = readJson("data/replay/papa-replay-dashboard-package-v0.1.json");
const envelope = readJson("data/replay/replay-forecast-envelope-v0.1.json");

const analogueScores = (dashboard.top_analogues ?? [])
  .map((a: any) => a.similarity_score)
  .filter((v: any) => typeof v === "number");

const avgAnalogueScore =
  analogueScores.reduce((a: number, b: number) => a + b, 0) /
  Math.max(analogueScores.length, 1);

const caseDepthScore = Math.min((quality.historical_case_count ?? 0) / 25, 1);
const mechanismDepthScore = Math.min((quality.unique_mechanism_count ?? 0) / 25, 1);
const taxonomyScore = dashboard.taxonomy_aware ? 1 : 0;

const confidence =
  avgAnalogueScore * 0.45 +
  caseDepthScore * 0.25 +
  mechanismDepthScore * 0.2 +
  taxonomyScore * 0.1;

function confidenceBand(score: number) {
  if (score >= 0.75) return "strong";
  if (score >= 0.5) return "moderate";
  if (score >= 0.25) return "early";
  return "weak";
}

const output = {
  version: "replay-confidence-engine-v0.1",
  generated_at: new Date().toISOString(),
  confidence_score: Number(confidence.toFixed(3)),
  confidence_band: confidenceBand(confidence),
  drivers: {
    average_analogue_score: Number(avgAnalogueScore.toFixed(3)),
    historical_case_count: quality.historical_case_count,
    case_depth_score: Number(caseDepthScore.toFixed(3)),
    unique_mechanism_count: quality.unique_mechanism_count,
    mechanism_depth_score: Number(mechanismDepthScore.toFixed(3)),
    taxonomy_aware: dashboard.taxonomy_aware,
    taxonomy_score: taxonomyScore,
    envelope_count: envelope.envelope_count
  },
  interpretation: "Replay confidence is an internal quality indicator, not a prediction accuracy claim."
};

const outputPath = path.join(apiRoot, "data/replay/replay-confidence-engine-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
