import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

function readJsonIfExists(relativePath: string) {
  const fullPath = path.join(apiRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const registry = readJson("data/replay/cases/replay-historical-case-registry-v0.1.json");
const confidence = readJsonIfExists("data/replay/replay-confidence-engine-v0.1.json");
const brainy = readJsonIfExists("data/replay/replay-brainy-diagnosis-v0.1.json");

const cases = registry.cases ?? registry.historical_cases ?? [];

function classifyScenario(caseItem: any) {
  const text = JSON.stringify(caseItem).toLowerCase();

  if (text.includes("covid") || text.includes("sars") || text.includes("pandemic")) {
    return "pandemic_health_shock";
  }

  if (text.includes("oil") || text.includes("energy") || text.includes("inflation")) {
    return "energy_inflation_shock";
  }

  if (text.includes("semiconductor") || text.includes("electronics")) {
    return "electronics_cycle";
  }

  if (text.includes("logistics") || text.includes("suez") || text.includes("port") || text.includes("supply")) {
    return "supply_chain_disruption";
  }

  if (text.includes("financial") || text.includes("gfc") || text.includes("debt") || text.includes("property")) {
    return "financial_conditions_shock";
  }

  if (text.includes("china") || text.includes("sanctions") || text.includes("trade")) {
    return "geopolitical_trade_shock";
  }

  return "general_macro_shock";
}

const scenarioMap = new Map<string, any>();

for (const c of cases) {
  const scenarioType = classifyScenario(c);

  if (!scenarioMap.has(scenarioType)) {
    scenarioMap.set(scenarioType, {
      scenario_type: scenarioType,
      case_count: 0,
      case_ids: [],
      mechanisms: new Set<string>(),
    });
  }

  const scenario = scenarioMap.get(scenarioType);
  scenario.case_count += 1;
  scenario.case_ids.push(c.case_id ?? c.id ?? c.name ?? "unknown_case");

  for (const mechanism of c.mechanisms ?? c.mechanism_ids ?? []) {
    scenario.mechanisms.add(String(mechanism));
  }
}

const scenarios = [...scenarioMap.values()]
  .map((scenario) => ({
    ...scenario,
    mechanisms: [...scenario.mechanisms].sort(),
    mechanism_count: scenario.mechanisms.size,
  }))
  .sort((a, b) => b.case_count - a.case_count);

const library = {
  version: "replay-scenario-library-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Scenario library groups historical replay cases into reusable shock families for decision support.",
  safety_mode: "ANALYTICAL_ONLY",
  production_write_allowed: false,
  source_files: {
    historical_registry: "data/replay/cases/replay-historical-case-registry-v0.1.json",
    confidence_engine: confidence ? "data/replay/replay-confidence-engine-v0.1.json" : null,
    brainy_diagnosis: brainy ? "data/replay/replay-brainy-diagnosis-v0.1.json" : null,
  },
  current_replay_state: {
    confidence_score: confidence?.confidence_score ?? null,
    confidence_band: confidence?.confidence_band ?? null,
    brainy_mode: brainy?.mode ?? null,
    brainy_recommendation: brainy?.recommendation ?? null,
  },
  scenario_count: scenarios.length,
  scenarios,
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-scenario-library-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(library, null, 2));

console.log({
  output: outputPath,
  scenario_count: library.scenario_count,
  top_scenario: scenarios[0]?.scenario_type ?? null,
});
