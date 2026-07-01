import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const acquisition = readJson(
  "data/replay/replay-macro-acquisition-queue-v0.1.json"
);

const highPriority = acquisition.queue_items.filter(
  (item: any) => item.priority === "high"
);

const sourceHintsByScenario: Record<string, string[]> = {
  electronics_cycle: [
    "World Semiconductor Trade Statistics",
    "SEMI",
    "SIA",
    "Singapore EDB",
    "Enterprise Singapore",
    "IMF WEO",
    "World Bank",
  ],
  financial_conditions_shock: [
    "IMF WEO",
    "BIS",
    "Federal Reserve / FRED",
    "NBER",
    "World Bank Global Economic Prospects",
  ],
  supply_chain_disruption: [
    "WTO",
    "UNCTAD",
    "OECD",
    "World Bank",
    "Singapore MTI",
  ],
  energy_inflation_shock: [
    "IEA",
    "EIA",
    "IMF WEO",
    "World Bank Commodity Markets",
    "BIS",
  ],
  geopolitical_trade_shock: [
    "WTO",
    "UNCTAD",
    "IMF WEO",
    "World Bank",
    "OECD",
  ],
  pandemic_health_shock: [
    "WHO",
    "World Bank",
    "IMF WEO",
    "Singapore MOH",
    "Singapore MTI",
  ],
  general_macro_shock: [
    "IMF WEO",
    "World Bank",
    "OECD",
    "Singapore MTI",
    "MAS",
  ],
};

const sourcedBatch = highPriority.map((item: any) => {
  const sourceHints =
    sourceHintsByScenario[item.scenario_type] ?? item.suggested_source_families;

  return {
    macro_event_id: item.macro_event_id,
    label: item.label,
    period_start: item.period_start,
    period_end: item.period_end,
    event_type: item.scenario_type,
    source_status: "source_hints_attached",
    ingestion_status: "ready_for_manual_source_enrichment",
    confidence: {
      sourcing_confidence: "low_until_sources_attached",
      classification_confidence: "seed",
      client_ready: false,
    },
    anchor_role:
      "Reference macro anchor for calibration and benchmark comparison only.",
    source_hints: sourceHints,
    required_source_evidence: [
      "At least one authoritative macro source",
      "At least one market/sector-specific source where relevant",
      "Clear event start date or trigger",
      "Clear transmission mechanism",
      "Documented sector or macro impact",
    ],
    target_scenario_type: item.scenario_type,
    proposed_mechanisms: item.mechanisms ?? [],
    governance: {
      papa_review_required: true,
      production_write_allowed: false,
      can_influence_raw_data: false,
      can_override_evidence: false,
    },
  };
});

const output = {
  version: "replay-macro-sourced-batch-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro sourced batch prepares high-priority macro anchors for manual source enrichment. It does not claim that anchors are sourced yet.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_acquisition_queue:
      "data/replay/replay-macro-acquisition-queue-v0.1.json",
  },
  batch_scope: "high_priority_macro_anchors",
  batch_count: sourcedBatch.length,
  sourced_anchors: sourcedBatch,
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-sourced-batch-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  batch_count: output.batch_count,
  safety_mode: output.safety_mode,
});
