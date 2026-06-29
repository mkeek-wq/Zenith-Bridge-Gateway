import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/intelligence/early-warning-signal-skeleton-v0.1.json";

const outputPath =
  "data/intelligence/prediction-candidate-registry-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function predictionHorizon(cadence: string) {
  if (cadence === "weekly") return "3_to_6_months";
  if (cadence === "biweekly") return "6_to_12_months";
  if (cadence === "monthly") return "12_to_24_months";
  return "24_plus_months";
}

function candidateConfidence(severity: string) {
  if (severity === "high") return "medium";
  if (severity === "medium_high") return "candidate";
  return "early_hypothesis";
}

function buildHypothesis(driverName: string, indicator: string) {
  return `${driverName} may experience a meaningful directional shift if changes in '${indicator}' persist and are supported by future evidence review.`;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);

const signals =
  source.early_warning_signals ?? [];

const predictions = signals.map((signal: any) => ({
  prediction_candidate_version:
    "prediction-candidate-v0.1",

  prediction_id:
    `PRED-${signal.early_warning_id}`,

  driver_id:
    signal.driver_id,

  driver_name:
    signal.driver_name,

  indicator:
    signal.indicator,

  prediction_horizon:
    predictionHorizon(
      signal.monitoring_cadence
    ),

  confidence_level:
    candidateConfidence(
      signal.alert_severity
    ),

  hypothesis:
    buildHypothesis(
      signal.driver_name,
      signal.indicator
    ),

  evidence_basis: [
    "historical_replay",
    "experience_registry",
    "driver_observatory",
    "signal_watchlist",
    "early_warning_signal"
  ],

  validation_status:
    "awaiting_validation",

  future_fields: {
    supporting_evidence: [],
    contradicting_evidence: [],
    analyst_assessment: "",
    actual_outcome: null,
    prediction_score: null
  },

  governance: {
    prediction_is_not_fact: true,
    human_review_required: true,
    auto_publish_allowed: false,
    production_mutation_allowed: false
  }
}));

const output = {
  prediction_candidate_registry_version:
    "prediction-candidate-registry-v0.1",

  generated_at:
    new Date().toISOString(),

  source_early_warning_signals:
    sourcePath,

  policy: {
    principle:
      "Prediction candidates are evidence-backed hypotheses requiring validation.",
    human_review_required: true,
    production_mutation_allowed: false
  },

  summary: {
    candidates_generated:
      predictions.length
  },

  predictions
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  prediction_candidate_registry_version:
    output.prediction_candidate_registry_version,

  candidates_generated:
    output.summary.candidates_generated,

  output:
    outputPath
});

for (const p of predictions.slice(0, 30)) {
  console.log(
    `${p.driver_id} | ${p.indicator} | ${p.prediction_horizon} | ${p.confidence_level}`
  );
}
