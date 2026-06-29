import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const HISTORY_DIR = "data/case-history";
const OUTPUT_DIR = "data/replay-sandbox";
const PUBLICATION_REGISTRY =
  "data/replay-sandbox/publication-date-registry-v0.1.json";
const OUTPUT = path.join(OUTPUT_DIR, "temporal-index-v0.1.json");

function deriveObservationDate(period: string | null): string | null {
  if (!period) return null;

  const match = period.match(/^(\d{4})\s+([A-Za-z]{3})$/);
  if (!match) return null;

  const [, year, monthText] = match;

  const monthMap: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month = monthMap[monthText];
  if (!month) return null;

  return `${year}-${month}-01`;
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const now = new Date().toISOString();

  const caseIndex = await readJson(
    path.join(CASE_DIR, "case-index-v0.1.json"),
  );

  const publicationRegistry = await readJson(PUBLICATION_REGISTRY);

  const publicationLookup = new Map(
    (publicationRegistry.records ?? []).map((record: any) => [
      record.case_id,
      record,
    ]),
  );

  const temporalCases = [];

  for (const item of caseIndex.cases ?? []) {
    const caseFile = await readJson(item.file);
    const publicationRecord = publicationLookup.get(caseFile.case_id);

    let historyCreatedAt: string | null = null;
    let firstHistoryEventAt: string | null = null;
    let latestHistoryEventAt: string | null = null;

    try {
      const historyFile = await readJson(
        path.join(HISTORY_DIR, `${caseFile.case_id}.json`),
      );

      historyCreatedAt = historyFile.created_at ?? null;

      const timeline = historyFile.timeline ?? [];
      firstHistoryEventAt = timeline[0]?.timestamp ?? null;
      latestHistoryEventAt =
        timeline[timeline.length - 1]?.timestamp ?? null;
    } catch {
      historyCreatedAt = null;
      firstHistoryEventAt = null;
      latestHistoryEventAt = null;
    }

    const observationPeriod = caseFile.period ?? null;
    const observationDate = deriveObservationDate(observationPeriod);

    const publicationDate =
      publicationRecord?.publication_date ??
      caseFile.publication_date ??
      caseFile.source_publication_date ??
      null;

    const publicationDateSource =
      publicationRecord?.publication_date_source ??
      (caseFile.publication_date || caseFile.source_publication_date
        ? "case_file_publication_date"
        : null);

    const publicationDateConfidence =
      publicationRecord?.publication_date_confidence ??
      (caseFile.publication_date || caseFile.source_publication_date
        ? "high"
        : "missing");

    const ingestedAt =
      caseFile.ingested_at ??
      caseFile.opened_at ??
      firstHistoryEventAt ??
      historyCreatedAt ??
      null;

    const closedAt = caseFile.outcome?.closed_at ?? null;

    temporalCases.push({
      case_id: caseFile.case_id,
      case_file: item.file,
      country: caseFile.country ?? null,
      table_id: caseFile.table_id ?? null,
      series_no: caseFile.series_no ?? null,
      series_name: caseFile.series_name ?? null,

      observation_period: observationPeriod,
      observation_date: observationDate,

      publication_date: publicationDate,
      publication_date_status: publicationDate
        ? "available"
        : "missing",
      publication_date_source: publicationDateSource,
      publication_date_confidence: publicationDateConfidence,

      ingested_at: ingestedAt,
      opened_at: caseFile.opened_at ?? null,
      closed_at: closedAt,

      first_history_event_at: firstHistoryEventAt,
      latest_history_event_at: latestHistoryEventAt,

      replay_visibility_basis: publicationDate
        ? "publication_date"
        : "fallback_opened_at",

      replay_visible_from:
        publicationDate ??
        caseFile.opened_at ??
        firstHistoryEventAt ??
        null,

      current_case_status: caseFile.case_status ?? null,
      current_conclusion_status:
        caseFile.conclusion_status ?? null,
      current_revision_number:
        caseFile.revision_number ?? null,
    });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = {
    temporal_index_version: "temporal-index-v0.2",
    generated_at: now,
    source_case_index: path.join(CASE_DIR, "case-index-v0.1.json"),
    source_publication_registry: PUBLICATION_REGISTRY,
    temporal_policy: {
      principle:
        "Replay should use publication_date where available. opened_at is only a temporary fallback.",
      preferred_visibility_basis: "publication_date",
      fallback_visibility_basis: "opened_at",
    },
    summary: {
      cases_indexed: temporalCases.length,
      with_publication_date: temporalCases.filter(
        (item) => item.publication_date_status === "available",
      ).length,
      missing_publication_date: temporalCases.filter(
        (item) => item.publication_date_status === "missing",
      ).length,
      using_publication_date: temporalCases.filter(
        (item) =>
          item.replay_visibility_basis === "publication_date",
      ).length,
      using_fallback_opened_at: temporalCases.filter(
        (item) =>
          item.replay_visibility_basis === "fallback_opened_at",
      ).length,
      medium_confidence_publication_dates: temporalCases.filter(
        (item) => item.publication_date_confidence === "medium",
      ).length,
      high_confidence_publication_dates: temporalCases.filter(
        (item) => item.publication_date_confidence === "high",
      ).length,
    },
    cases: temporalCases,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log({
    temporal_index_version: "temporal-index-v0.2",
    cases_indexed: temporalCases.length,
    with_publication_date: output.summary.with_publication_date,
    missing_publication_date: output.summary.missing_publication_date,
    using_publication_date: output.summary.using_publication_date,
    using_fallback_opened_at:
      output.summary.using_fallback_opened_at,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
