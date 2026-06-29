import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const OUTPUT =
  "data/intelligence/case-fingerprints-v0.1.json";

function yoyBand(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 100) return "GT_100";
  if (abs >= 50) return "50_TO_100";
  if (abs >= 25) return "25_TO_50";

  return "LT_25";
}

function momBand(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 20) return "GT_20";
  if (abs >= 10) return "10_TO_20";
  if (abs >= 5) return "5_TO_10";

  return "LT_5";
}

function deriveSector(seriesName: string): string {
  const value = seriesName.toLowerCase();

  if (
    value.includes("electronics") ||
    value.includes("semiconductor") ||
    value.includes("semiconductors") ||
    value.includes("infocomms")
  ) {
    return "electronics";
  }

  if (
    value.includes("biomedical") ||
    value.includes("pharmaceutical") ||
    value.includes("pharmaceuticals") ||
    value.includes("medical technology")
  ) {
    return "biomedical";
  }

  if (
    value.includes("transport") ||
    value.includes("aerospace") ||
    value.includes("land")
  ) {
    return "transport";
  }

  if (
    value.includes("petroleum") ||
    value.includes("petrochemical") ||
    value.includes("chemical")
  ) {
    return "chemicals";
  }

  return "manufacturing";
}

async function main() {
  const files = await readdir(CASE_DIR);

  const caseFiles = files.filter(
    (f) =>
      f.startsWith("case-SG-") &&
      f.endsWith(".json"),
  );

  const fingerprints = [];

  for (const file of caseFiles) {
    const caseFile = JSON.parse(
      await readFile(
        path.join(CASE_DIR, file),
        "utf8",
      ),
    );

    fingerprints.push({
      case_id: caseFile.case_id,

      sector: deriveSector(
        caseFile.series_name,
      ),

      priority:
        caseFile.priority,

      confidence:
        caseFile.confidence,

      evidence_quality:
        caseFile.evidence_status
          ?.evidence_quality ?? "unknown",

      yoy_band: yoyBand(
        caseFile.observation
          ?.year_on_year_change_pct ?? 0,
      ),

      mom_band: momBand(
        caseFile.observation
          ?.month_on_month_change_pct ?? 0,
      ),
    });
  }

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        fingerprint_version:
          "case-fingerprint-v0.1",
        generated_at:
          new Date().toISOString(),
        fingerprints,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log({
    fingerprint_version:
      "case-fingerprint-v0.1",
    fingerprints_generated:
      fingerprints.length,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
