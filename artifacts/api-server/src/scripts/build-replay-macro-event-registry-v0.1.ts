import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

type MacroEvent = {
  macro_event_id: string;
  label: string;
  period_start: string;
  period_end: string | null;
  event_type: string;
  geography: string[];
  anchor_role: string;
  mechanisms: string[];
  linked_scenario_types: string[];
  benchmark_use: string;
  source_status: "seed_placeholder" | "sourced";
};

const events: MacroEvent[] = [
  {
    macro_event_id: "MACRO_ASIAN_FINANCIAL_CRISIS_1997",
    label: "Asian Financial Crisis",
    period_start: "1997-07",
    period_end: "1998-12",
    event_type: "financial_conditions_shock",
    geography: ["Asia", "Singapore", "Thailand", "Indonesia", "Malaysia", "South Korea"],
    anchor_role: "Regional financial stress lighthouse",
    mechanisms: ["CAPITAL_OUTFLOW", "CURRENCY_STRESS", "CREDIT_STRESS", "DEMAND_COLLAPSE"],
    linked_scenario_types: ["financial_conditions_shock"],
    benchmark_use: "Benchmark regional credit, currency, and demand stress patterns.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_DOTCOM_BUST_2000",
    label: "Dot-com Bust",
    period_start: "2000-03",
    period_end: "2002-10",
    event_type: "technology_cycle_shock",
    geography: ["United States", "Global", "Singapore"],
    anchor_role: "Technology valuation and capex reset marker",
    mechanisms: ["VALUATION_RESET", "CAPEX_CYCLE_DOWNTURN", "DEMAND_COLLAPSE"],
    linked_scenario_types: ["electronics_cycle", "financial_conditions_shock"],
    benchmark_use: "Benchmark technology-cycle downturn and capital-market reset behaviour.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_SARS_2003",
    label: "SARS Outbreak",
    period_start: "2003-03",
    period_end: "2003-07",
    event_type: "pandemic_health_shock",
    geography: ["Singapore", "Hong Kong", "China", "Asia"],
    anchor_role: "Regional epidemic demand and travel shock marker",
    mechanisms: ["TRAVEL_DISRUPTION", "DEMAND_SHOCK", "HEALTHCARE_DEMAND_SHOCK"],
    linked_scenario_types: ["pandemic_health_shock"],
    benchmark_use: "Benchmark travel, services, and public-health shock response.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_GLOBAL_FINANCIAL_CRISIS_2008",
    label: "Global Financial Crisis",
    period_start: "2007-08",
    period_end: "2009-06",
    event_type: "financial_conditions_shock",
    geography: ["Global", "United States", "Europe", "Singapore"],
    anchor_role: "Global credit stress lighthouse",
    mechanisms: ["CREDIT_STRESS", "LIQUIDITY_STRESS", "DEMAND_COLLAPSE", "TRADE_CONTRACTION"],
    linked_scenario_types: ["financial_conditions_shock"],
    benchmark_use: "Benchmark global credit tightening, liquidity stress, and demand collapse.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_EURO_DEBT_CRISIS_2011",
    label: "Euro Area Sovereign Debt Crisis",
    period_start: "2010-05",
    period_end: "2012-12",
    event_type: "sovereign_financial_stress",
    geography: ["Europe", "Global"],
    anchor_role: "Sovereign risk and financial contagion marker",
    mechanisms: ["SOVEREIGN_RISK", "CREDIT_STRESS", "CAPITAL_OUTFLOW"],
    linked_scenario_types: ["financial_conditions_shock"],
    benchmark_use: "Benchmark sovereign stress, funding pressure, and confidence spillovers.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_CHINA_SLOWDOWN_2015",
    label: "China Slowdown and RMB Devaluation",
    period_start: "2015-08",
    period_end: "2016-02",
    event_type: "geopolitical_trade_shock",
    geography: ["China", "Asia", "Global", "Singapore"],
    anchor_role: "China demand and currency stress marker",
    mechanisms: ["CHINA_SLOWDOWN", "CURRENCY_STRESS", "CAPITAL_OUTFLOW", "DEMAND_SHOCK"],
    linked_scenario_types: ["geopolitical_trade_shock", "general_macro_shock"],
    benchmark_use: "Benchmark China-linked export, currency, and confidence channels.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_OIL_PRICE_COLLAPSE_2014",
    label: "Oil Price Collapse",
    period_start: "2014-06",
    period_end: "2016-01",
    event_type: "energy_price_shock",
    geography: ["Global", "Singapore"],
    anchor_role: "Energy price downside marker",
    mechanisms: ["COMMODITY_PRICE_SHOCK", "CAPEX_CYCLE_DOWNTURN", "DEMAND_SHOCK"],
    linked_scenario_types: ["energy_inflation_shock"],
    benchmark_use: "Benchmark oil-price downside, energy capex, and margin effects.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_COVID_2020",
    label: "COVID-19 Pandemic Shock",
    period_start: "2020-01",
    period_end: "2022-12",
    event_type: "pandemic_health_shock",
    geography: ["Global", "Singapore"],
    anchor_role: "Global pandemic and supply-demand disruption lighthouse",
    mechanisms: ["DEMAND_SHOCK", "SUPPLY_CHAIN_DISRUPTION", "TRAVEL_DISRUPTION", "LOGISTICS_DELAY"],
    linked_scenario_types: ["pandemic_health_shock", "supply_chain_disruption"],
    benchmark_use: "Benchmark pandemic shock, lockdown disruption, logistics stress, and demand rotation.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_SUEZ_CANAL_BLOCKAGE_2021",
    label: "Suez Canal Blockage",
    period_start: "2021-03",
    period_end: "2021-03",
    event_type: "supply_chain_disruption",
    geography: ["Global", "Europe", "Asia"],
    anchor_role: "Acute shipping disruption marker",
    mechanisms: ["SHIPPING_CONGESTION", "LOGISTICS_DELAY", "SUPPLY_CHAIN_DISRUPTION"],
    linked_scenario_types: ["supply_chain_disruption"],
    benchmark_use: "Benchmark short-duration logistics disruption and shipping route sensitivity.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_GLOBAL_INFLATION_ENERGY_2022",
    label: "Global Inflation and Energy Shock",
    period_start: "2021-12",
    period_end: "2023-12",
    event_type: "energy_inflation_shock",
    geography: ["Global", "Europe", "Asia", "Singapore"],
    anchor_role: "Inflation and energy cost pressure lighthouse",
    mechanisms: ["INFLATION_PRESSURE", "ENERGY_PRICE_SHOCK", "COMMODITY_PRICE_SHOCK", "POLICY_TIGHTENING"],
    linked_scenario_types: ["energy_inflation_shock", "financial_conditions_shock"],
    benchmark_use: "Benchmark input-cost pressure, rate tightening, and margin compression.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_RUSSIA_SANCTIONS_2022",
    label: "Russia-Ukraine War and Sanctions Shock",
    period_start: "2022-02",
    period_end: null,
    event_type: "geopolitical_trade_shock",
    geography: ["Europe", "Global", "Asia"],
    anchor_role: "Geopolitical sanctions and energy-trade disruption marker",
    mechanisms: ["SANCTIONS_SHOCK", "TRADE_DISRUPTION", "ENERGY_PRICE_SHOCK", "SUPPLY_SHOCK"],
    linked_scenario_types: ["geopolitical_trade_shock", "energy_inflation_shock"],
    benchmark_use: "Benchmark sanctions, trade rerouting, and energy-supply stress.",
    source_status: "seed_placeholder",
  },
  {
    macro_event_id: "MACRO_CHINA_REOPENING_2023",
    label: "China Reopening",
    period_start: "2022-12",
    period_end: "2023-12",
    event_type: "reopening_demand_shock",
    geography: ["China", "Asia", "Singapore", "Global"],
    anchor_role: "Reopening rebound and friction marker",
    mechanisms: ["REOPENING_FRICTION", "DEMAND_RECOVERY", "TRAVEL_RECOVERY", "INVENTORY_REBUILD"],
    linked_scenario_types: ["general_macro_shock", "supply_chain_disruption"],
    benchmark_use: "Benchmark reopening demand recovery, travel normalization, and supply friction.",
    source_status: "seed_placeholder",
  },
];

const output = {
  version: "replay-macro-event-anchor-registry-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro Event Smurf provides benchmark anchors, lighthouses, and markers. It helps identify and compare replay patterns, but does not influence raw data or make forecasts.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  anchor_rules: {
    anchors_do_not_change_source_data: true,
    anchors_do_not_override_evidence: true,
    anchors_are_benchmark_markers: true,
    anchors_require_source_enrichment_before_client_use: true,
  },
  event_count: events.length,
  events,
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-event-anchor-registry-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  event_count: output.event_count,
  safety_mode: output.safety_mode,
});
