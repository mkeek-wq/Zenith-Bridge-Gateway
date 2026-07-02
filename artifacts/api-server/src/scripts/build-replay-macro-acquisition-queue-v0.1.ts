import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const anchorRegistry = readJson(
  "data/replay/replay-macro-event-anchor-registry-v0.1.json"
);

const expansionQueue = readJson(
  "data/replay/replay-macro-anchor-expansion-queue-v0.1.json"
);

const sourceFamilies = [
  "IMF",
  "World Bank",
  "BIS",
  "OECD",
  "WTO",
  "UNCTAD",
  "IEA",
  "EIA",
  "Federal Reserve / FRED",
  "NBER",
  "Singapore MTI",
  "MAS",
  "Enterprise Singapore",
  "EDB Singapore",
];

const additionalMacroTargets = [
  ["MACRO_TAPER_TANTRUM_2013", "Taper Tantrum", "2013-05", "2013-12", "financial_conditions_shock"],
  ["MACRO_US_RATE_HIKING_CYCLE_2022_2023", "US Rate Hiking Cycle 2022-2023", "2022-03", "2023-12", "financial_conditions_shock"],
  ["MACRO_TRADE_WAR_2018_2019", "US-China Trade War", "2018-03", "2019-12", "geopolitical_trade_shock"],
  ["MACRO_BREXIT_REFERENDUM_2016", "Brexit Referendum Shock", "2016-06", "2017-12", "geopolitical_trade_shock"],
  ["MACRO_JAPAN_EARTHQUAKE_SUPPLY_2011", "Japan Earthquake Supply Chain Shock", "2011-03", "2011-12", "supply_chain_disruption"],
  ["MACRO_THAI_FLOODS_2011", "Thai Floods Supply Chain Shock", "2011-07", "2012-01", "supply_chain_disruption"],
  ["MACRO_CONTAINER_FREIGHT_SURGE_2021", "Container Freight Rate Surge", "2020-07", "2022-03", "supply_chain_disruption"],
  ["MACRO_FOOD_PRICE_SHOCK_2007_2008", "Global Food Price Shock", "2007-01", "2008-12", "energy_inflation_shock"],
  ["MACRO_ARAB_SPRING_OIL_2011", "Arab Spring Oil Risk Shock", "2011-01", "2011-12", "energy_inflation_shock"],
  ["MACRO_OPEC_PRICE_WAR_2020", "Oil Price War 2020", "2020-03", "2020-05", "energy_inflation_shock"],
  ["MACRO_SEMICONDUCTOR_DOWNTURN_2001", "Semiconductor Downturn 2001", "2001-01", "2002-12", "electronics_cycle"],
  ["MACRO_SEMICONDUCTOR_DOWNTURN_2018_2019", "Semiconductor Downturn 2018-2019", "2018-07", "2019-12", "electronics_cycle"],
  ["MACRO_CHIP_SHORTAGE_2020_2022", "Global Chip Shortage", "2020-09", "2022-12", "electronics_cycle"],
  ["MACRO_ELECTRONICS_INVENTORY_CORRECTION_2022_2023", "Electronics Inventory Correction 2022-2023", "2022-07", "2023-12", "electronics_cycle"],
  ["MACRO_H1N1_2009", "H1N1 Pandemic", "2009-04", "2010-08", "pandemic_health_shock"],
  ["MACRO_MERS_2015", "MERS Outbreak", "2015-05", "2015-12", "pandemic_health_shock"],
  ["MACRO_AVIAN_FLU_2005_2006", "Avian Flu Concern 2005-2006", "2005-01", "2006-12", "pandemic_health_shock"],
  ["MACRO_CHINA_WTO_ACCESSION_2001", "China WTO Accession Shock/Opportunity", "2001-12", "2005-12", "general_macro_shock"],
  ["MACRO_CHINA_STIMULUS_2009", "China Stimulus 2009", "2008-11", "2010-12", "general_macro_shock"],
  ["MACRO_ASEAN_SUPPLY_CHAIN_SHIFT_2018_2024", "ASEAN Supply Chain Shift", "2018-01", null, "geopolitical_trade_shock"],
  ["MACRO_SG_PROPERTY_COOLING_2018", "Singapore Property Cooling Measures 2018", "2018-07", "2019-12", "financial_conditions_shock"],
  ["MACRO_SG_LABOUR_SHORTAGE_2021", "Singapore Labour Shortage 2021", "2021-01", "2022-12", "supply_chain_disruption"],
  ["MACRO_SG_TOURISM_REOPENING_2022_2023", "Singapore Tourism Reopening 2022-2023", "2022-04", "2023-12", "general_macro_shock"],
  ["MACRO_RED_SEA_SHIPPING_DISRUPTION_2023_2024", "Red Sea Shipping Disruption", "2023-11", null, "supply_chain_disruption"],
  ["MACRO_GLOBAL_AI_CAPEX_SURGE_2023_2026", "AI Capex and Semiconductor Demand Surge", "2023-01", null, "electronics_cycle"],
];

const existingIds = new Set(anchorRegistry.events.map((event: any) => event.macro_event_id));

const queueFromExpansion = (expansionQueue.queue_items ?? []).map((item: any) => ({
  acquisition_id: `ACQ_${item.suggested_macro_event_id}`,
  macro_event_id: item.suggested_macro_event_id,
  label: item.label,
  period_start: item.period_start,
  period_end: item.period_end,
  scenario_type: item.target_scenario_type,
  priority: item.priority,
  source_status: item.source_status,
  acquisition_type: "coverage_gap_expansion",
  suggested_source_families: sourceFamilies,
  status: "queued",
}));

const queueFromBroadening = additionalMacroTargets
  .filter(([id]) => !existingIds.has(id))
  .map(([id, label, start, end, scenarioType]) => ({
    acquisition_id: `ACQ_${id}`,
    macro_event_id: id,
    label,
    period_start: start,
    period_end: end,
    scenario_type: scenarioType,
    priority:
      scenarioType === "electronics_cycle" ||
      scenarioType === "supply_chain_disruption" ||
      scenarioType === "financial_conditions_shock"
        ? "high"
        : "medium",
    source_status: "needs_sources",
    acquisition_type: "macro_base_broadening",
    suggested_source_families: sourceFamilies,
    status: "queued",
  }));

const allQueue = [...queueFromExpansion, ...queueFromBroadening];

const deduped = [...new Map(allQueue.map((item) => [item.macro_event_id, item])).values()];

const output = {
  version: "replay-macro-acquisition-queue-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro Acquisition Smurf queues broad macro-event anchors for sourced ingestion. It is reference-only and does not alter operational evidence.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_anchor_registry: "data/replay/replay-macro-event-anchor-registry-v0.1.json",
    macro_anchor_expansion_queue:
      "data/replay/replay-macro-anchor-expansion-queue-v0.1.json",
  },
  existing_anchor_count: anchorRegistry.event_count,
  queued_anchor_count: deduped.length,
  high_priority_count: deduped.filter((item) => item.priority === "high").length,
  queue_items: deduped,
  recommendation:
    "Start by sourcing high-priority electronics, financial conditions, and supply-chain anchors, then broaden to 100+ macro anchors.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-acquisition-queue-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  existing_anchor_count: output.existing_anchor_count,
  queued_anchor_count: output.queued_anchor_count,
  high_priority_count: output.high_priority_count,
});
