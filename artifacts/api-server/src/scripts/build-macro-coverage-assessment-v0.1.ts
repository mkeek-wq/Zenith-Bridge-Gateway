import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const HARDENING_QUEUE_PATH =
  "data/intelligence/macro-specificity-hardening-queue-v0.1.json";

const SECTOR_REGISTRY_PATH =
  "data/intelligence/sector-macro-registry-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/macro-coverage-assessment-v0.1.json";

function readJson(relPath: string): any {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing input: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function coverageBand(score: number): string {
  if (score >= 0.85) return "well_hardened";
  if (score >= 0.6) return "partially_hardened";
  if (score >= 0.35) return "thin_but_improving";
  return "still_under_hardened";
}

function main() {
  const queueData = readJson(HARDENING_QUEUE_PATH);
  const sectorRegistry = readJson(SECTOR_REGISTRY_PATH);

  const indicators = sectorRegistry.indicators ?? [];
  const hardeningQueue = queueData.hardening_queue ?? [];

  const assessments = hardeningQueue.map((q: any) => {
    const relevantIndicators = indicators.filter((i: any) =>
      (i.replay_cases_supported ?? []).includes(q.case_id)
    );

    const sectorSpecific = relevantIndicators.filter(
      (i: any) => i.macro_category === "sector_specific"
    );

    const mechanismSpecific = relevantIndicators.filter(
      (i: any) => i.macro_category === "mechanism_specific"
    );

    const sourceIdentified = relevantIndicators.filter((i: any) =>
      ["source_identified", "source_verified", "lineage_complete"].includes(
        i.lineage_status
      )
    );

    const dryRunReady = relevantIndicators.filter((i: any) =>
      ["dry_run_ready", "staged", "promoted"].includes(i.ingestion_status)
    );

    const indicatorScore = Math.min(relevantIndicators.length / 4, 1) * 0.35;
    const sectorScore = Math.min(sectorSpecific.length / 3, 1) * 0.3;
    const mechanismScore = Math.min(mechanismSpecific.length / 1, 1) * 0.2;
    const lineageScore =
      relevantIndicators.length === 0
        ? 0
        : (sourceIdentified.length / relevantIndicators.length) * 0.15;

    const coverageScore = Number(
      (indicatorScore + sectorScore + mechanismScore + lineageScore).toFixed(3)
    );

    return {
      case_id: q.case_id,
      case_label: q.case_label,
      domain: q.domain,
      original_priority: q.priority,
      trigger_band: q.trigger_band,
      recommended_indicator_count: q.recommended_hardening_actions.length,
      candidate_indicator_count: relevantIndicators.length,
      sector_specific_indicator_count: sectorSpecific.length,
      mechanism_specific_indicator_count: mechanismSpecific.length,
      source_identified_count: sourceIdentified.length,
      dry_run_ready_count: dryRunReady.length,
      coverage_score: coverageScore,
      coverage_band: coverageBand(coverageScore),
      candidate_indicators: relevantIndicators.map((i: any) => ({
        indicator_id: i.indicator_id,
        indicator_name: i.indicator_name,
        macro_category: i.macro_category,
        source_authority: i.source_authority,
        lineage_status: i.lineage_status,
        ingestion_status: i.ingestion_status,
      })),
      next_action:
        dryRunReady.length === 0
          ? "Confirm sources and mark selected indicators dry_run_ready before controlled bulk ingestion."
          : "Proceed to controlled dry-run ingestion for ready indicators.",
    };
  });

  const output = {
    assessment_version: "macro-coverage-assessment-v0.1",
    generated_at: new Date().toISOString(),
    inputs: {
      hardening_queue: HARDENING_QUEUE_PATH,
      sector_macro_registry: SECTOR_REGISTRY_PATH,
    },
    cases_assessed: assessments.length,
    well_hardened: assessments.filter(
      (a: any) => a.coverage_band === "well_hardened"
    ).length,
    partially_hardened: assessments.filter(
      (a: any) => a.coverage_band === "partially_hardened"
    ).length,
    thin_but_improving: assessments.filter(
      (a: any) => a.coverage_band === "thin_but_improving"
    ).length,
    still_under_hardened: assessments.filter(
      (a: any) => a.coverage_band === "still_under_hardened"
    ).length,
    controlled_bulk_ingestion_recommendation:
      "Do not ingest full bulk yet. First verify sources and promote a small dry-run batch of sector indicators.",
    assessments,
  };

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), JSON.stringify(output, null, 2));

  console.log({
    assessment_version: output.assessment_version,
    cases_assessed: output.cases_assessed,
    well_hardened: output.well_hardened,
    partially_hardened: output.partially_hardened,
    thin_but_improving: output.thin_but_improving,
    still_under_hardened: output.still_under_hardened,
    output: OUTPUT_PATH,
  });

  for (const a of assessments) {
    console.log(
      `${a.coverage_band} | ${a.case_id} | score=${a.coverage_score} | candidates=${a.candidate_indicator_count}`
    );
  }
}

main();
