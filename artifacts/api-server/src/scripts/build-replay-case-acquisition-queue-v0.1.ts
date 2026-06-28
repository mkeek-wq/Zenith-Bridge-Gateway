import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const gapPath = path.join(
  apiRoot,
  "data/replay/replay-mechanism-gap-report-v0.1.json"
);

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-case-acquisition-queue-v0.1.json"
);

const gapReport = JSON.parse(fs.readFileSync(gapPath, "utf8"));

const suggestionLibrary: Record<string, string[]> = {
  ENERGY_PRICE_SHOCK: ["1979 oil shock", "1990 Gulf War oil shock", "2022 European gas shock"],
  INFLATION_PRESSURE: ["1970s stagflation", "2022 global inflation shock", "1980 Volcker tightening"],
  SUPPLY_CHAIN_DISRUPTION: ["COVID supply chain crisis", "2011 Japan earthquake supply shock", "2021 Suez blockage"],
  SHIPPING_CONGESTION: ["2021 global shipping congestion", "Singapore port congestion during COVID", "Suez Canal blockage"],
  CREDIT_STRESS: ["Asian Financial Crisis", "Global Financial Crisis", "Euro debt crisis"],
  GLOBAL_DEMAND_WEAKNESS: ["China slowdown 2015", "Global Financial Crisis demand collapse", "Semiconductor downturn 2019"],
  INVENTORY_CORRECTION: ["Semiconductor inventory correction 2019", "Electronics downturn 2023", "PC inventory correction 2022"],
  DEMAND_SHOCK: ["SARS tourism shock", "COVID services shock", "Global Financial Crisis demand shock"],
  TRADE_DISRUPTION: ["Russia sanctions 2022", "US-China trade war", "Brexit trade disruption"],
  SANCTIONS_SHOCK: ["Russia sanctions 2022", "Iran sanctions tightening", "Trade embargo case study"],
  POLICY_TIGHTENING: ["Singapore property cooling measures", "China property deleveraging", "Fed tightening 2022"],
  LABOUR_SUPPLY_CONSTRAINT: ["Singapore reopening labour shortage", "Post-COVID labour shortage", "Construction labour shortage"],
  COMMODITY_PRICE_SHOCK: ["Oil price collapse 2014", "Commodity supercycle 2000s", "Nickel price shock 2022"],
  MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY: ["Singapore manufacturing recovery 2021", "US industrial production recovery 2010", "China industrial recovery 2016"],
  CHINA_SLOWDOWN: ["China industrial slowdown 2015", "China property slowdown 2022", "China reopening disappointment 2023"],
  CAPITAL_OUTFLOW: ["Asian Financial Crisis 1997", "Taper Tantrum 2013", "Turkey currency crisis 2018"],
  VALUATION_RESET: ["Dotcom crash 2000", "Global tech selloff 2022", "China internet stock reset 2021"],
  SOVEREIGN_RISK: ["Euro debt crisis 2011", "Greece debt crisis 2010", "Argentina sovereign default 2001"],
  SUPPLY_SHOCK: ["1973 oil shock", "2011 Japan earthquake supply shock", "COVID factory shutdowns 2020"],
  CAPEX_CYCLE_DOWNTURN: ["Oil capex downturn 2014", "Semiconductor capex correction 2019", "Mining capex downturn 2012"],
  INVENTORY_STRESS: ["COVID inventory stress 2021", "Semiconductor shortage 2021", "Retail inventory overhang 2022"],
  SECTOR_SPECIFIC_DEMAND_SURGE: ["Biomedical demand surge 2020", "Semiconductor demand surge 2021", "E-commerce logistics surge 2020"],
  HEALTHCARE_DEMAND_SHOCK: ["COVID healthcare demand shock 2020", "H1N1 healthcare demand shock 2009", "SARS healthcare shock 2003"],
  GLOBAL_DEMAND_RECOVERY: ["Global manufacturing recovery 2010", "Post-COVID goods demand recovery 2021", "China reopening recovery 2023"],
  INVENTORY_REBUILD: ["Semiconductor inventory rebuild 2021", "Automotive inventory rebuild 2022", "Retail restocking cycle 2021"],
  CAPACITY_EXPANSION: ["Semiconductor capacity expansion 2021", "LNG capacity expansion cycle", "Data center capacity expansion 2023"]
};

function suggestionsFor(mechanism: string): string[] {
  return suggestionLibrary[mechanism] ?? [
    `${mechanism} historical case 1`,
    `${mechanism} historical case 2`,
    `${mechanism} historical case 3`
  ];
}

const queue = (gapReport.gaps ?? [])
  .slice(0, 20)
  .map((gap: any, index: number) => ({
    queue_id: `REPLAY_ACQ_${String(index + 1).padStart(3, "0")}`,
    mechanism: gap.mechanism,
    priority: gap.priority,
    coverage_band: gap.coverage_band,
    current_case_count: gap.current_case_count,
    target_case_count: gap.target_case_count,
    missing_case_count: gap.missing_case_count,
    suggested_cases: suggestionsFor(gap.mechanism),
    status: "candidate_for_research"
  }));

const output = {
  version: "replay-case-acquisition-queue-v0.1",
  generated_at: new Date().toISOString(),
  source_gap_report: gapPath,
  queue_count: queue.length,
  queue
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  acquisition_queue: output.version,
  queue_count: output.queue_count,
  output: outputPath
});
