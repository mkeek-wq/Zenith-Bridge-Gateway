import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const CASE_INDEX = "data/cases/case-index-v0.1.json";

const CASE_FILE_PREFIX = "case-SG-";
const CASE_FILE_SUFFIX = ".json";

type CaseStatus =
  | "investigating"
  | "partially_explained"
  | "substantially_explained"
  | "closed";

function unknownEffectScore(caseFile: any): number {
  return caseFile.attribution?.unknown_effect?.score ?? 10;
}

function relevantEvidenceCount(caseFile: any): number {
  return caseFile.evidence_status?.relevant_evidence_count ?? 0;
}

function deriveCaseStatus(caseFile: any): CaseStatus {
  if (caseFile.conclusion_status === "closed") {
    return "closed";
  }

  const relevantEvidence = relevantEvidenceCount(caseFile);
  const unknownScore = unknownEffectScore(caseFile);

  if (relevantEvidence === 0) {
    return "investigating";
  }

  if (unknownScore <= 2) {
    return "substantially_explained";
  }

  if (unknownScore < 10) {
    return "partially_explained";
  }

  return "investigating";
}

function deriveNextAction(caseFile: any, nextStatus: CaseStatus): string {
  if (nextStatus === "closed") {
    return "none";
  }

  if (nextStatus === "substantially_explained") {
    return "review_for_closure";
  }

  if (nextStatus === "partially_explained") {
    return "continue_attribution_investigation";
  }

  const evidenceQuality = caseFile.evidence_status?.evidence_quality;

  if (evidenceQuality === "poor") {
    return "collect_external_evidence";
  }

  if (evidenceQuality === "limited") {
    return "collect_additional_evidence";
  }

  return "review_for_attribution";
}

async function rebuildCaseIndex() {
  const files = await readdir(CASE_DIR);
  const caseFiles = files
    .filter((file) => file.startsWith(CASE_FILE_PREFIX))
    .filter((file) => file.endsWith(CASE_FILE_SUFFIX))
    .sort();

  const cases = [];

  for (const file of caseFiles) {
    const fullPath = path.join(CASE_DIR, file);
    const caseFile = JSON.parse(await readFile(fullPath, "utf8"));

    cases.push({
      case_id: caseFile.case_id,
      file: fullPath,
      country: caseFile.country,
      table_id: caseFile.table_id,
      period: caseFile.period,
      series_no: caseFile.series_no,
      series_name: caseFile.series_name,
      case_status: caseFile.case_status,
      priority: caseFile.priority,
      confidence: caseFile.confidence,
      conclusion_status:
        caseFile.conclusion_status ?? "no_conclusion_yet",
      evidence_quality:
        caseFile.evidence_status?.evidence_quality,
      next_action:
        caseFile.workflow?.next_action,
      publication_status:
        caseFile.workflow?.publication_status,
      opened_at: caseFile.opened_at,
      last_updated_at: caseFile.last_updated_at,
    });
  }

  const output = {
    case_index_version: "case-index-v0.1",
    generated_at: new Date().toISOString(),
    source_file: "data/cases/*.json",
    cases,
  };

  await writeFile(
    CASE_INDEX,
    JSON.stringify(output, null, 2),
    "utf8",
  );
}

async function main() {
  const files = await readdir(CASE_DIR);

  const caseFiles = files
    .filter((file) => file.startsWith(CASE_FILE_PREFIX))
    .filter((file) => file.endsWith(CASE_FILE_SUFFIX));

  const updates = [];

  for (const file of caseFiles) {
    const fullPath = path.join(CASE_DIR, file);
    const caseFile = JSON.parse(await readFile(fullPath, "utf8"));

    const previousStatus = caseFile.case_status;
    const nextStatus = deriveCaseStatus(caseFile);
    const nextAction = deriveNextAction(caseFile, nextStatus);

    caseFile.case_status = nextStatus;
    caseFile.conclusion_status =
      caseFile.conclusion_status ?? "no_conclusion_yet";

    caseFile.workflow = {
      ...(caseFile.workflow ?? {}),
      next_action: nextAction,
      state_last_evaluated_at: new Date().toISOString(),
    };

    caseFile.last_updated_at = new Date().toISOString();

    await writeFile(
      fullPath,
      JSON.stringify(caseFile, null, 2),
      "utf8",
    );

    updates.push({
      case_id: caseFile.case_id,
      previous_status: previousStatus,
      next_status: nextStatus,
      next_action: nextAction,
    });
  }

  await rebuildCaseIndex();

  console.log({
    state_engine_version: "case-state-management-v0.1",
    cases_evaluated: updates.length,
    updates,
    case_index_rebuilt: CASE_INDEX,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
