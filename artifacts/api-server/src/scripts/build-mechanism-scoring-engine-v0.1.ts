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

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const validation =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-validation-registry-v0.1.json")) || {};

const falsification =
  readJsonSafe(path.join(ROOT, "data/intelligence/falsification-registry-v0.1.json")) || {};

const counterEvidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/counter-evidence-registry-v0.1.json")) || {};

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.1.json")) || {};

const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

const validationItems: any[] =
  validation.validation_results ||
  validation.mechanisms ||
  validation.items ||
  [];

const falsificationItems: any[] =
  falsification.falsification_reviews ||
  falsification.items ||
  [];

const counterEvidenceItems: any[] =
  counterEvidence.counter_evidence_items ||
  counterEvidence.items ||
  [];

const assessedEvidence: any[] =
  evidenceAssessment.assessed_evidence ||
  [];

function getMechanismId(x: any): string {
  return String(
    x.mechanism_id ||
      x.driver_id ||
      x.candidate_id ||
      x.id ||
      "UNKNOWN_MECHANISM"
  );
}

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function mechanismEvidenceSupport(mechanismId: string): number {
  const idLower = mechanismId.toLowerCase();

  const related = assessedEvidence.filter((e) => {
    const text = `${e.metric_name || ""} ${e.evidence_window || ""}`.toLowerCase();

    if (idLower.includes("mkt_002")) {
      return text.includes("inventory") || text.includes("production") || text.includes("manufacturing");
    }

    if (idLower.includes("mkt_006")) {
      return text.includes("policy") || text.includes("government") || text.includes("incentive") || text.includes("rate");
    }

    if (idLower.includes("mkt_010")) {
      return text.includes("demand") || text.includes("pmi") || text.includes("exports") || text.includes("orders");
    }

    return false;
  });

  if (!related.length) return 0.35;

  return avg(related.map((e) => Number(e.scores?.evidence_score ?? 0.4)));
}

function historicalSupport(item: any): number {
  const status = String(item.lifecycle_status || item.status || "").toLowerCase();

  if (status === "validated") return 0.85;
  if (status === "candidate_not_validated") return 0.45;
  if (status.includes("strengthened")) return 0.75;
  if (status.includes("candidate")) return 0.45;
  if (status.includes("challenge")) return 0.35;
  if (status.includes("weakened")) return 0.25;
  if (status.includes("retired")) return 0.05;

  return 0.4;
}

function counterEvidencePenalty(mechanismId: string): number {
  const matches = counterEvidenceItems.filter((x) => getMechanismId(x) === mechanismId);
  if (!matches.length) return 0.05;

  return clamp(0.1 + matches.length * 0.15);
}

function falsificationPenalty(mechanismId: string): number {
  const matches = falsificationItems.filter((x) => getMechanismId(x) === mechanismId);
  if (!matches.length) return 0.0;

  const severe = matches.filter((x) =>
    String(x.status || x.falsification_status || "").toLowerCase().includes("falsified")
  ).length;

  return clamp(matches.length * 0.1 + severe * 0.25);
}

function validationSupport(mechanismId: string): number {
  const matches = validationItems.filter((x) => getMechanismId(x) === mechanismId);

  if (!matches.length) return 0.25;

  const validated = matches.filter((x) =>
    String(x.status || x.validation_status || "").toLowerCase().includes("validated")
  ).length;

  if (validated > 0) return 0.85;

  return 0.35;
}

const scoredMechanisms = lifecycleItems.map((item, index) => {
  const mechanismId = getMechanismId(item);
  const mechanismName =
    item.mechanism_name ||
    item.name ||
    item.driver_name ||
    `Mechanism ${index + 1}`;

  const evidence_support = mechanismEvidenceSupport(mechanismId);
  const historical_support = historicalSupport(item);
  const validation_support = validationSupport(mechanismId);
  const counter_evidence_penalty = counterEvidencePenalty(mechanismId);
  const falsification_penalty = falsificationPenalty(mechanismId);

  const confidence_score = clamp(
    evidence_support * 0.35 +
      historical_support * 0.25 +
      validation_support * 0.25 -
      counter_evidence_penalty * 0.1 -
      falsification_penalty * 0.2
  );

  return {
    mechanism_id: mechanismId,
    mechanism_name: mechanismName,
    lifecycle_status: item.lifecycle_status || item.status || "unknown",
    scores: {
      evidence_support: Number(evidence_support.toFixed(3)),
      historical_support: Number(historical_support.toFixed(3)),
      validation_support: Number(validation_support.toFixed(3)),
      counter_evidence_penalty: Number(counter_evidence_penalty.toFixed(3)),
      falsification_penalty: Number(falsification_penalty.toFixed(3)),
      confidence_score: Number(confidence_score.toFixed(3)),
    },
    confidence_band:
      confidence_score >= 0.75
        ? "high"
        : confidence_score >= 0.55
          ? "moderate"
          : confidence_score >= 0.35
            ? "low"
            : "very_low",
    governance: {
      
validated: String(item.lifecycle_status || item.status || "").toLowerCase() === "validated",
      evidence_remains_primary: true,
      historical_similarity_must_never_override_evidence: true,
      past_results_do_not_guarantee_future_outcomes: true,
    },
  };
});

const output = {
  registry_version: "mechanism-scoring-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    mechanisms_are_challengeable: true,
    mechanisms_are_not_principles: true,
    evidence_remains_primary: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    lifecycle_items: lifecycleItems.length,
    validation_items: validationItems.length,
    falsification_items: falsificationItems.length,
    counter_evidence_items: counterEvidenceItems.length,
    assessed_evidence_items: assessedEvidence.length,
  },
  mechanisms_scored: scoredMechanisms.length,
  scored_mechanisms: scoredMechanisms,
};

const outputDir = path.join(ROOT, "data/intelligence");
ensureDir(outputDir);

const outputPath = path.join(outputDir, "mechanism-scoring-engine-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.registry_version,
  mechanisms_scored: output.mechanisms_scored,
  output: "data/intelligence/mechanism-scoring-engine-v0.1.json",
});

console.table(
  scoredMechanisms.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    lifecycle: x.lifecycle_status,
    confidence: x.scores.confidence_score,
    band: x.confidence_band,
  }))
);
