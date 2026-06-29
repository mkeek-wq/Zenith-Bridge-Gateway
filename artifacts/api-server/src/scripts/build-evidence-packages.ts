import { readFile, writeFile } from "node:fs/promises";

const INVESTIGATION_INPUT =
  "data/investigations/m355381-investigation-candidates-v0.1.json";

const SEARCH_INPUT =
  "data/investigations/m355381-evidence-search-packages-v0.1.json";

const OUTPUT =
  "data/investigations/m355381-evidence-packages-v0.1.json";

function classifyMove(changePct: number | null | undefined): string {
  if (changePct == null) return "unknown";
  if (changePct >= 25) return "large_positive";
  if (changePct >= 10) return "moderate_positive";
  if (changePct <= -25) return "large_negative";
  if (changePct <= -10) return "moderate_negative";
  return "normal";
}

function requiredEvidence(seriesName: string) {
  return [
    {
      evidence_type: "dataset_evidence",
      description: `Confirm the ${seriesName} movement in the official SingStat TableBuilder time series.`,
      status: "available",
    },
    {
      evidence_type: "institution_narrative",
      description: `Look for EDB, MTI, SingStat or other official commentary explaining the ${seriesName} movement.`,
      status: "required",
    },
    {
      evidence_type: "industry_context",
      description: `Look for industry-level context that may explain demand, supply, production, pricing or capacity changes for ${seriesName}.`,
      status: "required",
    },
    {
      evidence_type: "operational_context",
      description: `Check whether the movement may reflect one-off operational events such as maintenance, shutdowns, disruptions or plant-specific effects.`,
      status: "required",
    },
    {
      evidence_type: "global_market_context",
      description: `Check whether the movement aligns with global or regional market trends.`,
      status: "required",
    },
  ];
}

async function main() {
  const investigation = JSON.parse(
    await readFile(INVESTIGATION_INPUT, "utf8"),
  );

  const search = JSON.parse(
    await readFile(SEARCH_INPUT, "utf8"),
  );

  const searchBySeries = new Map(
    search.packages.map((p: any) => [p.series_no, p]),
  );

  const evidencePackages = investigation.candidates.map((candidate: any) => {
    const searchPackage = searchBySeries.get(candidate.series_no);

    return {
      evidence_package_version: "evidence-package-v0.1",
      status: "awaiting_evidence",

      table_id: investigation.table_id,
      period: investigation.period,

      series_no: candidate.series_no,
      series_name: candidate.series_name,

      observation: {
        latest_value: candidate.latest_value,
        month_on_month_change_pct: candidate.month_on_month_change_pct,
        year_on_year_change_pct: candidate.year_on_year_change_pct,
        month_on_month_move_class: classifyMove(candidate.month_on_month_change_pct),
        year_on_year_move_class: classifyMove(candidate.year_on_year_change_pct),
      },

      evidence_required: requiredEvidence(candidate.series_name),

      evidence_found: [
        {
          evidence_type: "dataset_evidence",
          source: "SingStat TableBuilder",
          status: "confirmed",
          note: "Movement detected from normalized official dataset context package.",
        },
      ],

      research_queries: searchPackage
        ? {
            institution_queries: searchPackage.institution_queries,
            industry_queries: searchPackage.industry_queries,
            operational_queries: searchPackage.operational_queries,
            global_queries: searchPackage.global_queries,
          }
        : null,

      hypotheses: [],

      analyst_note:
        "Observation confirmed from official dataset. No causal explanation assigned until supporting evidence is collected.",

      conclusion_status: "no_conclusion_yet",
      confidence: "unknown",
    };
  });

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_investigation_file: INVESTIGATION_INPUT,
        source_search_file: SEARCH_INPUT,
        evidence_packages: evidencePackages,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        evidence_packages_created: evidencePackages.length,
        output: OUTPUT,
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
