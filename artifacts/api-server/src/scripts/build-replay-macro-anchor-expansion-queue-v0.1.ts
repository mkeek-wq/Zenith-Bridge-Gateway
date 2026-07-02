import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const coverage = readJson(
  "data/replay/replay-macro-event-coverage-map-v0.1.json"
);

const thinScenarios = coverage.gaps ?? [];

const suggestedAnchors = [
  {
    target_scenario_type: "electronics_cycle",
    suggested_macro_event_id: "MACRO_SEMICONDUCTOR_DOWNTURN_2001",
    label: "Semiconductor Downturn after Dot-com Bust",
    period_start: "2001-01",
    period_end: "2002-12",
    mechanisms: ["ELECTRONICS_CYCLE_DOWNTURN", "DEMAND_COLLAPSE", "INVENTORY_CORRECTION"],
    priority: "high",
    source_status: "needs_sources",
  },
  {
    target_scenario_type: "electronics_cycle",
    suggested_macro_event_id: "MACRO_ELECTRONICS_EXPORT_SHOCK_2008",
    label: "Electronics Export Shock during Global Financial Crisis",
    period_start: "2008-09",
    period_end: "2009-12",
    mechanisms: ["ELECTRONICS_CYCLE_DOWNTURN", "TRADE_CONTRACTION", "DEMAND_COLLAPSE"],
    priority: "high",
    source_status: "needs_sources",
  },
  {
    target_scenario_type: "electronics_cycle",
    suggested_macro_event_id: "MACRO_SEMICONDUCTOR_DOWNTURN_2018_2019",
    label: "Semiconductor Downturn 2018-2019",
    period_start: "2018-07",
    period_end: "2019-12",
    mechanisms: ["ELECTRONICS_CYCLE_DOWNTURN", "INVENTORY_CORRECTION", "CAPEX_CYCLE_DOWNTURN"],
    priority: "high",
    source_status: "needs_sources",
  },
  {
    target_scenario_type: "electronics_cycle",
    suggested_macro_event_id: "MACRO_CHIP_SHORTAGE_2020_2022",
    label: "Global Chip Shortage",
    period_start: "2020-09",
    period_end: "2022-12",
    mechanisms: ["SUPPLY_CHAIN_DISRUPTION", "CAPACITY_CONSTRAINT", "SECTOR_SPECIFIC_DEMAND_SURGE"],
    priority: "medium",
    source_status: "needs_sources",
  },
  {
    target_scenario_type: "electronics_cycle",
    suggested_macro_event_id: "MACRO_ELECTRONICS_INVENTORY_CORRECTION_2022_2023",
    label: "Electronics Inventory Correction 2022-2023",
    period_start: "2022-07",
    period_end: "2023-12",
    mechanisms: ["ELECTRONICS_CYCLE_DOWNTURN", "INVENTORY_CORRECTION", "DEMAND_NORMALIZATION"],
    priority: "high",
    source_status: "needs_sources",
  },
];

const queueItems = suggestedAnchors.filter((anchor) =>
  thinScenarios.some((gap: any) => gap.scenario_type === anchor.target_scenario_type)
);

const output = {
  version: "replay-macro-anchor-expansion-queue-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro anchor expansion queue identifies benchmark anchors needed to improve scenario calibration coverage. It is reference-only and does not alter source data.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_event_coverage_map:
      "data/replay/replay-macro-event-coverage-map-v0.1.json",
  },
  thin_scenario_count: thinScenarios.length,
  queue_count: queueItems.length,
  queue_items: queueItems,
  recommendation:
    "Prioritize adding sourced electronics-cycle macro anchors because current coverage is thin.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-anchor-expansion-queue-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  thin_scenario_count: output.thin_scenario_count,
  queue_count: output.queue_count,
});
