import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/historical-replay/m355381/historical-case-candidates-v0.1.json";

const outputDir = "data/historical-replay/m355381/investigation-packages";
const outputPath =
  "data/historical-replay/m355381/historical-investigation-packages-v0.1.json";

const MAX_CASES = 25;

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function periodYear(period: string) {
  const match = period.match(/^(\d{4})/);
  return match ? match[1] : "";
}

function driverCandidates(seriesName: string, direction: string) {
  const lower = seriesName.toLowerCase();

  const drivers = [
    {
      driver_id: "MKT_001",
      driver_name: "Global Demand Surge",
      applies_when:
        "Output rises due to stronger global or regional end-demand.",
    },
    {
      driver_id: "MKT_002",
      driver_name: "Inventory Cycle / Restocking",
      applies_when:
        "Output rises or falls due to inventory correction, stockpiling, or restocking.",
    },
    {
      driver_id: "MKT_003",
      driver_name: "Export Demand Weakness",
      applies_when:
        "Output falls due to weak external demand or export-market slowdown.",
    },
    {
      driver_id: "MKT_004",
      driver_name: "Capacity Expansion",
      applies_when:
        "Output rises due to new capacity, plant ramp-up, or production expansion.",
    },
    {
      driver_id: "MKT_005",
      driver_name: "Operational Disruption",
      applies_when:
        "Output falls due to maintenance, shutdowns, supply constraints, plant disruptions, or COVID restrictions.",
    },
    {
      driver_id: "MKT_006",
      driver_name: "Policy / Regulatory Impact",
      applies_when:
        "Output changes due to regulation, tax, trade restrictions, incentives, or government policy.",
    },
  ];

  if (lower.includes("petroleum")) {
    drivers.unshift({
      driver_id: "MKT_007",
      driver_name: "Energy Demand / Refining Cycle",
      applies_when:
        "Petroleum output changes due to fuel demand, refining margins, travel demand, or refinery maintenance.",
    });
  }

  if (lower.includes("semiconductor") || lower.includes("electronics")) {
    drivers.unshift({
      driver_id: "MKT_008",
      driver_name: "Semiconductor / Electronics Cycle",
      applies_when:
        "Electronics output changes due to semiconductor demand, chip shortages, data-center demand, consumer electronics demand, or inventory cycle.",
    });
  }

  if (lower.includes("biomedical") || lower.includes("pharmaceutical")) {
    drivers.unshift({
      driver_id: "MKT_009",
      driver_name: "Biomedical / Pharmaceutical Production Cycle",
      applies_when:
        "Biomedical output changes due to pharmaceutical batch production, medical technology demand, plant schedules, or healthcare demand.",
    });
  }

  if (direction === "decrease") {
    drivers.unshift({
      driver_id: "MKT_010",
      driver_name: "Demand Shock / External Downturn",
      applies_when:
        "Output falls sharply due to broad demand shock, recession, pandemic disruption, or external downturn.",
    });
  }

  return drivers;
}

function buildQueries(candidate: any) {
  const year = periodYear(candidate.period);
  const series = candidate.series_name;
  const direction =
    candidate.direction === "increase" ? "increase growth surge" : "decline fall contraction";

  return {
    official_queries: [
      `Singapore ${series} manufacturing output ${candidate.period}`,
      `Singapore Monthly Manufacturing Performance ${candidate.period}`,
      `Singapore EDB ${series} output ${candidate.period}`,
      `Singapore industrial production ${series} ${candidate.period}`,
    ],
    industry_queries: [
      `${series} ${direction} ${year} Singapore`,
      `${series} manufacturing ${direction} ${year}`,
      `${series} output driver ${year}`,
    ],
    context_queries: [
      `Singapore manufacturing ${year} COVID supply chain semiconductor petroleum biomedical`,
      `global ${series} demand ${year}`,
      `${series} market cycle ${year}`,
    ],
  };
}

function buildHypotheses(candidate: any) {
  const direction =
    candidate.direction === "increase" ? "increase" : "decrease";

  return [
    {
      hypothesis_id: "HYP_MARKET_DEMAND",
      hypothesis:
        direction === "increase"
          ? "The movement may reflect stronger global or regional demand."
          : "The movement may reflect weaker global or regional demand.",
      attribution_bucket: "market_effect",
    },
    {
      hypothesis_id: "HYP_INVENTORY_CYCLE",
      hypothesis:
        "The movement may reflect inventory correction, stockpiling, or restocking.",
      attribution_bucket: "portfolio_effect",
    },
    {
      hypothesis_id: "HYP_OPERATIONAL",
      hypothesis:
        "The movement may reflect operational disruption, plant maintenance, shutdowns, production ramp-up, or capacity changes.",
      attribution_bucket: "operational_effect",
    },
    {
      hypothesis_id: "HYP_POLICY",
      hypothesis:
        "The movement may reflect policy, regulatory, trade, tax, or incentive changes.",
      attribution_bucket: "policy_effect",
    },
    {
      hypothesis_id: "HYP_UNKNOWN",
      hypothesis:
        "The movement is statistically significant but currently lacks sufficient explanatory evidence.",
      attribution_bucket: "unknown_effect",
    },
  ];
}

fs.mkdirSync(outputDir, { recursive: true });

const source = readJson(sourcePath);
const candidates = (source.candidates ?? [])
  .filter((c: any) => ["critical", "high"].includes(c.priority))
  .slice(0, MAX_CASES);

const packages = candidates.map((candidate: any) => {
  const pkg = {
    investigation_package_version: "historical-investigation-package-v0.1",
    generated_at: new Date().toISOString(),
    case_id: candidate.case_id,
    sandbox_only: true,
    production_mutation_allowed: false,
    source_candidate_file: sourcePath,
    case_summary: {
      period: candidate.period,
      series_no: candidate.series_no,
      series_name: candidate.series_name,
      priority: candidate.priority,
      direction: candidate.direction,
      latest_value: candidate.observation.latest_value,
      month_on_month_change_pct:
        candidate.observation.month_on_month_change_pct,
      year_on_year_change_pct:
        candidate.observation.year_on_year_change_pct,
    },
    search_queries: buildQueries(candidate),
    hypotheses: buildHypotheses(candidate),
    driver_candidates: driverCandidates(
      candidate.series_name,
      candidate.direction
    ),
    investigation_status: {
      evidence_collected: false,
      attribution_scored: false,
      outcome_ready: false,
    },
  };

  const filePath = path.join(
    outputDir,
    `${slug(candidate.case_id)}-investigation-package-v0.1.json`
  );

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));

  return {
    ...pkg,
    package_file: filePath,
  };
});

const output = {
  historical_investigation_packages_version:
    "historical-investigation-packages-v0.1",
  generated_at: new Date().toISOString(),
  policy: {
    principle:
      "Historical investigation packages turn candidate cases into auditable search plans, hypotheses, and driver candidates. They do not mutate production cases.",
    production_mutation_allowed: false,
  },
  source_candidate_file: sourcePath,
  summary: {
    candidate_cases_available: source.candidates?.length ?? 0,
    packages_generated: packages.length,
    max_cases: MAX_CASES,
    selected_priorities: ["critical", "high"],
  },
  packages,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  historical_investigation_packages_version:
    output.historical_investigation_packages_version,
  ...output.summary,
  output: outputPath,
  package_dir: outputDir,
});
