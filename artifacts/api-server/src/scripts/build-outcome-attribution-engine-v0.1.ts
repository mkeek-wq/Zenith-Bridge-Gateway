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

const caseData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const confidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const replaySupport =
  readJsonSafe(path.join(ROOT, "data/intelligence/replay-support-engine-v0.2.json")) || {};

const evidenceDedup =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || {};
const mechanisms: any[] = confidence.mechanism_confidence_items || [];
const replayItems: any[] = replaySupport.replay_support_items || [];
const signals: any[] = evidenceDedup.deduped_signals || [];

function mechanismSignalFit(mechanismId: string, signal: any): number {
  const metric = String(signal.metric_name || "").toLowerCase();

  if (mechanismId === "MKT_010") {
    if (metric.includes("nodx") || metric.includes("export") || metric.includes("trade") || metric.includes("gdp")) return 0.85;
    if (metric.includes("manufacturing") || metric.includes("business")) return 0.55;
  }

  if (mechanismId === "MKT_002") {
    if (metric.includes("manufacturing") || metric.includes("output") || metric.includes("inventory")) return 0.9;
    if (metric.includes("nodx") || metric.includes("electronics")) return 0.55;
  }

  if (mechanismId === "MKT_006") {
    if (metric.includes("cpi") || metric.includes("investment") || metric.includes("gdp") || metric.includes("rate")) return 0.8;
    if (metric.includes("business") || metric.includes("household")) return 0.45;
  }

  return 0.2;
}

const attributionItems = mechanisms.map((m) => {
  const replay = replayItems.find((r) => r.mechanism_id === m.mechanism_id) || {};

  const fittedSignals = signals.map((s) => {
    const fit = mechanismSignalFit(m.mechanism_id, s);
    const signalStrength = Number(s.scores?.signal_strength_score ?? 0);
    const contribution = clamp(fit * signalStrength);

    return {
      signal_id: s.signal_id,
      metric_name: s.metric_name,
      signal_band: s.signal_band,
      dominant_direction: s.direction_summary?.dominant_direction,
      signal_strength_score: signalStrength,
      mechanism_fit_score: Number(fit.toFixed(3)),
      contribution_score: Number(contribution.toFixed(3)),
    };
  });

  const topContributors = fittedSignals
    .slice()
    .sort((a, b) => b.contribution_score - a.contribution_score)
    .slice(0, 8);

  const attributionScore = clamp(
    Number(m.adjusted_confidence_score ?? 0) * 0.35 +
      Number(replay.replay_support_score ?? 0) * 0.2 +
      avg(topContributors.map((x) => x.contribution_score)) * 0.45
  );

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: m.lifecycle_status,
    attribution_score: Number(attributionScore.toFixed(3)),
    attribution_band:
      attributionScore >= 0.75
        ? "high_attribution"
        : attributionScore >= 0.55
          ? "moderate_attribution"
          : attributionScore >= 0.35
            ? "low_attribution"
            : "very_low_attribution",
    components: {
      adjusted_confidence_score: m.adjusted_confidence_score,
      replay_support_score: replay.replay_support_score ?? null,
      average_top_signal_contribution: Number(avg(topContributors.map((x) => x.contribution_score)).toFixed(3)),
    },
    top_contributing_signals: topContributors,
    interpretation:
      attributionScore >= 0.55
        ? "Mechanism has meaningful explanatory contribution to the current case, but attribution remains provisional."
        : "Mechanism has limited explanatory contribution to the current case.",
    governance: {
      attribution_is_estimate_not_truth: true,
      attribution_does_not_validate_mechanism: true,
      evidence_remains_primary: true,
      human_review_required_for_conclusions: true,
    },
  };
});

const output = {
  registry_version: "outcome-attribution-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    attribution_is_probabilistic_not_deterministic: true,
    attribution_is_not_validation: true,
    evidence_remains_primary: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    case_id: currentCase.case_id || null,
    mechanisms: mechanisms.length,
    grouped_signals: signals.length,
    replay_support_items: replayItems.length,
  },
  summary: {
    attribution_items: attributionItems.length,
    high_attribution: attributionItems.filter((x) => x.attribution_band === "high_attribution").length,
    moderate_attribution: attributionItems.filter((x) => x.attribution_band === "moderate_attribution").length,
    low_attribution: attributionItems.filter((x) => x.attribution_band === "low_attribution").length,
    very_low_attribution: attributionItems.filter((x) => x.attribution_band === "very_low_attribution").length,
    leading_attribution:
      attributionItems.slice().sort((a, b) => b.attribution_score - a.attribution_score)[0]?.mechanism_name || null,
  },
  attribution_items: attributionItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/outcome-attribution-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/outcome-attribution-engine-v0.1.json",
});

console.table(
  attributionItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    attribution: x.attribution_score,
    band: x.attribution_band,
    top_signal: x.top_contributing_signals[0]?.metric_name || "",
  }))
);
