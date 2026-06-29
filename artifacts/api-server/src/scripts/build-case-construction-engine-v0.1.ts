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

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) || {};

const decisionSupport =
  readJsonSafe(path.join(ROOT, "data/intelligence/decision-support-engine-v0.2.json")) || {};

const confidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const replaySupport =
  readJsonSafe(path.join(ROOT, "data/intelligence/replay-support-engine-v0.2.json")) || {};

const promotion =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-promotion-candidate-engine-v0.1.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];
const confidenceItems: any[] = confidence.mechanism_confidence_items || [];
const replayItems: any[] = replaySupport.replay_support_items || [];
const promotionItems: any[] = promotion.promotion_candidate_items || [];

const topEvidence = assessedEvidence
  .slice()
  .sort((a, b) => Number(b.scores?.evidence_score ?? 0) - Number(a.scores?.evidence_score ?? 0))
  .slice(0, 12);

const mechanismCases = confidenceItems.map((m) => {
  const replay = replayItems.find((r) => r.mechanism_id === m.mechanism_id) || {};
  const promo = promotionItems.find((p) => p.mechanism_id === m.mechanism_id) || {};

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: m.lifecycle_status,
    adjusted_confidence_score: m.adjusted_confidence_score,
    adjusted_confidence_band: m.adjusted_confidence_band,
    replay_support_score: replay.replay_support_score ?? null,
    replay_support_band: replay.replay_support_band ?? "unknown",
    promotion_score: promo.promotion_score ?? null,
    promotion_status: promo.promotion_status ?? "unknown",
    permitted_use: m.permitted_use,
    interpretation:
      promo.promotion_status === "watch_for_promotion"
        ? "Leading candidate for continued monitoring, but not ready for validation or promotion."
        : "Mechanism can support monitoring but should not drive conclusions.",
  };
});

const caseConfidence = avg([
  Number(decisionSupport.decision_support_brief?.decision_confidence_score ?? 0),
  avg(confidenceItems.map((x) => Number(x.adjusted_confidence_score ?? 0))),
  avg(replayItems.map((x) => Number(x.replay_support_score ?? 0))),
]);

const currentCase = {
  case_id: "SMURF_CASE_001",
  case_version: "case-construction-v0.1",
  case_title: "Singapore Macro-Evidence Mechanism Monitoring Case",
  created_at: new Date().toISOString(),
  case_status: "monitoring_case",
  case_confidence_score: Number(caseConfidence.toFixed(3)),
  case_confidence_band:
    caseConfidence >= 0.75
      ? "high"
      : caseConfidence >= 0.55
        ? "moderate"
        : caseConfidence >= 0.35
          ? "low"
          : "very_low",
  summary_assessment:
    decisionSupport.decision_support_brief?.main_assessment ||
    "Evidence and mechanism signals exist, but no validated mechanism is available.",
  recommended_posture:
    decisionSupport.decision_support_brief?.recommended_posture || "basic_monitoring",
  attention_areas: decisionSupport.decision_support_brief?.attention_areas || [],
  evidence_summary: {
    assessed_evidence_items: assessedEvidence.length,
    strong_evidence_items: evidenceAssessment.summary?.strong_evidence_items ?? null,
    useful_evidence_items: evidenceAssessment.summary?.useful_evidence_items ?? null,
    top_evidence: topEvidence.map((e) => ({
      evidence_id: e.evidence_id,
      metric_name: e.metric_name,
      period: e.period,
      value: e.value,
      direction: e.direction,
      evidence_score: e.scores?.evidence_score,
      status: e.assessment?.status,
    })),
  },
  mechanism_summary: mechanismCases,
  analyst_note:
    "This case is a structured monitoring case. It is not a prediction, not a validation decision, and not a recommendation to mutate mechanism lifecycle state.",
  governance: {
    evidence_remains_primary: true,
    decision_support_is_not_prediction: true,
    mechanisms_are_not_principles: true,
    promotion_is_not_validation: true,
    human_review_required_for_lifecycle_change: true,
  },
};

const output = {
  registry_version: "case-construction-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    cases_are_structured_assessments_not_predictions: true,
    evidence_remains_primary: true,
    mechanism_outputs_are_supportive_not_conclusive: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    confidence_items: confidenceItems.length,
    replay_support_items: replayItems.length,
    promotion_items: promotionItems.length,
  },
  cases_created: 1,
  cases: [currentCase],
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  cases_created: output.cases_created,
  case_confidence_score: currentCase.case_confidence_score,
  case_confidence_band: currentCase.case_confidence_band,
  recommended_posture: currentCase.recommended_posture,
  output: "data/intelligence/case-construction-engine-v0.1.json",
});

console.log("\nCase Assessment:");
console.log(currentCase.summary_assessment);

console.table(
  mechanismCases.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism: m.mechanism_name,
    confidence: m.adjusted_confidence_score,
    replay: m.replay_support_score,
    promotion: m.promotion_score,
    status: m.promotion_status,
  }))
);
