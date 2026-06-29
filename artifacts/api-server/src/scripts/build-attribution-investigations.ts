import { readFile, writeFile } from "node:fs/promises";

const INPUT =
  "data/investigations/m355381-evidence-relevance-v0.1-approved.json";

const OUTPUT =
  "data/investigations/m355381-attribution-investigations-v0.1.json";

function priorityFromMove(pkg: any): string {
  const yoy = Math.abs(pkg.year_on_year_change_pct ?? 0);
  const mom = Math.abs(pkg.month_on_month_change_pct ?? 0);

  if (yoy >= 50 || mom >= 25) return "high";
  if (yoy >= 25 || mom >= 10) return "medium";
  return "low";
}

function attributionBuckets() {
  return {
    market_effect: {
      score: 0,
      evidence: [],
      note: "External or global market movement, demand cycle, regional industry trend.",
    },
    portfolio_effect: {
      score: 0,
      evidence: [],
      note: "Composition effect within Singapore manufacturing or sub-sector mix.",
    },
    operational_effect: {
      score: 0,
      evidence: [],
      note: "Maintenance, shutdown, disruption, capacity change, plant-level event.",
    },
    policy_effect: {
      score: 0,
      evidence: [],
      note: "Regulatory, tax, incentive, trade restriction, or government policy driver.",
    },
    unknown_effect: {
      score: 10,
      evidence: [],
      note: "Default bucket. Movement is confirmed but not yet explained by evidence.",
    },
  };
}

async function main() {
  const input = JSON.parse(await readFile(INPUT, "utf8"));

  const investigations = input.packages.map((pkg: any) => ({
    attribution_version: "attribution-investigation-v0.1",

    table_id: "M355381",
    period: "2026 Apr",

    series_no: pkg.series_no,
    series_name: pkg.series_name,

    investigation_priority: priorityFromMove(pkg),
    attribution_status: "investigation_open",

    observation: {
      internal_evidence_count: pkg.internal_evidence_count,
      relevant_evidence_count: pkg.relevant_evidence_count,
      evidence_quality: pkg.evidence_quality,
      external_search_required: pkg.external_search_required,
    },

    attribution: attributionBuckets(),

    analyst_note:
      "Attribution starts as unknown. Move weight into market, portfolio, operational or policy buckets only after supporting evidence is collected.",

    conclusion_status: "no_conclusion_yet",
  }));

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_file: INPUT,
        investigations,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        investigations_created: investigations.length,
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
