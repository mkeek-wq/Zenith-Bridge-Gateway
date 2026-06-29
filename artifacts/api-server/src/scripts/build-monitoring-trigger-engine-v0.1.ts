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

const caseData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const contradictionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const discoveryData =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || {};
const topEvidence = currentCase.evidence_summary?.top_evidence || [];
const mechanisms = currentCase.mechanism_summary || [];
const contradictions = contradictionData.contradictions || [];
const discoveries = discoveryData.discovery_candidates || [];

function triggerFrequency(score: number): string {
  if (score >= 0.75) return "weekly";
  if (score >= 0.55) return "biweekly";
  return "monthly";
}

function metricTrigger(metric: string, reason: string, baseScore: number): any {
  const score = clamp(baseScore);

  return {
    trigger_id: `TRG_${String(triggers.length + 1).padStart(4, "0")}`,
    metric_name: metric,
    trigger_type: "metric_monitoring",
    trigger_importance_score: Number(score.toFixed(3)),
    trigger_band:
      score >= 0.75
        ? "high_priority"
        : score >= 0.55
          ? "medium_priority"
          : "low_priority",
    monitoring_frequency: triggerFrequency(score),
    reason,
    suggested_watch_rule:
      "Monitor direction, magnitude, and whether new observations confirm or contradict current case posture.",
    governance: {
      trigger_is_not_prediction: true,
      human_review_required_for_action: true,
      evidence_remains_primary: true,
    },
  };
}

const triggers: any[] = [];

for (const e of topEvidence.slice(0, 8)) {
  triggers.push(
    metricTrigger(
      e.metric_name,
      `Top-ranked evidence in current monitoring case. Status: ${e.status}; direction: ${e.direction}.`,
      Number(e.evidence_score ?? 0.5)
    )
  );
}

for (const c of contradictions) {
  const bucket = c.evidence_bucket;
  const score = Number(c.contradiction_strength ?? 0.5);

  triggers.push({
    trigger_id: `TRG_${String(triggers.length + 1).padStart(4, "0")}`,
    metric_name: bucket,
    trigger_type: "contradiction_monitoring",
    trigger_importance_score: Number(score.toFixed(3)),
    trigger_band:
      score >= 0.75
        ? "high_priority"
        : score >= 0.55
          ? "medium_priority"
          : "low_priority",
    monitoring_frequency: triggerFrequency(score),
    reason: `Contradiction detected in ${bucket}. Positive and negative signals coexist.`,
    suggested_watch_rule:
      "Track whether the contradiction resolves, deepens, or spreads into related evidence buckets.",
    governance: {
      trigger_is_not_prediction: true,
      contradiction_reduces_certainty: true,
      evidence_remains_primary: true,
    },
  });
}

for (const m of mechanisms) {
  if (m.promotion_status === "watch_for_promotion") {
    triggers.push({
      trigger_id: `TRG_${String(triggers.length + 1).padStart(4, "0")}`,
      metric_name: m.mechanism_name,
      trigger_type: "mechanism_watch",
      trigger_importance_score: Number(m.promotion_score ?? 0.55),
      trigger_band: "medium_priority",
      monitoring_frequency: "biweekly",
      reason: `Mechanism is marked watch_for_promotion: ${m.mechanism_name}.`,
      suggested_watch_rule:
        "Monitor new supporting evidence, contradictions, falsification risk, and replay support changes.",
      governance: {
        trigger_is_not_validation: true,
        promotion_is_not_validation: true,
        human_review_required_for_lifecycle_change: true,
      },
    });
  }
}

for (const d of discoveries) {
  if (d.discovery_status === "candidate_discovery") {
    triggers.push({
      trigger_id: `TRG_${String(triggers.length + 1).padStart(4, "0")}`,
      metric_name: d.suggested_mechanism_name,
      trigger_type: "discovery_watch",
      trigger_importance_score: Number(d.discovery_score ?? 0.5),
      trigger_band:
        Number(d.discovery_score ?? 0) >= 0.75
          ? "high_priority"
          : "medium_priority",
      monitoring_frequency: "monthly",
      reason: `Candidate discovery detected: ${d.suggested_mechanism_name}.`,
      suggested_watch_rule:
        "Track whether this theme accumulates additional evidence and whether it deserves human-seeded mechanism review.",
      governance: {
        discovery_is_not_validation: true,
        human_review_required_to_seed_new_mechanism: true,
        evidence_remains_primary: true,
      },
    });
  }
}

const uniqueTriggers = Array.from(
  new Map(triggers.map((t) => [`${t.trigger_type}:${t.metric_name}`, t])).values()
).sort((a, b) => b.trigger_importance_score - a.trigger_importance_score);

const output = {
  registry_version: "monitoring-trigger-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    monitoring_triggers_are_not_predictions: true,
    triggers_prioritize_attention_not_action: true,
    evidence_remains_primary: true,
    human_review_required_for_decisions: true,
  },
  inputs: {
    top_evidence_items: topEvidence.length,
    mechanisms: mechanisms.length,
    contradictions: contradictions.length,
    discoveries: discoveries.length,
  },
  summary: {
    triggers_created: uniqueTriggers.length,
    high_priority: uniqueTriggers.filter((t) => t.trigger_band === "high_priority").length,
    medium_priority: uniqueTriggers.filter((t) => t.trigger_band === "medium_priority").length,
    low_priority: uniqueTriggers.filter((t) => t.trigger_band === "low_priority").length,
  },
  monitoring_triggers: uniqueTriggers,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/monitoring-trigger-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/monitoring-trigger-engine-v0.1.json",
});

console.table(
  uniqueTriggers.slice(0, 20).map((t) => ({
    trigger: t.metric_name,
    type: t.trigger_type,
    score: t.trigger_importance_score,
    band: t.trigger_band,
    frequency: t.monitoring_frequency,
  }))
);
