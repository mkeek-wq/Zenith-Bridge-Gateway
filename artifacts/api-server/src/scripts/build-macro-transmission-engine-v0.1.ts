import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const registry =
  readJsonSafe(path.join(ROOT, "data/intelligence/macro-registry-engine-v0.1.json")) || {};

const macroDrivers: any[] = registry.macro_drivers || [];

const transmissionRules = [
  {
    macro_key: "GLOBAL_PMI",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.88,
    channel: "global_demand_to_exports"
  },
  {
    macro_key: "GLOBAL_PMI",
    mechanism_id: "MKT_002",
    mechanism_name: "Inventory Cycle / Restocking",
    transmission_score: 0.64,
    channel: "growth_cycle_to_inventory_restocking"
  },
  {
    macro_key: "US_PMI",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.78,
    channel: "us_demand_to_asian_exports"
  },
  {
    macro_key: "GLOBAL_SEMICONDUCTOR_SALES",
    mechanism_id: "MKT_002",
    mechanism_name: "Inventory Cycle / Restocking",
    transmission_score: 0.91,
    channel: "semiconductor_cycle_to_inventory_and_output"
  },
  {
    macro_key: "GLOBAL_SEMICONDUCTOR_SALES",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.82,
    channel: "chip_demand_to_external_trade"
  },
  {
    macro_key: "BRENT_CRUDE",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.69,
    channel: "commodity_price_to_petroleum_trade"
  },
  {
    macro_key: "FED_FUNDS_RATE",
    mechanism_id: "MKT_006",
    mechanism_name: "Policy / Regulatory Impact",
    transmission_score: 0.58,
    channel: "financial_conditions_to_investment_policy"
  },
  {
    macro_key: "CHINA_EXPORT_GROWTH",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.83,
    channel: "regional_trade_cycle_to_external_demand"
  },
  {
    macro_key: "GLOBAL_TRADE_VOLUME",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.9,
    channel: "global_trade_to_exports"
  },
  {
    macro_key: "SINGAPORE_GDP",
    mechanism_id: "MKT_006",
    mechanism_name: "Policy / Regulatory Impact",
    transmission_score: 0.52,
    channel: "domestic_macro_to_policy_response"
  },
  {
    macro_key: "SINGAPORE_NODX",
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    transmission_score: 0.92,
    channel: "nodx_to_external_trade_cycle"
  },
  {
    macro_key: "SINGAPORE_MANUFACTURING",
    mechanism_id: "MKT_002",
    mechanism_name: "Inventory Cycle / Restocking",
    transmission_score: 0.86,
    channel: "manufacturing_output_to_inventory_cycle"
  }
];

const macroByKey = new Map(macroDrivers.map((m) => [m.macro_key, m]));

const transmissionItems = transmissionRules.map((rule, index) => {
  const macro = macroByKey.get(rule.macro_key);

  return {
    transmission_id: `MACRO_TRANS_${String(index + 1).padStart(4, "0")}`,
    ...rule,
    macro_name: macro?.macro_name || rule.macro_key,
    macro_category: macro?.category || "unknown",
    transmission_band:
      rule.transmission_score >= 0.8
        ? "strong_transmission"
        : rule.transmission_score >= 0.6
          ? "moderate_transmission"
          : "weak_transmission",
    governance: {
      transmission_is_hypothesis_not_truth: true,
      macro_may_support_mechanism_not_validate_it: true,
      evidence_remains_primary: true
    }
  };
});

const output = {
  registry_version: "macro-transmission-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_transmission_maps_context_to_mechanisms: true,
    transmission_strength_is_not_causality_proof: true,
    macro_context_must_not_override_case_evidence: true
  },
  inputs: {
    macro_drivers: macroDrivers.length,
    transmission_rules: transmissionRules.length
  },
  summary: {
    transmission_items: transmissionItems.length,
    strong_transmission: transmissionItems.filter((x) => x.transmission_band === "strong_transmission").length,
    moderate_transmission: transmissionItems.filter((x) => x.transmission_band === "moderate_transmission").length,
    weak_transmission: transmissionItems.filter((x) => x.transmission_band === "weak_transmission").length
  },
  transmission_items: transmissionItems
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-transmission-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/macro-transmission-engine-v0.1.json"
});

console.table(
  transmissionItems.map((t) => ({
    macro: t.macro_key,
    mechanism: t.mechanism_id,
    score: t.transmission_score,
    band: t.transmission_band
  }))
);
