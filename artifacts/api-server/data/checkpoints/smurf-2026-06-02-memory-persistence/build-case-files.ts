import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INPUT =
  "data/investigations/m355381-attribution-investigations-v0.2.json";

const CASE_DIR =
  "data/cases";

const INDEX_OUTPUT =
  "data/cases/case-index-v0.1.json";

function safeSeriesNo(value: string): string {
  return value.replace(/\./g, "_");
}

function safePeriod(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function nextAction(investigation: any): string {
  const evidenceQuality = investigation.evidence_status?.evidence_quality;

  if (evidenceQuality === "poor") return "collect_external_evidence";
  if (evidenceQuality === "limited") return "collect_additional_evidence";

  return "review_for_attribution";
}

function confidenceFromEvidence(investigation: any): string {
  const evidenceQuality = investigation.evidence_status?.evidence_quality;

  if (evidenceQuality === "good") return "medium";
  if (evidenceQuality === "limited") return "low";

  return "unknown";
}

async function readExistingCase(outputPath: string): Promise<any | null> {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return null;
  }
}

function buildFreshCase(
  investigation: any,
  caseId: string,
  now: string,
) {
  return {
    case_version: "case-file-v0.1",

    case_id: caseId,
    country: "Singapore",
    institution: "Economic Development Board",
    source_system: "SingStat TableBuilder",

    table_id: investigation.table_id,
    period: investigation.period,

    series_no: investigation.series_no,
    series_name: investigation.series_name,

    case_status: "investigating",
    priority: investigation.investigation_priority,
    confidence: confidenceFromEvidence(investigation),

    conclusion_status:
      investigation.conclusion_status ??
      "no_conclusion_yet",

    opened_at: now,
    last_updated_at: now,

    observation: investigation.observation,
    evidence_status: investigation.evidence_status,
    attribution: investigation.attribution,

    workflow: {
      next_action: nextAction(investigation),
      publication_status: "not_published",
    },

    analyst_note:
      "Persistent case file created from attribution investigation. Case remains open until evidence supports attribution or formal closure.",

    outcome: {
      primary_driver: null,
      primary_driver_name: null,
      confidence: null,
      closed_at: null,
    },
  };
}

function mergePersistentCase(
  freshCase: any,
  existingCase: any | null,
  investigation: any,
  now: string,
) {
  if (!existingCase) {
    return freshCase;
  }

  const isClosed =
    existingCase.case_status === "closed" ||
    existingCase.conclusion_status === "attributed";

  return {
    ...freshCase,

    // Preserve stable identity and lifecycle continuity.
    opened_at:
      existingCase.opened_at ??
      freshCase.opened_at,

    case_status:
      existingCase.case_status ??
      freshCase.case_status,

    conclusion_status:
      existingCase.conclusion_status ??
      freshCase.conclusion_status,

    // Preserve analyst/manual intelligence fields.
    outcome:
      existingCase.outcome ??
      freshCase.outcome,

    confidence_reason:
      existingCase.confidence_reason,

    analyst_note:
      existingCase.analyst_note ??
      freshCase.analyst_note,

    // Preserve publication state while allowing next_action to update
    // only for non-closed cases.
    workflow: {
      ...(freshCase.workflow ?? {}),
      ...(existingCase.workflow ?? {}),

      next_action: isClosed
        ? "none"
        : nextAction(investigation),

      publication_status:
        existingCase.workflow?.publication_status ??
        freshCase.workflow?.publication_status ??
        "not_published",
    },

    // Preserve current confidence for closed/attributed cases.
    // Otherwise allow later confidence engine to update it.
    confidence: isClosed
      ? existingCase.confidence
      : freshCase.confidence,

    last_updated_at: now,
  };
}

async function main() {
  await mkdir(CASE_DIR, { recursive: true });

  const input = JSON.parse(await readFile(INPUT, "utf8"));
  const now = new Date().toISOString();

  const caseIndex: any[] = [];

  for (const investigation of input.investigations) {
    const caseId =
      `SG-${investigation.table_id}-${safeSeriesNo(investigation.series_no)}-${safePeriod(investigation.period)}`;

    const filename =
      `case-${caseId}.json`;

    const outputPath =
      path.join(CASE_DIR, filename);

    const existingCase =
      await readExistingCase(outputPath);

    const freshCase =
      buildFreshCase(investigation, caseId, now);

    const caseFile =
      mergePersistentCase(
        freshCase,
        existingCase,
        investigation,
        now,
      );

    await writeFile(
      outputPath,
      JSON.stringify(caseFile, null, 2),
      "utf8",
    );

    caseIndex.push({
      case_id: caseId,
      file: outputPath,
      country: caseFile.country,
      table_id: caseFile.table_id,
      period: caseFile.period,
      series_no: caseFile.series_no,
      series_name: caseFile.series_name,
      case_status: caseFile.case_status,
      priority: caseFile.priority,
      confidence: caseFile.confidence,
      conclusion_status:
        caseFile.conclusion_status,
      evidence_quality:
        caseFile.evidence_status?.evidence_quality,
      next_action:
        caseFile.workflow.next_action,
      publication_status:
        caseFile.workflow.publication_status,
      opened_at: caseFile.opened_at,
      last_updated_at: caseFile.last_updated_at,
      outcome:
        caseFile.outcome,
    });
  }

  await writeFile(
    INDEX_OUTPUT,
    JSON.stringify(
      {
        case_index_version: "case-index-v0.1",
        generated_at: now,
        source_file: INPUT,
        cases: caseIndex,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        case_builder_version: "case-file-v0.2-persistent-merge",
        cases_processed: caseIndex.length,
        case_dir: CASE_DIR,
        index: INDEX_OUTPUT,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
