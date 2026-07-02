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

const clientImpact = readJson(
  "data/replay/replay-client-impact-assessment-v0.1.json"
);

const confidence = readJsonIfExists("data/replay/replay-confidence-engine-v0.1.json");
const brainy = readJsonIfExists("data/replay/replay-brainy-diagnosis-v0.1.json");
const scenarioLibrary = readJsonIfExists("data/replay/replay-scenario-library-v0.1.json");
const decisionSupport = readJsonIfExists("data/replay/replay-decision-support-layer-v0.1.json");

const weights = {
  historical_scenario_strength: 0.3,
  scenario_match_strength: 0.2,
  client_exposure_strength: 0.2,
  replay_confidence: 0.15,
  brainy_diagnosis: 0.1,
  brainy_forward_synthesis: 0.05,
};

function boundedScore(score: number | null) {
  if (score === null || Number.isNaN(score)) return 0.3;
  return Math.max(0, Math.min(1, score));
}

function evidenceScore(strength: string) {
  if (strength === "moderate") return 0.65;
  if (strength === "early") return 0.45;
  if (strength === "thin") return 0.25;
  return 0.35;
}

function exposureScore(level: string) {
  if (level === "high") return 0.8;
  if (level === "medium") return 0.55;
  if (level === "low") return 0.35;
  return 0.2;
}

function brainyDiagnosisScore(mode: string | null) {
  if (mode === "depth") return 0.65;
  if (mode === "breadth") return 0.45;
  return 0.35;
}

function brainyForwardSynthesisScore(mode: string | null) {
  if (mode === "depth") return 0.6;
  if (mode === "breadth") return 0.4;
  return 0.35;
}

function bandFromScore(score: number) {
  if (score >= 0.7) return "elevated";
  if (score >= 0.5) return "watch";
  return "low_to_moderate";
}

const replayConfidenceScore = boundedScore(confidence?.confidence_score ?? null);
const brainyMode = brainy?.mode ?? null;

const forecastRanges = clientImpact.assessments.map((assessment: any) => {
  const averageEvidence =
    assessment.matched_scenarios.length > 0
      ? assessment.matched_scenarios.reduce(
          (sum: number, scenario: any) =>
            sum + evidenceScore(scenario.evidence_strength),
          0
        ) / assessment.matched_scenarios.length
      : 0.25;

  const scenarioMatchScore = Math.min(1, assessment.matched_scenario_count / 4);
  const clientExposureScore = exposureScore(assessment.impact_level);
  const brainyScore = brainyDiagnosisScore(brainyMode);
  const brainyForwardScore = brainyForwardSynthesisScore(brainyMode);

  const weightedScore =
    averageEvidence * weights.historical_scenario_strength +
    scenarioMatchScore * weights.scenario_match_strength +
    clientExposureScore * weights.client_exposure_strength +
    replayConfidenceScore * weights.replay_confidence +
    brainyScore * weights.brainy_diagnosis +
    brainyForwardScore * weights.brainy_forward_synthesis;

  const roundedScore = Number(weightedScore.toFixed(3));

  return {
    client_profile_id: assessment.client_profile_id,
    label: assessment.label,
    forecast_risk_band: bandFromScore(roundedScore),
    weighted_forecast_score: roundedScore,
    forecast_range: {
      downside: Number(Math.max(0, roundedScore - 0.15).toFixed(3)),
      base: roundedScore,
      upside: Number(Math.min(1, roundedScore + 0.15).toFixed(3)),
    },
    input_channel_scores: {
      historical_scenario_strength: Number(averageEvidence.toFixed(3)),
      scenario_match_strength: Number(scenarioMatchScore.toFixed(3)),
      client_exposure_strength: Number(clientExposureScore.toFixed(3)),
      replay_confidence: replayConfidenceScore,
      brainy_diagnosis: brainyScore,
      brainy_forward_synthesis: brainyForwardScore,
    },
    matched_scenarios: assessment.matched_scenarios.map((s: any) => s.scenario_type),
    interpretation:
      "Forecast range is a weighted decision-support signal, not a prediction or automated recommendation.",
    human_review_required: true,
  };
});

const output = {
  version: "replay-forecast-range-smurf-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Future Smurf combines replay memory, scenario evidence, client exposure, confidence, and Brainy synthesis into cautious forecast ranges. Future Smurf does not access Glass-Orb-AI directly.",
  safety_mode: "ADVISORY_ONLY",
  production_write_allowed: false,
  hard_rules: {
    glass_orb_ai_direct_access_allowed: false,
    glass_orb_ai_access_owner: "Brainy only",
    glass_orb_ai_output_treatment:
      "Suggestions only. Never truth. Must be filtered into auditable Brainy synthesis before downstream use.",
    future_smurf_input_rule:
      "Future Smurf may consume Brainy synthesis, but must not consume Glass-Orb-AI directly.",
  },
  source_files: {
    client_impact_assessment: "data/replay/replay-client-impact-assessment-v0.1.json",
    confidence_engine: confidence ? "data/replay/replay-confidence-engine-v0.1.json" : null,
    brainy_diagnosis: brainy ? "data/replay/replay-brainy-diagnosis-v0.1.json" : null,
    scenario_library: scenarioLibrary ? "data/replay/replay-scenario-library-v0.1.json" : null,
    decision_support: decisionSupport ? "data/replay/replay-decision-support-layer-v0.1.json" : null,
  },
  input_weights: weights,
  forecast_count: forecastRanges.length,
  forecast_ranges: forecastRanges,
  governance_gate:
    "Papa must approve any client-facing interpretation or production use of forecast ranges.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-forecast-range-smurf-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  forecast_count: output.forecast_count,
  bands: forecastRanges.map((f: any) => f.forecast_risk_band),
});
