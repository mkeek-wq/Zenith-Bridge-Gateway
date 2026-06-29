import fs from "node:fs";
import path from "node:path";

const outputDir = "data/historical-replay/m355381/evidence-pilots";

type BulkCase = {
  case_id: string;
  period: string;
  series_name: string;
  evidence_items: string[];
};

const cases: BulkCase[] = [
  {
    case_id: "SG-ELECTRONICS-2020",
    period: "2020",
    series_name: "Electronics",
    evidence_items: [
      "Singapore electronics output in 2020 was influenced by electronics demand, semiconductor demand, and work-from-home demand.",
      "Global chip shortage conditions and consumer electronics demand affected electronics production patterns.",
      "Data center chips and wafer demand supported parts of the electronics manufacturing base.",
      "Supply constraints and changing export demand shaped electronics output during the year."
    ]
  },
  {
    case_id: "SG-ELECTRONICS-2022",
    period: "2022",
    series_name: "Electronics",
    evidence_items: [
      "Singapore electronics output in 2022 reflected semiconductor demand, electronics demand, and shifts in consumer electronics orders.",
      "Memory demand, logic chip demand, and foundry demand affected semiconductor-related electronics activity.",
      "Customer inventory and channel inventory conditions influenced electronics production cycles.",
      "Export demand and order growth shaped electronics manufacturing performance."
    ]
  },
  {
    case_id: "SG-CHEMICALS-2020",
    period: "2020",
    series_name: "Chemicals",
    evidence_items: [
      "Singapore chemicals output in 2020 was affected by chemical demand, petrochemical demand, and weaker regional industrial activity.",
      "Basic chemicals and specialty chemicals production reflected shifts in downstream manufacturing demand.",
      "Feedstock prices and naphtha prices influenced chemical production economics.",
      "Chemical plant utilisation and petrochemical plant operations shaped output patterns."
    ]
  },
  {
    case_id: "SG-CHEMICALS-2023",
    period: "2023",
    series_name: "Chemicals",
    evidence_items: [
      "Singapore chemicals output in 2023 reflected chemicals demand, petrochemical demand, and downstream industrial conditions.",
      "Specialty chemicals and basic chemicals production moved with regional manufacturing demand.",
      "Feedstock prices and naphtha prices affected petrochemical margins and production decisions.",
      "Chemical plant and petrochemical plant utilisation shaped the sector's output cycle."
    ]
  },
  {
    case_id: "SG-PRECISION-ENGINEERING-2020",
    period: "2020",
    series_name: "Precision Engineering",
    evidence_items: [
      "Singapore precision engineering output in 2020 was affected by machinery demand and industrial equipment demand.",
      "Capital equipment demand and equipment orders weakened as manufacturers delayed investment demand.",
      "Automation equipment and semiconductor equipment demand influenced engineering output.",
      "Capex cycle and capital spending decisions shaped precision engineering activity."
    ]
  },
  {
    case_id: "SG-PRECISION-ENGINEERING-2022",
    period: "2022",
    series_name: "Precision Engineering",
    evidence_items: [
      "Singapore precision engineering output in 2022 was supported by machinery demand and capital equipment demand.",
      "Industrial equipment demand and equipment orders reflected stronger investment demand.",
      "Automation equipment and semiconductor equipment demand contributed to engineering output.",
      "Capital spending and the capex cycle supported precision engineering activity."
    ]
  },
  {
    case_id: "SG-TRANSPORT-ENGINEERING-2020",
    period: "2020",
    series_name: "Transport Engineering",
    evidence_items: [
      "Singapore transport engineering output in 2020 was affected by weak aerospace demand and reduced aircraft maintenance activity.",
      "Aircraft repair and MRO demand were constrained by lower travel demand and reduced fleet maintenance needs.",
      "Marine engineering and ship repair activity reflected offshore engineering and regional industrial conditions.",
      "Aviation recovery had not yet started, limiting transport engineering production."
    ]
  },
  {
    case_id: "SG-TRANSPORT-ENGINEERING-2022",
    period: "2022",
    series_name: "Transport Engineering",
    evidence_items: [
      "Singapore transport engineering output in 2022 was supported by aviation recovery and stronger aerospace demand.",
      "Aircraft maintenance, aircraft repair, and MRO demand improved as travel recovery continued.",
      "Marine engineering and ship repair activity reflected offshore engineering and regional industrial activity.",
      "Fleet maintenance and aviation recovery shaped the transport engineering cycle."
    ]
  },
  {
    case_id: "SG-BIOMEDICAL-2020",
    period: "2020",
    series_name: "Biomedical Manufacturing",
    evidence_items: [
      "Singapore biomedical manufacturing output in 2020 was influenced by drug production and healthcare demand.",
      "Pharmaceutical batch production and biologics production shaped output movements.",
      "Plant schedule effects and medical technology demand affected biomedical manufacturing.",
      "Vaccine production and healthcare demand supported selected biomedical activities."
    ]
  },
  {
    case_id: "SG-BIOMEDICAL-2022",
    period: "2022",
    series_name: "Biomedical Manufacturing",
    evidence_items: [
      "Singapore biomedical manufacturing output in 2022 reflected pharmaceutical batch production and drug production cycles.",
      "Biologics production and plant schedule effects shaped biomedical manufacturing movements.",
      "Healthcare demand and medical technology demand supported selected production areas.",
      "Vaccine production patterns affected biomedical output during the year."
    ]
  }
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
      "Bulk sandbox historical replay evidence pilot. Synthetic seed evidence for attribution-learning pipeline testing; not production evidence.",
    governance: {
      sandbox_only: true,
      bulk_seed: true,
      manual_review_required: true,
      production_mutation_allowed: false
    },
    evidence_items: item.evidence_items
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  written += 1;
}

console.log({
  bulk_evidence_pilots_version: "bulk-evidence-pilots-v0.1",
  target_dir: outputDir,
  cases_defined: cases.length,
  written,
  skipped
});
