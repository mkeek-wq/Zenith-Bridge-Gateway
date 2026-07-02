import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";

const CASE_FILE_PREFIX = "case-SG-";
const CASE_FILE_SUFFIX = ".json";

type Confidence =
  | "unknown"
  | "low"
  | "medium"
  | "high";

function deriveConfidence(caseFile: any): {
  confidence: Confidence;
  confidence_reason: any;
} {
  const relevantEvidence =
    caseFile.evidence_status?.relevant_evidence_count ?? 0;

  const evidenceQuality =
    caseFile.evidence_status?.evidence_quality ?? "unknown";

  const unknownEffect =
    caseFile.attribution?.unknown_effect?.score ?? 10;

  const conclusionStatus =
    caseFile.conclusion_status ?? "no_conclusion_yet";

  if (relevantEvidence === 0) {
    return {
      confidence: "unknown",
      confidence_reason: {
        rule_applied: "UNKNOWN_V1",
        relevant_evidence_count: relevantEvidence,
        evidence_quality: evidenceQuality,
        unknown_effect: unknownEffect,
        conclusion_status: conclusionStatus,
      },
    };
  }

  if (unknownEffect >= 8) {
    return {
      confidence: "low",
      confidence_reason: {
        rule_applied: "LOW_V1",
        relevant_evidence_count: relevantEvidence,
        evidence_quality: evidenceQuality,
        unknown_effect: unknownEffect,
        conclusion_status: conclusionStatus,
      },
    };
  }

  if (unknownEffect <= 2) {
    return {
      confidence: "high",
      confidence_reason: {
        rule_applied: "HIGH_V1",
        relevant_evidence_count: relevantEvidence,
        evidence_quality: evidenceQuality,
        unknown_effect: unknownEffect,
        conclusion_status: conclusionStatus,
      },
    };
  }

  return {
    confidence: "medium",
    confidence_reason: {
      rule_applied: "MEDIUM_V1",
      relevant_evidence_count: relevantEvidence,
      evidence_quality: evidenceQuality,
      unknown_effect: unknownEffect,
      conclusion_status: conclusionStatus,
    },
  };
}

async function main() {
  const files = await readdir(CASE_DIR);

  const caseFiles = files
    .filter((file) => file.startsWith(CASE_FILE_PREFIX))
    .filter((file) => file.endsWith(CASE_FILE_SUFFIX))
    .sort();

  const updates = [];

  for (const file of caseFiles) {
    const fullPath = path.join(CASE_DIR, file);

    const caseFile = JSON.parse(
      await readFile(fullPath, "utf8"),
    );

    const previousConfidence =
      caseFile.confidence ?? "unknown";

    const result = deriveConfidence(caseFile);

    caseFile.confidence = result.confidence;
    caseFile.confidence_reason =
      result.confidence_reason;

    await writeFile(
      fullPath,
      JSON.stringify(caseFile, null, 2),
      "utf8",
    );

    updates.push({
      case_id: caseFile.case_id,
      previous_confidence: previousConfidence,
      next_confidence: result.confidence,
      rule: result.confidence_reason.rule_applied,
    });
  }

  console.log({
    confidence_engine_version: "case-confidence-v0.1",
    cases_evaluated: updates.length,
    updates,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
