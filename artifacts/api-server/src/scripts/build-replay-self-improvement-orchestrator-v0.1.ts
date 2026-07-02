import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

function readJsonIfExists(relativePath: string) {
  const fullPath = path.join(apiRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const confidence = readJson("data/replay/replay-confidence-engine-v0.1.json");
const brainy = readJsonIfExists("data/replay/replay-brainy-diagnosis-v0.1.json");
const proposals = readJsonIfExists("data/replay/replay-improvement-proposals-v0.1.json");
const governance = readJsonIfExists("data/replay/replay-governance-history-v0.1.json");
const improvementReport = readJsonIfExists("data/replay/replay-improvement-report-v0.1.json");

const confidenceScore = confidence.confidence_score ?? 0;
const confidenceBand = confidence.confidence_band ?? "unknown";
const proposalCount = proposals?.proposal_count ?? proposals?.proposals?.length ?? 0;
const awaitingPapa = governance?.summary?.awaiting_papa_approval ?? null;
const confidenceDelta = improvementReport?.confidence_delta ?? null;

const recommendedMode =
  confidenceScore < 0.6
    ? "breadth_acquisition"
    : confidenceScore < 0.8
      ? "targeted_enrichment"
      : "controlled_depth_improvement";

const nextActions = [];

if (confidenceScore < 0.6) {
  nextActions.push("Acquire additional historical cases before relying on replay outputs.");
}

if (proposalCount > 0) {
  nextActions.push("Review improvement proposals and approve selected safe candidates.");
}

if (awaitingPapa && awaitingPapa > 0) {
  nextActions.push("Papa approval queue requires review before shadow execution can expand.");
}

if (typeof confidenceDelta === "number" && confidenceDelta < 0) {
  nextActions.push("Investigate confidence decline and identify missing analogue coverage.");
}

if (nextActions.length === 0) {
  nextActions.push("Continue monitored replay cycle and preserve governance history.");
}

const orchestrator = {
  version: "replay-self-improvement-orchestrator-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "The self-improvement orchestrator recommends the next safe replay improvement mode without writing to production.",
  safety_mode: "SAFE_PARTIAL_EXECUTION",
  production_write_allowed: false,
  current_state: {
    confidence_score: confidenceScore,
    confidence_band: confidenceBand,
    brainy_mode: brainy?.mode ?? brainy?.diagnosis_mode ?? null,
    proposal_count: proposalCount,
    awaiting_papa_approval: awaitingPapa,
    confidence_delta: confidenceDelta,
  },
  recommended_mode: recommendedMode,
  next_actions: nextActions,
  required_human_gate:
    "Papa must approve any production-impacting replay improvement before promotion.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-self-improvement-orchestrator-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(orchestrator, null, 2));

console.log({
  output: outputPath,
  recommended_mode: orchestrator.recommended_mode,
  next_actions: orchestrator.next_actions.length,
});
