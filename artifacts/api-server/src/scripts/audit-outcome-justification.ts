import fs from "node:fs";
import path from "node:path";

const casesDir = "data/cases";
const outputDir = "data/intelligence";
const outputPath = path.join(outputDir, "outcome-justification-audit-v0.1.json");

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function scoreCase(caseFile: any, filePath: string) {
  const outcome = caseFile.outcome ?? null;
  const evidenceStatus = caseFile.evidence_status ?? {};
  const attribution = caseFile.attribution ?? {};
  const confidenceReason = caseFile.confidence_reason ?? {};

  const relevantEvidenceCount = Number(evidenceStatus.relevant_evidence_count ?? 0);
  const evidenceQuality = evidenceStatus.evidence_quality ?? "unknown";
  const relevantEvidence = safeArray(evidenceStatus.relevant_evidence);

  const scores = {
    market_effect: Number(attribution.market_effect?.score ?? 0),
    portfolio_effect: Number(attribution.portfolio_effect?.score ?? 0),
    operational_effect: Number(attribution.operational_effect?.score ?? 0),
    policy_effect: Number(attribution.policy_effect?.score ?? 0),
    unknown_effect: Number(attribution.unknown_effect?.score ?? 0),
  };

  const knownEffectMax = Math.max(
    scores.market_effect,
    scores.portfolio_effect,
    scores.operational_effect,
    scores.policy_effect
  );

  const hasOutcome = Boolean(outcome?.primary_driver);
  const isClosed = caseFile.case_status === "closed" || caseFile.conclusion_status === "attributed";

  const warnings: string[] = [];

  if (hasOutcome && relevantEvidenceCount === 0) {
    warnings.push("Outcome exists but relevant_evidence_count is zero.");
  }

  if (hasOutcome && evidenceQuality === "poor") {
    warnings.push("Outcome exists but evidence_quality is poor.");
  }

  if (hasOutcome && scores.unknown_effect > knownEffectMax) {
    warnings.push("Unknown effect score is higher than all known attribution effect scores.");
  }

  if (hasOutcome && outcome.confidence === "high" && relevantEvidenceCount === 0) {
    warnings.push("High-confidence outcome has no relevant evidence.");
  }

  if (hasOutcome && outcome.confidence === "high" && evidenceQuality === "poor") {
    warnings.push("High-confidence outcome has poor evidence quality.");
  }

  let auditStatus = "no_outcome";

  if (hasOutcome && warnings.length === 0) {
    auditStatus = "justified";
  } else if (hasOutcome && warnings.length > 0) {
    auditStatus = "needs_review";
  }

  return {
    case_id: caseFile.case_id,
    file_path: filePath,
    case_status: caseFile.case_status,
    conclusion_status: caseFile.conclusion_status,
    is_closed_or_attributed: isClosed,
    has_outcome: hasOutcome,
    primary_driver: outcome?.primary_driver ?? null,
    primary_driver_name: outcome?.primary_driver_name ?? null,
    outcome_confidence: outcome?.confidence ?? null,
    evidence_quality: evidenceQuality,
    relevant_evidence_count: relevantEvidenceCount,
    relevant_evidence_sample_count: relevantEvidence.length,
    attribution_scores: scores,
    confidence_reason: confidenceReason,
    audit_status: auditStatus,
    warnings,
  };
}

if (!fs.existsSync(casesDir)) {
  console.error(`Missing cases directory: ${casesDir}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const caseFiles = fs
  .readdirSync(casesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

const audits = caseFiles.map((file) => {
  const filePath = path.join(casesDir, file);
  return scoreCase(readJson(filePath), filePath);
});

const summary = {
  total_cases: audits.length,
  cases_with_outcome: audits.filter((x) => x.has_outcome).length,
  justified_outcomes: audits.filter((x) => x.audit_status === "justified").length,
  outcomes_needing_review: audits.filter((x) => x.audit_status === "needs_review").length,
  cases_without_outcome: audits.filter((x) => x.audit_status === "no_outcome").length,
};

const output = {
  outcome_justification_audit_version: "outcome-justification-audit-v0.1",
  generated_at: new Date().toISOString(),
  policy: {
    principle:
      "Closed outcomes should be auditable. High confidence requires supporting evidence and should not rely primarily on unknown attribution.",
    production_mutation_allowed: false,
  },
  summary,
  audits,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  outcome_justification_audit_version: output.outcome_justification_audit_version,
  ...summary,
  output: outputPath,
});
