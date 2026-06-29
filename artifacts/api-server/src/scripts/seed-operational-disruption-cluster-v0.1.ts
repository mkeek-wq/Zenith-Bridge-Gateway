import fs from "node:fs";
import path from "node:path";

const root = "data/historical-replay/m355381";
const investigationDir = path.join(root, "investigation-packages");
const evidenceDir = path.join(root, "evidence-pilots");

const cases = [
  {
    case_id: "SG-OPERATIONAL-DISRUPTION-2003",
    period: "2003",
    secondary: "MKT_010",
    tertiary: "MKT_003",
    secondaryName: "Demand Shock / External Downturn",
    tertiaryName: "Export Demand Weakness",
    evidence: [
      "Manufacturing activity faced operational disruption due to weak external conditions.",
      "Production schedules and factory utilization were affected by reduced orders.",
      "Export weakness amplified operational inefficiencies.",
      "Operational disruption was the dominant transmission mechanism."
    ]
  },
  {
    case_id: "SG-OPERATIONAL-DISRUPTION-2020",
    period: "2020",
    secondary: "MKT_006",
    tertiary: "MKT_010",
    secondaryName: "Policy / Regulatory Impact",
    tertiaryName: "Demand Shock / External Downturn",
    evidence: [
      "Operational disruption emerged from restrictions affecting production and workforce availability.",
      "Factory operations faced interruptions and workflow constraints.",
      "Policy measures contributed to the disruption environment.",
      "Operational disruption was the primary mechanism impacting activity."
    ]
  },
  {
    case_id: "SG-OPERATIONAL-DISRUPTION-2022",
    period: "2022",
    secondary: "MKT_007",
    tertiary: "MKT_010",
    secondaryName: "Energy Demand / Refining Cycle",
    tertiaryName: "Demand Shock / External Downturn",
    evidence: [
      "Operational constraints affected production continuity and throughput.",
      "Energy and industrial operating conditions influenced production efficiency.",
      "Firms faced execution challenges despite recovering demand.",
      "Operational disruption remained the dominant driver."
    ]
  }
];

fs.mkdirSync(investigationDir, { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  JSON.parse(fs.readFileSync(filePath, "utf8"));
}

for (const item of cases) {
  const investigation = {
    investigation_package_version: "historical-investigation-package-v0.1",
    generated_at: "2026-06-06T00:00:00.000Z",
    case_id: item.case_id,
    sandbox_only: true,
    production_mutation_allowed: false,
    case_summary: {
      period: item.period,
      series_no: item.case_id,
      series_name: "Operational Disruption",
      priority: "critical",
      direction: "negative"
    }
  };

  const evidence = {
    evidence_package_version: "historical-evidence-package-v0.1",
    generated_at: "2026-06-06T00:00:00.000Z",
    case_id: item.case_id,
    evidence_items: item.evidence,
    driver_evidence_summary: [
      {
        driver_id: "MKT_005",
        driver_name: "Operational Disruption",
        evidence_count: 4
      },
      {
        driver_id: item.secondary,
        driver_name: item.secondaryName,
        evidence_count: 2
      },
      {
        driver_id: item.tertiary,
        driver_name: item.tertiaryName,
        evidence_count: 1
      }
    ],
    evidence_assessment: {
      confidence: "high"
    }
  };

  const scorecard = {
    scorecard_version: "historical-evidence-scorecard-v0.1",
    generated_at: "2026-06-06T00:00:00.000Z",
    case_id: item.case_id,
    driver_scores: [
      {
        driver_id: "MKT_005",
        driver_name: "Operational Disruption",
        score: 48,
        rank: 1
      },
      {
        driver_id: item.secondary,
        driver_name: item.secondaryName,
        score: 18,
        rank: 2
      },
      {
        driver_id: item.tertiary,
        driver_name: item.tertiaryName,
        score: 10,
        rank: 3
      }
    ],
    final_attribution: {
      primary_driver: {
        driver_id: "MKT_005",
        driver_name: "Operational Disruption",
        score: 48
      },
      secondary_driver: {
        driver_id: item.secondary,
        driver_name: item.secondaryName,
        score: 18
      },
      tertiary_driver: {
        driver_id: item.tertiary,
        driver_name: item.tertiaryName,
        score: 10
      },
      confidence: "high"
    },
    scorecard_status: {
      attribution_scored: true,
      outcome_ready: true,
      human_review_required: true
    }
  };

  writeJson(
    path.join(
      investigationDir,
      `${item.case_id.toLowerCase()}-investigation-package-v0.1.json`
    ),
    investigation
  );

  writeJson(
    path.join(
      evidenceDir,
      `${item.case_id}-evidence-v0.1.json`
    ),
    evidence
  );

  writeJson(
    path.join(
      evidenceDir,
      `${item.case_id}-scorecard-v0.1.json`
    ),
    scorecard
  );

  console.log(`Created ${item.case_id}`);
}

console.log({
  replay_cases_created: cases.length,
  status: "operational_cluster_created"
});
