import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const macroDrivers = [
  {
    macro_id: "MACRO_001",
    macro_key: "GLOBAL_PMI",
    macro_name: "Global PMI",
    category: "global_growth",
    transmission_strength: "high",
    expected_channels: ["external_demand", "manufacturing_cycle", "trade_cycle"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_002",
    macro_key: "US_PMI",
    macro_name: "US PMI",
    category: "external_demand",
    transmission_strength: "medium",
    expected_channels: ["export_demand", "electronics_cycle"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_003",
    macro_key: "GLOBAL_SEMICONDUCTOR_SALES",
    macro_name: "Global Semiconductor Sales",
    category: "sector_global_cycle",
    transmission_strength: "high",
    expected_channels: ["semiconductor_cycle", "electronics_exports", "inventory_cycle"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_004",
    macro_key: "BRENT_CRUDE",
    macro_name: "Brent Crude Oil Price",
    category: "commodity_cycle",
    transmission_strength: "medium",
    expected_channels: ["petroleum_output", "energy_cost", "trade_value"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_005",
    macro_key: "FED_FUNDS_RATE",
    macro_name: "US Federal Funds Rate",
    category: "financial_conditions",
    transmission_strength: "medium",
    expected_channels: ["capital_cost", "investment_conditions", "usd_liquidity"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_006",
    macro_key: "CHINA_EXPORT_GROWTH",
    macro_name: "China Export Growth",
    category: "regional_trade_cycle",
    transmission_strength: "high",
    expected_channels: ["asian_trade_cycle", "electronics_demand", "supply_chain_cycle"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_007",
    macro_key: "GLOBAL_TRADE_VOLUME",
    macro_name: "Global Trade Volume",
    category: "global_trade",
    transmission_strength: "high",
    expected_channels: ["exports", "shipping", "manufacturing_demand"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_008",
    macro_key: "SINGAPORE_GDP",
    macro_name: "Singapore GDP Growth",
    category: "national_macro",
    transmission_strength: "medium",
    expected_channels: ["domestic_activity", "business_receipts", "services_activity"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_009",
    macro_key: "SINGAPORE_NODX",
    macro_name: "Singapore NODX",
    category: "national_trade",
    transmission_strength: "high",
    expected_channels: ["external_trade", "electronics_exports", "manufacturing_cycle"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  },
  {
    macro_id: "MACRO_010",
    macro_key: "SINGAPORE_MANUFACTURING",
    macro_name: "Singapore Manufacturing Output",
    category: "national_sector",
    transmission_strength: "high",
    expected_channels: ["manufacturing_output", "industrial_cycle", "sector_recovery"],
    governance: {
      observed_data_required_for_production: true,
      synthetic_proxy_allowed_for_replay: true,
      macro_driver_is_context_not_proof: true
    }
  }
];

const output = {
  registry_version: "macro-registry-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_drivers_are_context_not_truth: true,
    macro_drivers_explain_environment_not_outcome_alone: true,
    observed_and_inferred_macro_must_remain_separated: true,
    macro_context_may_support_attribution_but_not_override_evidence: true
  },
  summary: {
    macro_drivers_registered: macroDrivers.length,
    high_transmission_strength: macroDrivers.filter((x) => x.transmission_strength === "high").length,
    medium_transmission_strength: macroDrivers.filter((x) => x.transmission_strength === "medium").length,
    categories: Array.from(new Set(macroDrivers.map((x) => x.category))).length
  },
  macro_drivers: macroDrivers
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-registry-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/intelligence/macro-registry-engine-v0.1.json"
});

console.table(
  macroDrivers.map((m) => ({
    macro: m.macro_key,
    category: m.category,
    strength: m.transmission_strength,
    channels: m.expected_channels.length
  }))
);
