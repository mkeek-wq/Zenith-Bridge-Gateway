import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const matrix =
  readJsonSafe(path.join(ROOT, "data/intelligence/replay-mechanism-evidence-matrix-v0.1.json")) || {};

const confidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const matrixSummaries: any[] = matrix.mechanism_summaries || [];
const confidenceItems: any[] = confidence.mechanism_confidence_items || [];

const supportItems = matrixSummaries.map((m) => {
  const confidenceItem = confidenceItems.find((c) => c.mechanism_id === m.mechanism_id) || {};

  const historicalRows = Number(m.historical_rows ?? 0);
  const supportRatio = Number(m.support_ratio ?? 0);
  const avgReplaySupport = Number(m.average_replay_support_score ?? 0);
  const contradictingCases = Number(m.contradicting_cases ?? 0);
  const currentConfidence = Number(confidenceItem.adjusted_confidence_score ?? 0);

  const coverageScore = clamp(historicalRows / 20);
  const contradictionPenalty = clamp(contradictingCases / Math.max(historicalRows, 1));

  const replay_support_score = clamp(
    supportRatio * 0.35 +
      avgReplaySupport * 0.3 +
      coverageScore * 0.2 +
      currentConfidence * 0.15 -
      contradictionPenalty * 0.25
  );

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: m.lifecycle_status,
    replay_support_score: Number(replay_support_score.toFixed(3)),
    replay_support_band:
      replay_support_score >= 0.75
        ? "strong_replay_support"
        : replay_support_score >= 0.55
          ? "moderate_replay_support"
          : replay_support_score >= 0.35
            ? "weak_replay_support"
            : "insufficient_replay_support",
    components: {
      historical_rows: historicalRows,
      supporting_cases: Number(m.supporting_cases ?? 0),
      contradicting_cases: contradictingCases,
      neutral_cases: Number(m.neutral_cases ?? 0),
      support_ratio: Number(supportRatio.toFixed(3)),
      average_replay_support_score: Number(avgReplaySupport.toFixed(3)),
      coverage_score: Number(coverageScore.toFixed(3)),
      contradiction_penalty: Number(contradictionPenalty.toFixed(3)),
      current_confidence_score: Number(currentConfidence.toFixed(3)),
    },
    interpretation:
      replay_support_score >= 0.55
        ? "Replay evidence supports continued monitoring and possible review, but does not validate the mechanism."
        : "Replay support is limited or mixed. Mechanism should remain cautious.",
    governance: {
      replay_support_is_not_validation: true,
      historical_similarity_must_never_override_current_evidence: true,
      human_review_required_for_lifecycle_change: true,
    },
  };
});

const output = {
  registry_version: "replay-support-engine-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_support_is_probabilistic_not_deterministic: true,
    replay_support_is_not_validation: true,
    historical_similarity_must_never_override_current_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    matrix_summaries: matrixSummaries.length,
    confidence_items: confidenceItems.length,
  },
  summary: {
    mechanisms_processed: supportItems.length,
    strong_replay_support: supportItems.filter((x) => x.replay_support_band === "strong_replay_support").length,
    moderate_replay_support: supportItems.filter((x) => x.replay_support_band === "moderate_replay_support").length,
    weak_replay_support: supportItems.filter((x) => x.replay_support_band === "weak_replay_support").length,
    insufficient_replay_support: supportItems.filter((x) => x.replay_support_band === "insufficient_replay_support").length,
    average_replay_support_score: Number(avg(supportItems.map((x) => x.replay_support_score)).toFixed(3)),
  },
  replay_support_items: supportItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/replay-support-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/replay-support-engine-v0.2.json",
});

console.table(
  supportItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    score: x.replay_support_score,
    band: x.replay_support_band,
    rows: x.components.historical_rows,
    support_ratio: x.components.support_ratio,
    contradict: x.components.contradicting_cases,
  }))
);
