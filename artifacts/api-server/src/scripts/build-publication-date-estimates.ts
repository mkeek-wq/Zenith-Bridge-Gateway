import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const OUTPUT_DIR = "data/replay-sandbox";
const OUTPUT = path.join(
  OUTPUT_DIR,
  "publication-date-registry-v0.1.json",
);

function estimatePublicationDateFromPeriod(
  period: string | null,
): string | null {
  if (!period) return null;

  const match = period.match(/^(\d{4})\s+([A-Za-z]{3})$/);

  if (!match) return null;

  const [, yearText, monthText] = match;

  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const monthIndex = monthMap[monthText];

  if (monthIndex === undefined) return null;

  const year = Number(yearText);

  // Conservative first estimate:
  // monthly economic releases are often available in the following month.
  // Use the 26th of the following month until official release dates are stored.
  const publicationDate = new Date(Date.UTC(year, monthIndex + 1, 26));

  return publicationDate.toISOString().slice(0, 10);
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const now = new Date().toISOString();

  const caseIndex = await readJson(
    path.join(CASE_DIR, "case-index-v0.1.json"),
  );

  const records = [];

  for (const item of caseIndex.cases ?? []) {
    const caseFile = await readJson(item.file);

    const existingPublicationDate =
      caseFile.publication_date ??
      caseFile.source_publication_date ??
      null;

    const estimatedPublicationDate =
      existingPublicationDate ??
      estimatePublicationDateFromPeriod(caseFile.period ?? null);

    const method = existingPublicationDate
      ? "case_file_publication_date"
      : "estimated_from_observation_period";

    const confidence = existingPublicationDate ? "high" : "medium";

    records.push({
      case_id: caseFile.case_id,
      case_file: item.file,
      country: caseFile.country ?? null,
      source_system: caseFile.source_system ?? null,
      table_id: caseFile.table_id ?? null,
      series_no: caseFile.series_no ?? null,
      series_name: caseFile.series_name ?? null,
      observation_period: caseFile.period ?? null,
      publication_date: estimatedPublicationDate,
      publication_date_source: method,
      publication_date_confidence: confidence,
      governance_note: existingPublicationDate
        ? "Publication date found in case file."
        : "Estimated date. Replace with official release/publication date when available.",
    });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const output = {
    publication_date_registry_version:
      "publication-date-registry-v0.1",
    generated_at: now,
    methodology: {
      principle:
        "Replay should use publication dates to determine information availability. Estimated dates must be marked as estimates.",
      current_estimation_rule:
        "For monthly periods like '2026 Apr', estimate publication_date as the 26th day of the following month.",
      confidence_policy: {
        official_or_case_file_date: "high",
        estimated_from_observation_period: "medium",
        missing_or_unparseable: "low",
      },
    },
    summary: {
      records: records.length,
      high_confidence: records.filter(
        (item) => item.publication_date_confidence === "high",
      ).length,
      medium_confidence: records.filter(
        (item) =>
          item.publication_date_confidence === "medium",
      ).length,
      missing_publication_date: records.filter(
        (item) => !item.publication_date,
      ).length,
    },
    records,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log({
    publication_date_registry_version:
      "publication-date-registry-v0.1",
    records: records.length,
    high_confidence: output.summary.high_confidence,
    medium_confidence: output.summary.medium_confidence,
    missing_publication_date:
      output.summary.missing_publication_date,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
