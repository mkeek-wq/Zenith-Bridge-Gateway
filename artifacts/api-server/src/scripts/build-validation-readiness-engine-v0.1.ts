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

const attribution =
  readJsonSafe(path.join(ROOT, "data/intelligence/historical-replay-attribution-engine-v0.1.json")) || {};

const falsification =
  readJsonSafe(path.join(ROOT, "data/intelligence/falsification-registry-v0.1.json")) || {};

const counterEvidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/counter-evidence-registry-v0.1.json")) || {};

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const confidenceItems: any[] = confidence.mechanism_confidence_items || [];
const attributionItems: any[] = attribution.replay_attribution_items || [];

const falsificationItems: any[] =
  falsification.falsification_reviews ||
  falsification.items ||
  [];

const counterEvidenceItems: any[] =
  counterEvidence.counter_evidence_items ||
  counterEvidence.items ||
  [];

const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

function getMechanismId(x: any): string {
  return String(x.mechanism_id || x.driver_id || x.candidate_id || x.id || "UNKNOWN");
}

function falsificationRisk(mechanismId: string): number {
  const matches = falsificationItems.filter((x) => getMechanismId(x) === mechanismId);
  if (!matches.length) return 0.05;

  const severe = matches.filter((x) =>
    String(x.status || x.falsification_status || "").toLowerCase().includes("falsified")
  ).length;

  return clamp(matches.length * 0.12 + severe * 0.3);
}

function counterEvidenceRisk(mechanismId: string): number {
  const matches = counterEvidenceItems.filter((x) => getMechanismId(x) === mechanismId);
  if (!matches.length) return 0.05;

  return clamp(matches.length * 0.15);
}

const readinessItems = confidenceItems.map((m) => {
  const mechanismId = m.mechanism_id;
  const attr = attributionItems.find((a) => a.mechanism_id === mechanismId) || {};
  const life = lifecycleItems.find((l) => l.driver_id === mechanismId || l.mechanism_id === mechanismId) || {};

  const confidenceScore = Number(m.adjusted_confidence_score ?? 0);
  const attributionScore = Number(attr.replay_attribution_score ?? 0);
  const linkSupport = Number(m.confidence_components?.evidence_link_support ?? 0);
  const validationSupport = Number(m.confidence_components?.validation_support ?? 0);

  const falsification_risk = falsificationRisk(mechanismId);
  const counter_evidence_risk = counterEvidenceRisk(mechanismId);

  const readiness_score = clamp(
    confidenceScore * 0.35 +
      attributionScore * 0.25 +
      linkSupport * 0.25 +
      validationSupport * 0.1 -
      falsification_risk * 0.15 -
      counter_evidence_risk * 0.1
  );

  const lifecycleStatus = m.lifecycle_status || life.lifecycle_status || "unknown";

  let readinessStatus = "not_ready_for_validation_review";

  if (
    readiness_score >= 0.7 &&
    lifecycleStatus === "candidate_not_validated" &&
    falsification_risk < 0.25 &&
    counter_evidence_risk < 0.25
  ) {
    readinessStatus = "ready_for_human_validation_review";
  } else if (readiness_score >= 0.55) {
    readinessStatus = "monitor_for_validation_readiness";
  }

  return {
    mechanism_id: mechanismId,
    mechanism_name: m.mechanism_name,
    lifecycle_status: lifecycleStatus,
    validated_mechanism: life.validated_mechanism === true,
    readiness_score: Number(readiness_score.toFixed(3)),
    readiness_band:
      readiness_score >= 0.7
        ? "high_readiness"
        : readiness_score >= 0.55
          ? "moderate_readiness"
          : readiness_score >= 0.35
            ? "low_readiness"
            : "very_low_readiness",
    readiness_status: readinessStatus,
    components: {
      adjusted_confidence_score: Number(confidenceScore.toFixed(3)),
      replay_attribution_score: Number(attributionScore.toFixed(3)),
      evidence_link_support: Number(linkSupport.toFixed(3)),
      validation_support: Number(validationSupport.toFixed(3)),
      falsification_risk: Number(falsification_risk.toFixed(3)),
      counter_evidence_risk: Number(counter_evidence_risk.toFixed(3)),
    },
    recommendation:
      readinessStatus === "ready_for_human_validation_review"
        ? "Prepare mechanism for human validation review. Do not mutate lifecycle state automatically."
        : readinessStatus === "monitor_for_validation_readiness"
          ? "Continue monitoring evidence accumulation and contradiction risk."
          : "Do not validate. Evidence or attribution support remains insufficient.",
    governance: {
      automatic_validation_allowed: false,
      human_review_required: true,
      lifecycle_mutation_allowed: false,
      evidence_remains_primary: true,
      readiness_is_not_validation: true,
    },
  };
});

const output = {
  registry_version: "validation-readiness-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    readiness_is_not_validation: true,
    automatic_validation_forbidden: true,
    human_review_required_for_state_change: true,
    evidence_remains_primary: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    confidence_items: confidenceItems.length,
    attribution_items: attributionItems.length,
    falsification_items: falsificationItems.length,
    counter_evidence_items: counterEvidenceItems.length,
    lifecycle_items: lifecycleItems.length,
  },
  summary: {
    mechanisms_processed: readinessItems.length,
    ready_for_human_validation_review: readinessItems.filter((x) => x.readiness_status === "ready_for_human_validation_review").length,
    monitor_for_validation_readiness: readinessItems.filter((x) => x.readiness_status === "monitor_for_validation_readiness").length,
    not_ready_for_validation_review: readinessItems.filter((x) => x.readiness_status === "not_ready_for_validation_review").length,
    average_readiness_score: Number(avg(readinessItems.map((x) => x.readiness_score)).toFixed(3)),
  },
  validation_readiness_items: readinessItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/validation-readiness-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/validation-readiness-engine-v0.1.json",
});

console.table(
  readinessItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    lifecycle: x.lifecycle_status,
    readiness: x.readiness_score,
    band: x.readiness_band,
    status: x.readiness_status,
  }))
);
