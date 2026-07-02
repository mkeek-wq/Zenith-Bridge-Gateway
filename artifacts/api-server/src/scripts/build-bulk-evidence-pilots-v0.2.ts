import fs from "node:fs";
import path from "node:path";

const outputDir = "data/historical-replay/m355381/evidence-pilots";

type DriverTheme =
  | "semiconductor"
  | "chemicals"
  | "precision"
  | "transport"
  | "biomedical"
  | "petroleum"
  | "demand_shock"
  | "inventory_cycle"
  | "capacity_expansion"
  | "operational_disruption";

type BulkCase = {
  case_id: string;
  period: string;
  series_name: string;
  theme: DriverTheme;
  direction: "growth" | "contraction" | "mixed";
};

function evidenceFor(item: BulkCase): string[] {
  const y = item.period;
  const series = item.series_name;

  if (item.theme === "semiconductor") {
    return [
      `Singapore ${series} output in ${y} was shaped by semiconductor demand, electronics demand, and global technology-cycle conditions.`,
      `Chip shortage conditions, wafer demand, foundry demand, memory demand, and logic chip demand affected production patterns.`,
      `Consumer electronics demand, data center chips, and export demand influenced semiconductor-related activity.`,
      `Inventory restocking, channel inventory, and customer inventory conditions shaped the electronics cycle.`
    ];
  }

  if (item.theme === "chemicals") {
    return [
      `Singapore ${series} output in ${y} was influenced by chemical demand, petrochemical demand, and downstream industrial activity.`,
      `Basic chemicals, specialty chemicals, chemical production, and petrochemical production reflected regional manufacturing demand.`,
      `Feedstock prices and naphtha prices affected margins, plant utilisation, and production decisions.`,
      `Chemical plant and petrochemical plant operations shaped output patterns during the year.`
    ];
  }

  if (item.theme === "precision") {
    return [
      `Singapore ${series} output in ${y} was shaped by machinery demand, capital equipment demand, and industrial equipment demand.`,
      `Equipment orders, automation equipment, and semiconductor equipment demand affected engineering output.`,
      `Capital spending, investment demand, and the capex cycle influenced precision engineering activity.`,
      `Manufacturing customers adjusted orders as global demand and production cycles changed.`
    ];
  }

  if (item.theme === "transport") {
    return [
      `Singapore ${series} output in ${y} was shaped by transport engineering, aerospace demand, and aviation recovery conditions.`,
      `Aircraft maintenance, aircraft repair, MRO demand, and fleet maintenance affected aerospace-related activity.`,
      `Marine engineering, ship repair, and offshore engineering influenced transport engineering output.`,
      `Travel recovery and regional industrial activity shaped the sector's production cycle.`
    ];
  }

  if (item.theme === "biomedical") {
    return [
      `Singapore ${series} output in ${y} was influenced by pharmaceutical batch production, drug production, and biologics production.`,
      `Healthcare demand, medical technology demand, and vaccine production shaped selected biomedical activities.`,
      `Plant schedule effects and batch production cycles affected output movements during the year.`,
      `Biomedical manufacturing reflected product mix, production timing, and healthcare-related demand.`
    ];
  }

  if (item.theme === "petroleum") {
    return [
      `Singapore ${series} output in ${y} was influenced by oil demand, fuel demand, jet fuel demand, and petroleum demand.`,
      `Refining margin, crude oil conditions, and travel demand affected refining-cycle activity.`,
      `Refinery maintenance and operational factors shaped petroleum-related output patterns.`,
      `Energy demand and logistics activity influenced manufacturing movements during the year.`
    ];
  }

  if (item.theme === "demand_shock") {
    return [
      `Singapore ${series} output in ${y} was affected by a demand shock, external downturn, and weak global demand conditions.`,
      `Export decline, lower exports, order slowdown, and trade slowdown weighed on production activity.`,
      `A sharp demand fall and global recession conditions transmitted into Singapore's industrial base.`,
      `Manufacturing output reflected weaker external demand and disruption to regional activity.`
    ];
  }

  if (item.theme === "inventory_cycle") {
    return [
      `Singapore ${series} output in ${y} was influenced by inventory restocking, customer inventory, and channel inventory conditions.`,
      `Stockpiling and inventory correction affected production timing and order patterns.`,
      `Inventory drawdown and changing customer orders shaped manufacturing activity.`,
      `The sector reflected a portfolio effect rather than a pure demand signal.`
    ];
  }

  if (item.theme === "capacity_expansion") {
    return [
      `Singapore ${series} output in ${y} was influenced by capacity expansion and production ramp-up activity.`,
      `A new plant, new facility, higher capacity, and capacity addition affected production levels.`,
      `Investment activity and ramp up conditions shaped output movements.`,
      `Production increased as facilities came online and operational capacity improved.`
    ];
  }

  return [
    `Singapore ${series} output in ${y} was affected by maintenance shutdown, plant shutdown, and production disruption.`,
    `Supply disruption, factory closure, covid restrictions, and supply constraints affected production.`,
    `Operational disruption rather than demand alone shaped output movements.`,
    `Plant-level constraints and supply conditions affected manufacturing performance.`
  ];
}

