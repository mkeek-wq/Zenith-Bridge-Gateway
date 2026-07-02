import fs from "fs";
import path from "path";

const ROOT = process.cwd();

type CaseEvidenceConfig = {
  case_id: string;
  file_path: string;
  replay_decision_date: string;
  evidence_records: any[];
};

const CASES: CaseEvidenceConfig[] = [
  {
    case_id: "SG-GOODS-EXPORTS-2020",
    file_path:
      "data/replay/wave-1/evidence-files/SG-GOODS-EXPORTS-2020-replay-evidence-v0.1.json",
    replay_decision_date: "2020-12-31",
    evidence_records: [
      {
        evidence_id: "SG-GOODS-EXPORTS-2020-EV001",
        metric: "GOODS_EXPORTS",
        observed_period: "2020",
        publication_date: "2020-12-18",
        source_name: "Enterprise Singapore / SingStat",
        source_url_or_reference: "official_goods_exports_statistics",
        value_or_qualitative_finding:
          "Goods export conditions showed trade stress and external demand pressure during 2020.",
        lineage_note:
          "Official trade statistics placeholder; exact URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-GOODS-EXPORTS-2020-EV002",
        metric: "GLOBAL_TRADE_VOLUME",
        observed_period: "2020",
        publication_date: "2020-12-15",
        source_name: "WTO / CPB / World Bank",
        source_url_or_reference: "global_trade_2020_context",
        value_or_qualitative_finding:
          "Global trade volume weakened sharply during the 2020 COVID shock.",
        lineage_note:
          "Global trade context placeholder; exact source URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-GOODS-EXPORTS-2020-EV003",
        metric: "GLOBAL_PMI",
        observed_period: "2020",
        publication_date: "2020-12-05",
        source_name: "S&P Global / JPMorgan Global PMI",
        source_url_or_reference: "global_pmi_2020_context",
        value_or_qualitative_finding:
          "Global manufacturing and demand conditions weakened during 2020.",
        lineage_note:
          "Macro context placeholder; exact source reference required before production use.",
        future_leakage_check: "pending_validation",
      },
    ],
  },
  {
    case_id: "SG-LABOUR-MARKET-2020",
    file_path:
      "data/replay/wave-1/evidence-files/SG-LABOUR-MARKET-2020-replay-evidence-v0.1.json",
    replay_decision_date: "2020-12-31",
    evidence_records: [
      {
        evidence_id: "SG-LABOUR-MARKET-2020-EV001",
        metric: "UNEMPLOYMENT_RATE",
        observed_period: "2020",
        publication_date: "2020-12-15",
        source_name: "Ministry of Manpower Singapore",
        source_url_or_reference: "labour_market_report_2020",
        value_or_qualitative_finding:
          "Labour market weakened during the 2020 COVID shock.",
        lineage_note:
          "Official labour market source placeholder; exact URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-LABOUR-MARKET-2020-EV002",
        metric: "RETRENCHMENTS",
        observed_period: "2020",
        publication_date: "2020-12-15",
        source_name: "Ministry of Manpower Singapore",
        source_url_or_reference: "retrenchment_statistics_2020",
        value_or_qualitative_finding:
          "Retrenchment pressure increased during the 2020 downturn.",
        lineage_note:
          "Official labour market source placeholder; exact URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-LABOUR-MARKET-2020-EV003",
        metric: "POLICY_SUPPORT",
        observed_period: "2020",
        publication_date: "2020-12-31",
        source_name: "Singapore Government / MOM / MOF",
        source_url_or_reference: "jobs_support_and_labour_policy_context",
        value_or_qualitative_finding:
          "Policy support was deployed to cushion employment impact.",
        lineage_note:
          "Policy support source placeholder; exact URL required before production use.",
        future_leakage_check: "pending_validation",
      },
    ],
  },
  {
    case_id: "SG-FINANCE-2020",
    file_path:
      "data/replay/wave-1/evidence-files/SG-FINANCE-2020-replay-evidence-v0.1.json",
    replay_decision_date: "2020-12-31",
    evidence_records: [
      {
        evidence_id: "SG-FINANCE-2020-EV001",
        metric: "MARKET_VOLATILITY",
        observed_period: "2020",
        publication_date: "2020-12-15",
        source_name: "MAS / SGX / market statistics",
        source_url_or_reference: "market_volatility_2020_context",
        value_or_qualitative_finding:
          "Financial markets experienced elevated volatility during the 2020 COVID shock.",
        lineage_note:
          "Market statistics placeholder; exact source URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-FINANCE-2020-EV002",
        metric: "CREDIT_CONDITIONS",
        observed_period: "2020",
        publication_date: "2020-12-20",
        source_name: "MAS",
        source_url_or_reference: "credit_conditions_2020_context",
        value_or_qualitative_finding:
          "Credit and financial conditions were affected by the 2020 macro shock.",
        lineage_note:
          "MAS source placeholder; exact source URL required before production use.",
        future_leakage_check: "pending_validation",
      },
      {
        evidence_id: "SG-FINANCE-2020-EV003",
        metric: "INTEREST_RATES",
        observed_period: "2020",
        publication_date: "2020-12-10",
        source_name: "MAS / global rates context",
        source_url_or_reference: "interest_rate_2020_context",
        value_or_qualitative_finding:
          "Rates and liquidity conditions reflected global monetary easing during 2020.",
        lineage_note:
          "Rates context placeholder; exact source URL required before production use.",
        future_leakage_check: "pending_validation",
      },
    ],
  },
];

function main() {
  const populated: any[] = [];

  for (const config of CASES) {
    const file = JSON.parse(
      fs.readFileSync(path.join(ROOT, config.file_path), "utf8")
    );

    const updated = {
      ...file,
      evidence_status: "populated_pending_validation",
      replay_execution_status: "not_ready_validation_required",
      replay_decision_date: config.replay_decision_date,
      evidence_records: config.evidence_records,
    };

    fs.writeFileSync(
      path.join(ROOT, config.file_path),
      JSON.stringify(updated, null, 2)
    );

    populated.push({
      case_id: config.case_id,
      evidence_records: config.evidence_records.length,
      output: config.file_path,
    });
  }

  console.log({
    populator_version: "wave-1-batch-evidence-populator-v0.1",
    cases_populated: populated.length,
  });

  for (const p of populated) {
    console.log(`${p.case_id} | records=${p.evidence_records}`);
  }
}

main();
