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

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function normalizeMetric(metric: string): string {
  return String(metric || "UNKNOWN_METRIC").trim().toUpperCase();
}

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];

const usefulEvidence = assessedEvidence.filter((e) =>
  ["strong_evidence", "useful_evidence"].includes(String(e.assessment?.status))
);

const groups = new Map<string, any[]>();

for (const e of usefulEvidence) {
  const key = normalizeMetric(e.metric_name);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(e);
}

const dedupedSignals = Array.from(groups.entries()).map(([metricName, items], index) => {
  const sorted = items
    .slice()
    .sort((a, b) => Number(b.scores?.evidence_score ?? 0) - Number(a.scores?.evidence_score ?? 0));

  const positive = items.filter((x) => x.direction === "positive").length;
  const negative = items.filter((x) => x.direction === "negative").length;
  const neutral = items.filter((x) => x.direction === "mixed_or_neutral").length;

  const total = items.length;
  const dominantDirection =
    positive >= negative && positive >= neutral
      ? "positive"
      : negative >= positive && negative >= neutral
        ? "negative"
        : "mixed_or_neutral";

  const directionAgreement =
    total > 0 ? Math.max(positive, negative, neutral) / total : 0;

  const averageScore = avg(items.map((e) => Number(e.scores?.evidence_score ?? 0)));
  const maxScore = Number(sorted[0]?.scores?.evidence_score ?? 0);

  const signalStrength =
    maxScore * 0.45 +
    averageScore * 0.35 +
    Math.min(total / 10, 1) * 0.1 +
    directionAgreement * 0.1;

  return {
    signal_id: `SIG_${String(index + 1).padStart(4, "0")}`,
    metric_name: metricName,
    evidence_items: total,
    strongest_evidence_id: sorted[0]?.evidence_id || null,
    periods: Array.from(new Set(items.map((e) => e.period).filter(Boolean))).slice(0, 20),
    direction_summary: {
      dominant_direction: dominantDirection,
      positive_items: positive,
      negative_items: negative,
      mixed_or_neutral_items: neutral,
      direction_agreement: Number(directionAgreement.toFixed(3)),
    },
    scores: {
      max_evidence_score: Number(maxScore.toFixed(3)),
      average_evidence_score: Number(averageScore.toFixed(3)),
      signal_strength_score: Number(signalStrength.toFixed(3)),
    },
    signal_band:
      signalStrength >= 0.8
        ? "very_strong_signal"
        : signalStrength >= 0.7
          ? "strong_signal"
          : signalStrength >= 0.6
            ? "useful_signal"
            : "weak_signal",
    interpretation:
      total > 1
        ? `${metricName} appears across ${total} useful/strong evidence items. Use as grouped signal rather than repeating individual observations.`
        : `${metricName} appears as a single useful/strong evidence item.`,
    representative_evidence: sorted.slice(0, 5).map((e) => ({
      evidence_id: e.evidence_id,
      period: e.period,
      value: e.value,
      direction: e.direction,
      evidence_score: e.scores?.evidence_score,
      status: e.assessment?.status,
    })),
  };
});

dedupedSignals.sort(
  (a, b) => b.scores.signal_strength_score - a.scores.signal_strength_score
);

const output = {
  registry_version: "evidence-deduplication-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    evidence_grouping_reduces_repetition_not_detail: true,
    grouped_signals_are_not_new_evidence: true,
    evidence_remains_primary: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    useful_or_strong_evidence_items: usefulEvidence.length,
  },
  summary: {
    grouped_signals_created: dedupedSignals.length,
    very_strong_signals: dedupedSignals.filter((s) => s.signal_band === "very_strong_signal").length,
    strong_signals: dedupedSignals.filter((s) => s.signal_band === "strong_signal").length,
    useful_signals: dedupedSignals.filter((s) => s.signal_band === "useful_signal").length,
    weak_signals: dedupedSignals.filter((s) => s.signal_band === "weak_signal").length,
  },
  deduped_signals: dedupedSignals,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/evidence-deduplication-engine-v0.1.json",
});

console.table(
  dedupedSignals.slice(0, 15).map((s) => ({
    signal: s.metric_name,
    items: s.evidence_items,
    direction: s.direction_summary.dominant_direction,
    agreement: s.direction_summary.direction_agreement,
    score: s.scores.signal_strength_score,
    band: s.signal_band,
  }))
);
