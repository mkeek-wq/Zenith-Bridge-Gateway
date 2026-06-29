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

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.1.json")) || {};

const mechanismScoring =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-scoring-engine-v0.1.json")) || {};

const assessedEvidence: any[] =
  evidenceAssessment.assessed_evidence ||
  [];

const scoredMechanisms: any[] =
  mechanismScoring.scored_mechanisms ||
  [];

const strongEvidence = assessedEvidence.filter(
  (e) => Number(e.scores?.evidence_score ?? 0) >= 0.8
);

const usefulEvidence = assessedEvidence.filter(
  (e) => Number(e.scores?.evidence_score ?? 0) >= 0.6
);

const moderateOrBetterMechanisms = scoredMechanisms.filter(
  (m) => Number(m.scores?.confidence_score ?? 0) >= 0.55
);

const topEvidence = [...assessedEvidence]
  .sort((a, b) => Number(b.scores?.evidence_score ?? 0) - Number(a.scores?.evidence_score ?? 0))
  .slice(0, 10);

const topMechanisms = [...scoredMechanisms]
  .sort((a, b) => Number(b.scores?.confidence_score ?? 0) - Number(a.scores?.confidence_score ?? 0))
  .slice(0, 10);

function inferAttentionAreas(evidence: any[]): string[] {
  const text = evidence
    .map((e) => `${e.metric_name || ""} ${e.evidence_window || ""}`)
    .join(" ")
    .toLowerCase();

  const areas: string[] = [];

  if (text.includes("pmi") || text.includes("orders") || text.includes("demand")) {
    areas.push("Demand conditions");
  }

  if (text.includes("exports") || text.includes("semiconductor") || text.includes("electronics")) {
    areas.push("External trade and electronics cycle");
  }

  if (text.includes("manufacturing") || text.includes("industrial production")) {
    areas.push("Manufacturing momentum");
  }

  if (text.includes("inventory")) {
    areas.push("Inventory cycle");
  }

  if (text.includes("policy") || text.includes("government") || text.includes("incentive")) {
    areas.push("Policy transmission");
  }

  if (text.includes("inflation") || text.includes("cpi") || text.includes("price")) {
    areas.push("Inflation and price pressure");
  }

  return [...new Set(areas)];
}

function computeDecisionConfidence(): number {
  const evidenceScore = assessedEvidence.length
    ? assessedEvidence.reduce((sum, e) => sum + Number(e.scores?.evidence_score ?? 0), 0) /
      assessedEvidence.length
    : 0;

  const mechanismScore = scoredMechanisms.length
    ? scoredMechanisms.reduce((sum, m) => sum + Number(m.scores?.confidence_score ?? 0), 0) /
      scoredMechanisms.length
    : 0;

  return clamp(evidenceScore * 0.65 + mechanismScore * 0.35);
}

const decisionConfidence = computeDecisionConfidence();
const attentionAreas = inferAttentionAreas(topEvidence);

const decisionSupportBrief = {
  brief_id: "PAPA_SMURF_DECISION_SUPPORT_V0_1",
  status: "prototype_assessment",
  decision_confidence_score: Number(decisionConfidence.toFixed(3)),
  decision_confidence_band:
    decisionConfidence >= 0.75
      ? "high"
      : decisionConfidence >= 0.55
        ? "moderate"
        : decisionConfidence >= 0.35
          ? "low"
          : "very_low",
  main_assessment:
    strongEvidence.length > 0 && moderateOrBetterMechanisms.length > 0
      ? "Evidence base contains strong signals and at least one moderate-confidence mechanism. Decision support can highlight areas for monitoring, but should not issue deterministic predictions."
      : usefulEvidence.length > 0
        ? "Evidence base contains useful signals, but mechanism confidence remains limited. Decision support should remain cautious and monitoring-oriented."
        : "Evidence base is currently weak or incomplete. Decision support should not escalate beyond monitoring.",
  attention_areas: attentionAreas,
  recommended_posture:
    decisionConfidence >= 0.75
      ? "active_monitoring_with_prepared_scenarios"
      : decisionConfidence >= 0.55
        ? "focused_monitoring"
        : "basic_monitoring",
  papa_smurf_rules: {
    no_crystal_ball_predictions: true,
    no_guaranteed_outcomes: true,
    no_override_of_current_evidence_by_history: true,
    express_uncertainty_explicitly: true,
    recommend_monitoring_before_action: true,
  },
};

const output = {
  registry_version: "decision-support-engine-v0.1",
  created_at: new Date().toISOString(),
  architecture: {
    junior_smurf: "Evidence",
    medior_smurf: "Analysis",
    senior_smurf: "Historical comparison",
    papa_smurf: "Decision support",
  },
  doctrine: {
    evidence_remains_primary: true,
    historical_similarity_may_influence_confidence: true,
    historical_similarity_must_never_override_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
    decision_support_is_not_prediction: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    scored_mechanisms: scoredMechanisms.length,
    strong_evidence_items: strongEvidence.length,
    useful_evidence_items: usefulEvidence.length,
    moderate_or_better_mechanisms: moderateOrBetterMechanisms.length,
  },
  decision_support_brief: decisionSupportBrief,
  top_evidence: topEvidence.map((e) => ({
    evidence_id: e.evidence_id,
    metric_name: e.metric_name,
    period: e.period,
    score: e.scores?.evidence_score,
    status: e.assessment?.status,
  })),
  top_mechanisms: topMechanisms.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    confidence_score: m.scores?.confidence_score,
    confidence_band: m.confidence_band,
    lifecycle_status: m.lifecycle_status,
  })),
};

const outputDir = path.join(ROOT, "data/intelligence");
ensureDir(outputDir);

const outputPath = path.join(outputDir, "decision-support-engine-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.registry_version,
  assessed_evidence_items: output.inputs.assessed_evidence_items,
  scored_mechanisms: output.inputs.scored_mechanisms,
  decision_confidence_score: output.decision_support_brief.decision_confidence_score,
  decision_confidence_band: output.decision_support_brief.decision_confidence_band,
  output: "data/intelligence/decision-support-engine-v0.1.json",
});

console.log("\nPapa Smurf Assessment:");
console.log(output.decision_support_brief.main_assessment);

console.log("\nAttention Areas:");
for (const area of output.decision_support_brief.attention_areas) {
  console.log(`- ${area}`);
}
