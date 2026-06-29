import fs from "node:fs";
import path from "node:path";

const casesDir = "data/cases";
const outputDir = "data/intelligence";
const outputPath = path.join(outputDir, "closure-readiness-audit-v0.1.json");

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readinessForCase(caseFile: any, filePath: string) {
  const evidenceStatus = caseFile.evidence_status ?? {};
  const attribution = caseFile.attribution ?? {};
  const outcome = caseFile.outcome ?? null;

  const relevantEvidenceCount = Number(evidenceStatus.relevant_evidence_count ?? 0);
  const evidenceQuality = evidenceStatus.evidence_quality ?? "unknown";

  const scores = {
    market_effect: Number(attribution.market_effect?.score ?? 0),
    portfolio_effect: Number(attribution.portfolio_effect?.score ?? 0),
    operational_effect: Number(attribution.operational_effect?.score ?? 0),
    policy_effect: Number(attribution.policy_effect?.score ?? 0),
    unknown_effect: Number(attribution.unknown_effect?.score ?? 0),
  };

  const knownScores = [
    scores.market_effect,
    scores.portfolio_effect,
    scores.operational_effect,
    scores.policy_effect,
  ];

  const knownEffectMax = Math.max(...knownScores);
  const unknownDominant = scores.unknown_effect > knownEffectMax;

  let readiness_status = "INVESTIGATION_REQUIRED";
  const reasons: string[] = [];

  if (outcome?.primary_driver) {
    readiness_status = "OUTCOME_REVIEW_REQUIRED";
    reasons.push("Case already has an outcome. Use outcome justification audit.");
  } else if (relevantEvidenceCount >= 3 && evidenceQuality === "good" && !unknownDominant) {
    readiness_status = "READY_FOR_CLOSURE_HIGH";
    reasons.push("Good evidence, sufficient relevant evidence, and known attribution dominates unknown effect.");
  } else if (relevantEvidenceCount >= 1 && ["limited", "good"].includes(evidenceQuality) && !unknownDominant) {
    readiness_status = "READY_FOR_CLOSURE_MEDIUM";
    reasons.push("Some relevant evidence exists and known attribution is stronger than unknown effect.");
  } else if (relevantEvidenceCount >= 1 && ["limited", "good"].includes(evidenceQuality)) {
    readiness_status = "NEEDS_ATTRIBUTION_REVIEW";
    reasons.push("Relevant evidence exists, but unknown effect still dominates attribution scores.");
  } else {
    readiness_status = "NEEDS_MORE_EVIDENCE";
    reasons.push("No relevant evidence strong enough to support closure.");
  }

  return {
    case_id: caseFile.case_id,
    file_path: filePath,
    case_status: caseFile.case_status,
    conclusion_status: caseFile.conclusion_status,
    series_no: caseFile.series_no,
    series_name: caseFile.series_name,
    period: caseFile.period,
    has_outcome: Boolean(outcome?.primary_driver),
    current_outcome: outcome,
    evidence_quality: evidenceQuality,
    relevant_evidence_count: relevantEvidenceCount,
    attribution_scores: scores,
    known_effect_max: knownEffectMax,
    unknown_dominant: unknownDominant,
    readiness_status,
    reasons,
  };
}

fs.mkdirSync(outputDir, { recursive: true });

const caseFiles = fs
  .readdirSync(casesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

const audits = caseFiles.map((file) => {
  const filePath = path.join(casesDir, file);
  return readinessForCase(readJson(filePath), filePath);
});

const byStatus = audits.reduce<Record<string, number>>((acc, audit) => {
  acc[audit.readiness_status] = (acc[audit.readiness_status] ?? 0) + 1;
  return acc;
}, {});

const output = {
  closure_readiness_audit_version: "closure-readiness-audit-v0.1",
  generated_at: new Date().toISOString(),
  policy: {
    principle:
      "Cases should only become historical experience when evidence and attribution are strong enough to support closure.",
    production_mutation_allowed: false,
  },
  summary: {
    total_cases: audits.length,
    by_status: byStatus,
  },
  audits,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  closure_readiness_audit_version: output.closure_readiness_audit_version,
  total_cases: output.summary.total_cases,
  by_status: output.summary.by_status,
  output: outputPath,
});
