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

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function directionFromSignal(signal: any): "positive" | "negative" | "mixed_or_neutral" {
  return signal.direction_summary?.dominant_direction || "mixed_or_neutral";
}

const caseData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const evidenceDedup =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json")) || {};

const attribution =
  readJsonSafe(path.join(ROOT, "data/intelligence/outcome-attribution-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || {};
const signals: any[] = evidenceDedup.deduped_signals || [];
const attributionItems: any[] = attribution.attribution_items || [];

const topSignals = signals.slice(0, 8);
const leadingAttribution = attributionItems
  .slice()
  .sort((a, b) => Number(b.attribution_score ?? 0) - Number(a.attribution_score ?? 0))[0];

const predictionItems = topSignals.map((s, index) => {
  const expectedDirection = directionFromSignal(s);
  const signalStrength = Number(s.scores?.signal_strength_score ?? 0);

  return {
    prediction_id: `PRED_${String(index + 1).padStart(4, "0")}`,
    case_id: currentCase.case_id || null,
    prediction_type: "directional_monitoring_expectation",
    metric_name: s.metric_name,
    created_at: new Date().toISOString(),
    expected_direction: expectedDirection,
    confidence_score: Number(signalStrength.toFixed(3)),
    confidence_band:
      signalStrength >= 0.8
        ? "high"
        : signalStrength >= 0.65
          ? "moderate"
          : "low",
    leading_mechanism: leadingAttribution?.mechanism_name || null,
    validation_status: "pending_future_observation",
    observed_direction: null,
    accuracy_score: null,
    governance: {
      prediction_is_monitoring_expectation_not_certainty: true,
      pending_future_observation: true,
      no_automatic_action: true,
      evidence_remains_primary: true,
    },
  };
});

const output = {
  registry_version: "prediction-validation-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    predictions_are_monitoring_expectations_not_certainties: true,
    future_observations_required_for_validation: true,
    no_prediction_is_self_validating: true,
    evidence_remains_primary: true,
  },
  inputs: {
    case_id: currentCase.case_id || null,
    grouped_signals: signals.length,
    attribution_items: attributionItems.length,
  },
  summary: {
    predictions_created: predictionItems.length,
    pending_future_observation: predictionItems.filter((p) => p.validation_status === "pending_future_observation").length,
    validated_predictions: 0,
    failed_predictions: 0,
  },
  prediction_items: predictionItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/prediction-validation-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/prediction-validation-engine-v0.1.json",
});

console.table(
  predictionItems.map((x) => ({
    prediction_id: x.prediction_id,
    metric: x.metric_name,
    expected: x.expected_direction,
    confidence: x.confidence_score,
    band: x.confidence_band,
    status: x.validation_status,
  }))
);
