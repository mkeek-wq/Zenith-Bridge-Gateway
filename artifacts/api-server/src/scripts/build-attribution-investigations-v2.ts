import { readFile, writeFile } from "node:fs/promises";

const INVESTIGATION_INPUT =
  "data/investigations/m355381-investigation-candidates-v0.1.json";

const RELEVANCE_INPUT =
  "data/investigations/m355381-evidence-relevance-v0.1-approved.json";

const OUTPUT =
  "data/investigations/m355381-attribution-investigations-v0.2.json";

function priorityFromMove(candidate: any): string {
  const yoy = Math.abs(candidate.year_on_year_change_pct ?? 0);
  const mom = Math.abs(candidate.month_on_month_change_pct ?? 0);

  if (yoy >= 75 || mom >= 30) return "critical";
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
  const investigation = JSON.parse(await readFile(INVESTIGATION_INPUT, "utf8"));
  const relevance = JSON.parse(await readFile(RELEVANCE_INPUT, "utf8"));

  const relevanceBySeries = new Map(
    relevance.packages.map((p: any) => [p.series_no, p]),
  );

  const investigations = investigation.candidates.map((candidate: any) => {
    const relevancePackage = relevanceBySeries.get(candidate.series_no) as any;

    return {
      attribution_version: "attribution-investigation-v0.2",

      table_id: investigation.table_id,
      period: investigation.period,

      series_no: candidate.series_no,
      series_name: candidate.series_name,

      investigation_priority: priorityFromMove(candidate),
      attribution_status: "investigation_open",

      observation: {
        latest_value: candidate.latest_value,
        month_on_month_change_pct: candidate.month_on_month_change_pct,
        year_on_year_change_pct: candidate.year_on_year_change_pct,
      },

      evidence_status: {
        internal_evidence_count: relevancePackage?.internal_evidence_count ?? 0,
        relevant_evidence_count: relevancePackage?.relevant_evidence_count ?? 0,
        evidence_quality: relevancePackage?.evidence_quality ?? "unknown",
        external_search_required: relevancePackage?.external_search_required ?? true,
        relevant_evidence: relevancePackage?.relevant_evidence ?? [],
      },

      attribution: attributionBuckets(),

      analyst_note:
        "Attribution starts as unknown. Movement data and evidence quality are preserved through lineage. Move weight into market, portfolio, operational or policy buckets only after supporting evidence is collected.",

      conclusion_status: "no_conclusion_yet",
    };
  });

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source_investigation_file: INVESTIGATION_INPUT,
        source_relevance_file: RELEVANCE_INPUT,
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