const cases: BulkCase[] = [
  // Semiconductor / Electronics depth
  { case_id: "SG-SEMICONDUCTOR-2018", period: "2018", series_name: "Semiconductors", theme: "semiconductor", direction: "growth" },
  { case_id: "SG-SEMICONDUCTOR-2019", period: "2019", series_name: "Semiconductors", theme: "inventory_cycle", direction: "contraction" },
  { case_id: "SG-SEMICONDUCTOR-2022", period: "2022", series_name: "Semiconductors", theme: "semiconductor", direction: "growth" },
  { case_id: "SG-SEMICONDUCTOR-2023", period: "2023", series_name: "Semiconductors", theme: "inventory_cycle", direction: "contraction" },
  { case_id: "SG-ELECTRONICS-2018", period: "2018", series_name: "Electronics", theme: "semiconductor", direction: "growth" },
  { case_id: "SG-ELECTRONICS-2019", period: "2019", series_name: "Electronics", theme: "inventory_cycle", direction: "contraction" },
  { case_id: "SG-ELECTRONICS-2023", period: "2023", series_name: "Electronics", theme: "inventory_cycle", direction: "contraction" },

  // Chemicals / Petrochemicals depth
  { case_id: "SG-CHEMICALS-2018", period: "2018", series_name: "Chemicals", theme: "chemicals", direction: "growth" },
  { case_id: "SG-CHEMICALS-2019", period: "2019", series_name: "Chemicals", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-CHEMICALS-2022", period: "2022", series_name: "Chemicals", theme: "chemicals", direction: "mixed" },
  { case_id: "SG-PETROCHEMICALS-2018", period: "2018", series_name: "Petrochemicals", theme: "chemicals", direction: "growth" },
  { case_id: "SG-PETROCHEMICALS-2019", period: "2019", series_name: "Petrochemicals", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-PETROCHEMICALS-2020", period: "2020", series_name: "Petrochemicals", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-PETROCHEMICALS-2023", period: "2023", series_name: "Petrochemicals", theme: "chemicals", direction: "mixed" },

  // Precision Engineering depth
  { case_id: "SG-PRECISION-ENGINEERING-2018", period: "2018", series_name: "Precision Engineering", theme: "precision", direction: "growth" },
  { case_id: "SG-PRECISION-ENGINEERING-2019", period: "2019", series_name: "Precision Engineering", theme: "precision", direction: "mixed" },
  { case_id: "SG-PRECISION-ENGINEERING-2023", period: "2023", series_name: "Precision Engineering", theme: "inventory_cycle", direction: "contraction" },
  { case_id: "SG-MACHINERY-2020", period: "2020", series_name: "Machinery", theme: "precision", direction: "contraction" },
  { case_id: "SG-MACHINERY-2021", period: "2021", series_name: "Machinery", theme: "precision", direction: "growth" },
  { case_id: "SG-MACHINERY-2022", period: "2022", series_name: "Machinery", theme: "precision", direction: "growth" },

  // Transport Engineering depth
  { case_id: "SG-TRANSPORT-ENGINEERING-2018", period: "2018", series_name: "Transport Engineering", theme: "transport", direction: "growth" },
  { case_id: "SG-TRANSPORT-ENGINEERING-2019", period: "2019", series_name: "Transport Engineering", theme: "transport", direction: "mixed" },
  { case_id: "SG-TRANSPORT-ENGINEERING-2023", period: "2023", series_name: "Transport Engineering", theme: "transport", direction: "growth" },
  { case_id: "SG-AEROSPACE-2020", period: "2020", series_name: "Aerospace", theme: "transport", direction: "contraction" },
  { case_id: "SG-AEROSPACE-2021", period: "2021", series_name: "Aerospace", theme: "transport", direction: "growth" },
  { case_id: "SG-AEROSPACE-2022", period: "2022", series_name: "Aerospace", theme: "transport", direction: "growth" },

  // Biomedical depth
  { case_id: "SG-BIOMEDICAL-2018", period: "2018", series_name: "Biomedical Manufacturing", theme: "biomedical", direction: "mixed" },
  { case_id: "SG-BIOMEDICAL-2019", period: "2019", series_name: "Biomedical Manufacturing", theme: "biomedical", direction: "mixed" },
  { case_id: "SG-BIOMEDICAL-2023", period: "2023", series_name: "Biomedical Manufacturing", theme: "biomedical", direction: "mixed" },
  { case_id: "SG-PHARMACEUTICALS-2020", period: "2020", series_name: "Pharmaceuticals", theme: "biomedical", direction: "growth" },
  { case_id: "SG-PHARMACEUTICALS-2021", period: "2021", series_name: "Pharmaceuticals", theme: "biomedical", direction: "growth" },
  { case_id: "SG-PHARMACEUTICALS-2022", period: "2022", series_name: "Pharmaceuticals", theme: "biomedical", direction: "mixed" },

  // Petroleum / refining depth
  { case_id: "SG-PETROLEUM-2018", period: "2018", series_name: "Petroleum", theme: "petroleum", direction: "growth" },
  { case_id: "SG-PETROLEUM-2019", period: "2019", series_name: "Petroleum", theme: "petroleum", direction: "mixed" },
  { case_id: "SG-PETROLEUM-2021", period: "2021", series_name: "Petroleum", theme: "petroleum", direction: "growth" },
  { case_id: "SG-PETROLEUM-2022", period: "2022", series_name: "Petroleum", theme: "petroleum", direction: "growth" },
  { case_id: "SG-REFINING-2020", period: "2020", series_name: "Refining", theme: "operational_disruption", direction: "contraction" },
  { case_id: "SG-REFINING-2021", period: "2021", series_name: "Refining", theme: "petroleum", direction: "growth" },

  // Demand shock / weak external demand examples
  { case_id: "SG-MANUFACTURING-2001", period: "2001", series_name: "Total Manufacturing", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-MANUFACTURING-2008", period: "2008", series_name: "Total Manufacturing", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-MANUFACTURING-2009", period: "2009", series_name: "Total Manufacturing", theme: "demand_shock", direction: "contraction" },
  { case_id: "SG-MANUFACTURING-2020-SHOCK", period: "2020", series_name: "Total Manufacturing", theme: "demand_shock", direction: "contraction" },

  // Operational disruption examples
  { case_id: "SG-OPERATIONS-2020-COVID", period: "2020", series_name: "Manufacturing Operations", theme: "operational_disruption", direction: "contraction" },
  { case_id: "SG-OPERATIONS-2021-SUPPLY", period: "2021", series_name: "Manufacturing Operations", theme: "operational_disruption", direction: "mixed" },
  { case_id: "SG-OPERATIONS-2022-SUPPLY", period: "2022", series_name: "Manufacturing Operations", theme: "operational_disruption", direction: "mixed" },

  // Capacity expansion examples
  { case_id: "SG-CAPACITY-EXPANSION-2018", period: "2018", series_name: "Manufacturing Capacity", theme: "capacity_expansion", direction: "growth" },
  { case_id: "SG-CAPACITY-EXPANSION-2021", period: "2021", series_name: "Manufacturing Capacity", theme: "capacity_expansion", direction: "growth" },
  { case_id: "SG-CAPACITY-EXPANSION-2022", period: "2022", series_name: "Manufacturing Capacity", theme: "capacity_expansion", direction: "growth" }
];

fs.mkdirSync(outputDir, { recursive: true });

let written = 0;
let skipped = 0;

for (const item of cases) {
  const outputPath = path.join(outputDir, `${item.case_id}-evidence-v0.1.json`);

  if (fs.existsSync(outputPath)) {
    skipped += 1;
    continue;
  }

  const output = {
    historical_evidence_pilot_version: "historical-evidence-pilot-v0.1",
    case_id: item.case_id,
    period: item.period,
    series_name: item.series_name,
    source_context:
      "Bulk sandbox historical replay evidence pilot v0.2. Synthetic seed evidence for attribution-learning pipeline testing; not production evidence.",
    governance: {
      sandbox_only: true,
      bulk_seed: true,
      synthetic_seed_evidence: true,
      manual_review_required: true,
      production_mutation_allowed: false
    },
    replay_metadata: {
      theme: item.theme,
      direction: item.direction
    },
    evidence_items: evidenceFor(item)
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  written += 1;
}

console.log({
  bulk_evidence_pilots_version: "bulk-evidence-pilots-v0.2",
  target_dir: outputDir,
  cases_defined: cases.length,
  written,
  skipped
});
