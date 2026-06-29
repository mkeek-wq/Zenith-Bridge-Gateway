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

async function main() {
  await mkdir(CASE_DIR, { recursive: true });

  const input = JSON.parse(await readFile(INPUT, "utf8"));
  const now = new Date().toISOString();

  const caseIndex: any[] = [];

  for (const investigation of input.investigations) {
    const caseId =
      `SG-${investigation.table_id}-${safeSeriesNo(investigation.series_no)}-${safePeriod(investigation.period)}`;

    const caseFile = {
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
    };

    const filename =
      `case-${caseId}.json`;

    const outputPath =
      path.join(CASE_DIR, filename);

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
      evidence_quality:
        caseFile.evidence_status?.evidence_quality,
      next_action:
        caseFile.workflow.next_action,
      publication_status:
        caseFile.workflow.publication_status,
      opened_at: caseFile.opened_at,
      last_updated_at: caseFile.last_updated_at,
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
        cases_created: caseIndex.length,
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
