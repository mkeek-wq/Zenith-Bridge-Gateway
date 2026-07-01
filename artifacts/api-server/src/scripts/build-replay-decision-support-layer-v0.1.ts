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

const scenarios = readJson("data/replay/replay-scenario-library-v0.1.json");
const confidence = readJsonIfExists("data/replay/replay-confidence-engine-v0.1.json");
const brainy = readJsonIfExists("data/replay/replay-brainy-diagnosis-v0.1.json");
const orchestrator = readJsonIfExists(
  "data/replay/replay-self-improvement-orchestrator-v0.1.json"
);

function actionForScenario(scenarioType: string) {
  switch (scenarioType) {
    case "pandemic_health_shock":
      return [
        "Review demand resilience by sector.",
        "Check labour, logistics, and inventory buffers.",
        "Prioritize sectors with defensive or substitution demand.",
      ];
    case "energy_inflation_shock":
      return [
        "Assess margin sensitivity to energy and input costs.",
        "Review pricing power and supplier concentration.",
        "Stress-test working capital under higher cost assumptions.",
      ];
    case "financial_conditions_shock":
      return [
        "Review client exposure to credit tightening.",
        "Stress-test demand under weaker financing conditions.",
        "Monitor liquidity-sensitive sectors first.",
      ];
    case "supply_chain_disruption":
      return [
        "Map supplier and shipping dependencies.",
        "Identify alternative logistics routes or inventory buffers.",
        "Prioritize cases with historical recovery patterns.",
      ];
    case "electronics_cycle":
      return [
        "Track inventory cycle indicators.",
        "Separate structural demand from temporary restocking.",
        "Monitor semiconductor-linked export signals.",
      ];
    case "geopolitical_trade_shock":
      return [
        "Map country and sanctions exposure.",
        "Review trade route, customer, and supplier substitution options.",
        "Monitor policy-sensitive sectors closely.",
      ];
    default:
      return [
        "Use replay as an early warning input only.",
        "Request additional case depth before making client-specific decisions.",
      ];
  }
}

const decisionItems = scenarios.scenarios.map((scenario: any) => {
  const evidenceStrength =
    scenario.case_count >= 5
      ? "moderate"
      : scenario.case_count >= 3
        ? "early"
        : "thin";

  return {
    scenario_type: scenario.scenario_type,
    evidence_strength: evidenceStrength,
    case_count: scenario.case_count,
    mechanism_count: scenario.mechanism_count,
    suggested_actions: actionForScenario(scenario.scenario_type),
    human_review_required: true,
  };
});

const decisionSupport = {
  version: "replay-decision-support-layer-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Decision support translates replay scenario families into cautious action guidance. It does not make autonomous business decisions.",
  safety_mode: "ADVISORY_ONLY",
  production_write_allowed: false,
  source_files: {
    scenario_library: "data/replay/replay-scenario-library-v0.1.json",
    confidence_engine: confidence ? "data/replay/replay-confidence-engine-v0.1.json" : null,
    brainy_diagnosis: brainy ? "data/replay/replay-brainy-diagnosis-v0.1.json" : null,
    self_improvement_orchestrator: orchestrator
      ? "data/replay/replay-self-improvement-orchestrator-v0.1.json"
      : null,
  },
  current_replay_state: {
    confidence_score: confidence?.confidence_score ?? null,
    confidence_band: confidence?.confidence_band ?? null,
    brainy_mode: brainy?.mode ?? null,
    recommended_improvement_mode: orchestrator?.recommended_mode ?? null,
  },
  decision_item_count: decisionItems.length,
  decision_items: decisionItems,
  global_caution:
    "Replay outputs are decision-support inputs only and require Papa/human review before client-facing use.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-decision-support-layer-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(decisionSupport, null, 2));

console.log({
  output: outputPath,
  decision_item_count: decisionSupport.decision_item_count,
  confidence_band: decisionSupport.current_replay_state.confidence_band,
});
