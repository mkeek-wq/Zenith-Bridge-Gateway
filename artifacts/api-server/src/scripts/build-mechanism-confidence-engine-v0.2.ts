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

const previousScoring =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-scoring-engine-v0.1.json")) || {};

const linker =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json")) || {};

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const scoredMechanisms: any[] = previousScoring.scored_mechanisms || [];
const mechanismSummaries: any[] = linker.mechanism_summaries || [];
const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

function lifecycleBase(status: string): number {
  const s = String(status || "").toLowerCase();

  if (s === "validated") return 0.8;
  if (s === "strengthened") return 0.7;
  if (s === "candidate_not_validated") return 0.35;
  if (s === "under_challenge") return 0.25;
  if (s === "weakened") return 0.2;
  if (s === "retired") return 0.05;

  return 0.3;
}

function evidenceLinkSupport(summary: any): number {
  const linked = Number(summary.linked_evidence_items ?? 0);
  const strong = Number(summary.strong_links ?? 0);
  const useful = Number(summary.useful_links ?? 0);
  const avgLink = Number(summary.average_link_strength ?? 0);

  if (linked === 0) return 0;

  const volumeScore = clamp(linked / 100);
  const strongScore = clamp(strong / 25);
  const usefulScore = clamp(useful / 75);

  return clamp(
    avgLink * 0.45 +
      volumeScore * 0.2 +
      strongScore * 0.25 +
      usefulScore * 0.1
  );
}

const confidenceItems = scoredMechanisms.map((m) => {
  const mechanismId = m.mechanism_id;
  const summary = mechanismSummaries.find((s) => s.mechanism_id === mechanismId) || {};
  const lifecycleItem = lifecycleItems.find((l) => l.driver_id === mechanismId || l.mechanism_id === mechanismId) || {};

  const lifecycleStatus = m.lifecycle_status || lifecycleItem.lifecycle_status || "unknown";

  const base_lifecycle_confidence = lifecycleBase(lifecycleStatus);
  const previous_confidence = Number(m.scores?.confidence_score ?? 0);
  const evidence_link_support = evidenceLinkSupport(summary);
  const direct_evidence_support = Number(m.scores?.evidence_support ?? 0);
  const validation_support = Number(m.scores?.validation_support ?? 0);
  const falsification_penalty = Number(m.scores?.falsification_penalty ?? 0);
  const counter_evidence_penalty = Number(m.scores?.counter_evidence_penalty ?? 0);

  const adjusted_confidence = clamp(
    base_lifecycle_confidence * 0.2 +
      previous_confidence * 0.15 +
      evidence_link_support * 0.35 +
      direct_evidence_support * 0.2 +
      validation_support * 0.1 -
      falsification_penalty * 0.15 -
      counter_evidence_penalty * 0.05
  );

  return {
    mechanism_id: mechanismId,
    mechanism_name: m.mechanism_name,
    lifecycle_status: lifecycleStatus,
    validated_mechanism: lifecycleItem.validated_mechanism === true,
    previous_confidence_score: previous_confidence,
    adjusted_confidence_score: Number(adjusted_confidence.toFixed(3)),
    adjusted_confidence_band:
      adjusted_confidence >= 0.75
        ? "high"
        : adjusted_confidence >= 0.55
          ? "moderate"
          : adjusted_confidence >= 0.35
            ? "low"
            : "very_low",
    confidence_components: {
      base_lifecycle_confidence: Number(base_lifecycle_confidence.toFixed(3)),
      evidence_link_support: Number(evidence_link_support.toFixed(3)),
      direct_evidence_support: Number(direct_evidence_support.toFixed(3)),
      validation_support: Number(validation_support.toFixed(3)),
      falsification_penalty: Number(falsification_penalty.toFixed(3)),
      counter_evidence_penalty: Number(counter_evidence_penalty.toFixed(3)),
    },
    evidence_link_summary: {
      linked_evidence_items: summary.linked_evidence_items ?? 0,
      strong_links: summary.strong_links ?? 0,
      useful_links: summary.useful_links ?? 0,
      weak_links: summary.weak_links ?? 0,
      average_link_strength: summary.average_link_strength ?? 0,
    },
    permitted_use: {
      may_support_monitoring: adjusted_confidence >= 0.35,
      may_support_scenario_framing: adjusted_confidence >= 0.55,
      may_drive_primary_assessment: lifecycleStatus === "validated" && adjusted_confidence >= 0.75,
      may_override_evidence: false,
    },
    governance: {
      mechanism_remains_challengeable: true,
      evidence_remains_primary: true,
      candidate_not_validated_is_not_validation: lifecycleStatus === "candidate_not_validated",
      human_review_required_for_validation: true,
    },
  };
});

const output = {
  registry_version: "mechanism-confidence-engine-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    mechanisms_are_not_principles: true,
    evidence_remains_primary: true,
    evidence_links_can_raise_confidence_but_not_validate: true,
    historical_similarity_must_never_override_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    scored_mechanisms: scoredMechanisms.length,
    mechanism_summaries: mechanismSummaries.length,
    lifecycle_items: lifecycleItems.length,
  },
  summary: {
    mechanisms_processed: confidenceItems.length,
    high_confidence: confidenceItems.filter((x) => x.adjusted_confidence_band === "high").length,
    moderate_confidence: confidenceItems.filter((x) => x.adjusted_confidence_band === "moderate").length,
    low_confidence: confidenceItems.filter((x) => x.adjusted_confidence_band === "low").length,
    very_low_confidence: confidenceItems.filter((x) => x.adjusted_confidence_band === "very_low").length,
    average_adjusted_confidence: Number(avg(confidenceItems.map((x) => x.adjusted_confidence_score)).toFixed(3)),
  },
  mechanism_confidence_items: confidenceItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-confidence-engine-v0.2.json",
});

console.table(
  confidenceItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    lifecycle: x.lifecycle_status,
    previous: x.previous_confidence_score,
    adjusted: x.adjusted_confidence_score,
    band: x.adjusted_confidence_band,
    linked: x.evidence_link_summary.linked_evidence_items,
    strong: x.evidence_link_summary.strong_links,
  }))
);
