import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/evidence-files/SG-NODX-2023-replay-evidence-v0.1.json";

function main() {
  const file = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const populated = {
    ...file,
    evidence_status: "populated_pending_validation",
    replay_execution_status: "not_ready_validation_required",
    replay_decision_date: "2023-12-31",
    evidence_records: [
      {
        evidence_id: "SG-NODX-2023-EV001",
        metric: "NODX",
        observed_period: "2023",
        publication_date: "2023-12-18",
        source_name: "Enterprise Singapore",
        source_url_or_reference: "official_trade_statistics",
        value_or_qualitative_finding: "NODX contraction observed during 2023 trade downturn",
        lineage_note: "Official Singapore trade statistic; exact source URL to be attached before production use.",
        future_leakage_check: "pending_validation"
      },
      {
        evidence_id: "SG-NODX-2023-EV002",
        metric: "GLOBAL_TRADE_VOLUME",
        observed_period: "2023",
        publication_date: "2023-12-15",
        source_name: "WTO / CPB / World Bank",
        source_url_or_reference: "global_trade_context",
        value_or_qualitative_finding: "Weak global trade conditions during 2023",
        lineage_note: "Global trade context source; exact source URL to be attached before production use.",
        future_leakage_check: "pending_validation"
      },
      {
        evidence_id: "SG-NODX-2023-EV003",
        metric: "GLOBAL_PMI",
        observed_period: "2023",
        publication_date: "2023-12-05",
        source_name: "S&P Global / JPMorgan Global PMI",
        source_url_or_reference: "global_pmi_context",
        value_or_qualitative_finding: "Soft global manufacturing demand context",
        lineage_note: "Macro context indicator; exact publication reference to be attached before production use.",
        future_leakage_check: "pending_validation"
      }
    ]
  };

  fs.writeFileSync(path.join(ROOT, INPUT), JSON.stringify(populated, null, 2));

  console.log({
    populator_version: "replay-evidence-populator-v0.1",
    case_id: populated.case_id,
    evidence_records: populated.evidence_records.length,
    output: INPUT
  });
}

main();
