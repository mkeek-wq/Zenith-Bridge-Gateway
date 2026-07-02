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

const confidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const linker =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json")) || {};

const experience =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-registry-v0.2.json")) ||
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-registry-v0.1.json")) ||
  {};

const outcomes =
  readJsonSafe(path.join(ROOT, "data/intelligence/historical-outcomes-v0.2.json")) ||
  readJsonSafe(path.join(ROOT, "data/intelligence/historical-outcomes-v0.1.json")) ||
  {};

const mechanismConfidenceItems: any[] = confidence.mechanism_confidence_items || [];
const mechanismSummaries: any[] = linker.mechanism_summaries || [];
const experienceItems: any[] =
  experience.experience_items ||
  experience.experiences ||
  experience.items ||
  [];

const outcomeItems: any[] =
  outcomes.historical_outcomes ||
  outcomes.outcomes ||
  outcomes.items ||
  [];

function inferHistoricalSupport(mechanismId: string): number {
  const id = mechanismId.toLowerCase();

  const combinedText = JSON.stringify([...experienceItems, ...outcomeItems]).toLowerCase();

  let score = 0.25;

  if (id.includes("mkt_002")) {
    if (combinedText.includes("inventory")) score += 0.25;
    if (combinedText.includes("restocking")) score += 0.2;
    if (combinedText.includes("manufacturing")) score += 0.15;
    if (combinedText.includes("electronics") || combinedText.includes("semiconductor")) score += 0.15;
  }

  if (id.includes("mkt_006")) {
    if (combinedText.includes("policy")) score += 0.25;
    if (combinedText.includes("regulatory")) score += 0.2;
    if (combinedText.includes("government")) score += 0.15;
    if (combinedText.includes("incentive")) score += 0.15;
  }

  if (id.includes("mkt_010")) {
    if (combinedText.includes("demand")) score += 0.25;
    if (combinedText.includes("exports")) score += 0.2;
    if (combinedText.includes("trade")) score += 0.15;
    if (combinedText.includes("downturn") || combinedText.includes("shock")) score += 0.15;
  }

  return clamp(score);
}

function inferReplayCoverage(mechanismId: string): number {
  const text = JSON.stringify([...experienceItems, ...outcomeItems]).toLowerCase();
  const id = mechanismId.toLowerCase();

  const terms =
    id.includes("mkt_002")
      ? ["inventory", "restocking", "manufacturing", "production"]
      : id.includes("mkt_006")
        ? ["policy", "regulatory", "government", "incentive"]
        : id.includes("mkt_010")
          ? ["demand", "exports", "trade", "orders"]
          : [];

  const hits = terms.filter((t) => text.includes(t)).length;

  return clamp(hits / Math.max(terms.length, 1));
}

const attributionItems = mechanismConfidenceItems.map((m) => {
  const summary = mechanismSummaries.find((s) => s.mechanism_id === m.mechanism_id) || {};

  const historical_support_score = inferHistoricalSupport(m.mechanism_id);
  const replay_coverage_score = inferReplayCoverage(m.mechanism_id);
  const current_link_strength = Number(summary.average_link_strength ?? 0);

  const replay_attribution_score = clamp(
    historical_support_score * 0.4 +
      replay_coverage_score * 0.25 +
      current_link_strength * 0.25 +
      Number(m.adjusted_confidence_score ?? 0) * 0.1
  );

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: m.lifecycle_status,
    adjusted_confidence_score: m.adjusted_confidence_score,
    historical_support_score: Number(historical_support_score.toFixed(3)),
    replay_coverage_score: Number(replay_coverage_score.toFixed(3)),
    current_link_strength: Number(current_link_strength.toFixed(3)),
    replay_attribution_score: Number(replay_attribution_score.toFixed(3)),
    replay_attribution_band:
      replay_attribution_score >= 0.75
        ? "strong_historical_attribution"
        : replay_attribution_score >= 0.55
          ? "moderate_historical_attribution"
          : replay_attribution_score >= 0.35
            ? "weak_historical_attribution"
            : "insufficient_historical_attribution",
    interpretation:
      replay_attribution_score >= 0.55
        ? "Historical replay contains enough related signal to support monitoring and review, but not automatic validation."
        : "Historical replay support remains limited. Mechanism should remain under observation.",
    governance: {
      historical_replay_is_supportive_not_deterministic: true,
      historical_similarity_must_never_override_current_evidence: true,
      past_results_do_not_guarantee_future_outcomes: true,
      human_review_required_for_validation: true,
    },
  };
});

const output = {
  registry_version: "historical-replay-attribution-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    historical_replay_supports_memory_not_certainty: true,
    historical_similarity_may_influence_confidence: true,
    historical_similarity_must_never_override_current_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    mechanism_confidence_items: mechanismConfidenceItems.length,
    mechanism_summaries: mechanismSummaries.length,
    experience_items: experienceItems.length,
    historical_outcome_items: outcomeItems.length,
  },
  summary: {
    mechanisms_processed: attributionItems.length,
    strong_historical_attribution: attributionItems.filter((x) => x.replay_attribution_band === "strong_historical_attribution").length,
    moderate_historical_attribution: attributionItems.filter((x) => x.replay_attribution_band === "moderate_historical_attribution").length,
    weak_historical_attribution: attributionItems.filter((x) => x.replay_attribution_band === "weak_historical_attribution").length,
    insufficient_historical_attribution: attributionItems.filter((x) => x.replay_attribution_band === "insufficient_historical_attribution").length,
    average_replay_attribution_score: Number(avg(attributionItems.map((x) => x.replay_attribution_score)).toFixed(3)),
  },
  replay_attribution_items: attributionItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/historical-replay-attribution-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/historical-replay-attribution-engine-v0.1.json",
});

console.table(
  attributionItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    confidence: x.adjusted_confidence_score,
    historical: x.historical_support_score,
    coverage: x.replay_coverage_score,
    attribution: x.replay_attribution_score,
    band: x.replay_attribution_band,
  }))
);
