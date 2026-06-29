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
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) ||
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.1.json")) ||
  {};

const mechanismScoring =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-scoring-engine-v0.1.json")) || {};

const mechanismLinker =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];
const scoredMechanisms: any[] = mechanismScoring.scored_mechanisms || [];
const mechanismSummaries: any[] = mechanismLinker.mechanism_summaries || [];

const strongEvidence = assessedEvidence.filter((e) => e.assessment?.status === "strong_evidence");
const usefulEvidence = assessedEvidence.filter((e) => e.assessment?.status === "useful_evidence");

const topEvidence = assessedEvidence
  .slice()
  .sort((a, b) => Number(b.scores?.evidence_score ?? 0) - Number(a.scores?.evidence_score ?? 0))
  .slice(0, 10);

const topMechanisms = scoredMechanisms
  .slice()
  .sort((a, b) => Number(b.scores?.confidence_score ?? 0) - Number(a.scores?.confidence_score ?? 0))
  .slice(0, 10);

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function inferAttentionAreas(evidence: any[]): string[] {
  const text = evidence.map((e) => `${e.metric_name || ""} ${e.evidence_window || ""}`).join(" ").toLowerCase();
  const areas: string[] = [];

  if (text.includes("nodx") || text.includes("exports") || text.includes("trade")) {
    areas.push("External trade and export demand");
  }

  if (text.includes("manufacturing") || text.includes("production") || text.includes("output")) {
    areas.push("Manufacturing momentum");
  }

  if (text.includes("semiconductor") || text.includes("electronics")) {
    areas.push("Electronics and semiconductor cycle");
  }

  if (text.includes("investment") || text.includes("direct_investment")) {
    areas.push("Investment flows");
  }

  if (text.includes("cpi") || text.includes("inflation")) {
    areas.push("Inflation and price pressure");
  }

  if (text.includes("gdp")) {
    areas.push("Broad macro momentum");
  }

  return [...new Set(areas)];
}

function computeDecisionConfidence(): number {
  const evidenceScore = avg(assessedEvidence.map((e) => Number(e.scores?.evidence_score ?? 0)));
  const topEvidenceScore = avg(topEvidence.map((e) => Number(e.scores?.evidence_score ?? 0)));

  const mechanismScore = avg(scoredMechanisms.map((m) => Number(m.scores?.confidence_score ?? 0)));
  const linkScore = avg(mechanismSummaries.map((m) => Number(m.average_link_strength ?? 0)));

  return clamp(
    evidenceScore * 0.3 +
      topEvidenceScore * 0.25 +
      mechanismScore * 0.2 +
      linkScore * 0.25
  );
}

const decisionConfidence = computeDecisionConfidence();
const attentionAreas = inferAttentionAreas(topEvidence);

const mechanismNarratives = mechanismSummaries.map((m) => {
  const scored = scoredMechanisms.find((s) => s.mechanism_id === m.mechanism_id);

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: m.lifecycle_status,
    mechanism_confidence_score: scored?.scores?.confidence_score ?? null,
    mechanism_confidence_band: scored?.confidence_band ?? "unknown",
    linked_evidence_items: m.linked_evidence_items,
    strong_links: m.strong_links,
    useful_links: m.useful_links,
    average_link_strength: m.average_link_strength,
    interpretation:
      m.linked_evidence_items > 0
        ? "Evidence links exist, but lifecycle status controls permitted use. Candidate mechanisms may support monitoring but not final conclusions."
        : "No meaningful evidence links found. Mechanism should not influence assessment.",
    top_linked_evidence: m.top_linked_evidence,
  };
});

const mainAssessment =
  strongEvidence.length > 0 && mechanismSummaries.some((m) => m.strong_links > 0)
    ? "Evidence base contains strong signals and mechanism-linked evidence. Because mechanisms remain candidate_not_validated, decision support should escalate monitoring but avoid firm conclusions."
    : usefulEvidence.length > 0 && mechanismSummaries.some((m) => m.useful_links > 0)
      ? "Evidence base contains useful signals and early mechanism-linked support. Because mechanisms remain unvalidated, decision support should remain cautious and monitoring-oriented."
      : "Evidence base is incomplete or weak. Decision support should remain at basic monitoring level.";

const recommendedPosture =
  decisionConfidence >= 0.75
    ? "active_monitoring_with_prepared_scenarios"
    : decisionConfidence >= 0.55
      ? "focused_monitoring"
      : "basic_monitoring";

const output = {
  registry_version: "decision-support-engine-v0.2",
  created_at: new Date().toISOString(),
  architecture: {
    junior_smurf: "Evidence",
    medior_smurf: "Evidence assessment and mechanism linking",
    senior_smurf: "Historical comparison and mechanism scoring",
    papa_smurf: "Decision support",
  },
  doctrine: {
    evidence_remains_primary: true,
    historical_similarity_may_influence_confidence: true,
    historical_similarity_must_never_override_evidence: true,
    mechanism_links_are_supportive_not_conclusive: true,
    past_results_do_not_guarantee_future_outcomes: true,
    decision_support_is_not_prediction: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    scored_mechanisms: scoredMechanisms.length,
    mechanism_summaries: mechanismSummaries.length,
    strong_evidence_items: strongEvidence.length,
    useful_evidence_items: usefulEvidence.length,
  },
  decision_support_brief: {
    brief_id: "PAPA_SMURF_DECISION_SUPPORT_V0_2",
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
    main_assessment: mainAssessment,
    attention_areas: attentionAreas,
    recommended_posture: recommendedPosture,
    papa_smurf_rules: {
      no_crystal_ball_predictions: true,
      no_guaranteed_outcomes: true,
      no_override_of_current_evidence_by_history: true,
      express_uncertainty_explicitly: true,
      recommend_monitoring_before_action: true,
    },
  },
  mechanism_narratives: mechanismNarratives,
  top_evidence: topEvidence.map((e) => ({
    evidence_id: e.evidence_id,
    metric_name: e.metric_name,
    period: e.period,
    score: e.scores?.evidence_score,
    status: e.assessment?.status,
    direction: e.direction,
  })),
  top_mechanisms: topMechanisms.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    confidence_score: m.scores?.confidence_score,
    confidence_band: m.confidence_band,
    lifecycle_status: m.lifecycle_status,
  })),
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/decision-support-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  decision_confidence_score: output.decision_support_brief.decision_confidence_score,
  decision_confidence_band: output.decision_support_brief.decision_confidence_band,
  recommended_posture: output.decision_support_brief.recommended_posture,
  output: "data/intelligence/decision-support-engine-v0.2.json",
});

console.log("\nPapa Smurf Assessment:");
console.log(output.decision_support_brief.main_assessment);

console.log("\nAttention Areas:");
for (const area of output.decision_support_brief.attention_areas) {
  console.log(`- ${area}`);
}

console.log("\nMechanism Narratives:");
console.table(
  mechanismNarratives.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism: m.mechanism_name,
    confidence: m.mechanism_confidence_score,
    linked: m.linked_evidence_items,
    strong: m.strong_links,
    useful: m.useful_links,
    avg_link: m.average_link_strength,
  }))
);
