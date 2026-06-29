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

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const fleetEval =
  readJsonSafe(path.join(ROOT, "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json")) || {};

const cases: any[] = fleetEval.case_evaluations || [];

const mechanismIds = Array.from(
  new Set(
    cases.flatMap((c) => [
      ...(c.detected_mechanisms || []),
      ...(c.matched_expected_mechanisms || []),
      ...(c.missed_expected_mechanisms || []),
      ...(c.unexpected_mechanisms || []),
    ])
  )
);

const calibrationItems = mechanismIds.map((mechanismId) => {
  const relevantCases = cases.filter((c) =>
    (c.detected_mechanisms || []).includes(mechanismId) ||
    (c.matched_expected_mechanisms || []).includes(mechanismId) ||
    (c.missed_expected_mechanisms || []).includes(mechanismId) ||
    (c.unexpected_mechanisms || []).includes(mechanismId)
  );

  const expectedHits = relevantCases.filter((c) =>
    (c.matched_expected_mechanisms || []).includes(mechanismId)
  ).length;

  const unexpectedHits = relevantCases.filter((c) =>
    (c.unexpected_mechanisms || []).includes(mechanismId)
  ).length;

  const missedHits = relevantCases.filter((c) =>
    (c.missed_expected_mechanisms || []).includes(mechanismId)
  ).length;

  const detectedHits = expectedHits + unexpectedHits;
  const expectedTotal = expectedHits + missedHits;

  const precision = detectedHits > 0 ? expectedHits / detectedHits : 0;
  const recall = expectedTotal > 0 ? expectedHits / expectedTotal : 0;

  const unexpectedPenalty = relevantCases.length > 0 ? unexpectedHits / relevantCases.length : 0;
  const missedPenalty = relevantCases.length > 0 ? missedHits / relevantCases.length : 0;
  const sampleDepthScore = Math.min(relevantCases.length / 10, 1);

  const calibrationScore = Math.max(
    0,
    Math.min(
      1,
      precision * 0.35 +
        recall * 0.35 +
        sampleDepthScore * 0.15 -
        unexpectedPenalty * 0.1 -
        missedPenalty * 0.05 +
        0.15
    )
  );

  return {
    mechanism_id: mechanismId,
    cases_relevant: relevantCases.length,
    expected_hits: expectedHits,
    unexpected_hits: unexpectedHits,
    missed_hits: missedHits,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    unexpected_penalty: Number(unexpectedPenalty.toFixed(3)),
    missed_penalty: Number(missedPenalty.toFixed(3)),
    sample_depth_score: Number(sampleDepthScore.toFixed(3)),
    calibration_score: Number(calibrationScore.toFixed(3)),
    calibration_band:
      calibrationScore >= 0.8
        ? "strong_calibration"
        : calibrationScore >= 0.6
          ? "moderate_calibration"
          : calibrationScore >= 0.35
            ? "weak_calibration"
            : "insufficient_calibration",
    governance: {
      calibration_is_not_validation: true,
      unexpected_mechanisms_penalized: true,
      missed_mechanisms_penalized: true,
      more_cases_required_before_confidence: relevantCases.length < 10,
      replay_dry_run_only: true,
    },
  };
});

const output = {
  registry_version: "replay-calibration-engine-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    calibration_measures_replay_behavior_not_truth: true,
    unexpected_mechanisms_reduce_precision: true,
    missed_mechanisms_reduce_recall: true,
    calibration_requires_many_cases: true,
    dry_run_calibration_does_not_validate_mechanisms: true,
  },
  inputs: {
    fleet_cases: cases.length,
    mechanisms_detected: mechanismIds.length,
  },
  summary: {
    mechanisms_calibrated: calibrationItems.length,
    average_calibration_score: Number(avg(calibrationItems.map((x) => x.calibration_score)).toFixed(3)),
    strong_calibration: calibrationItems.filter((x) => x.calibration_band === "strong_calibration").length,
    moderate_calibration: calibrationItems.filter((x) => x.calibration_band === "moderate_calibration").length,
    weak_calibration: calibrationItems.filter((x) => x.calibration_band === "weak_calibration").length,
    insufficient_calibration: calibrationItems.filter((x) => x.calibration_band === "insufficient_calibration").length,
  },
  calibration_items: calibrationItems,
};

ensureDir(path.join(ROOT, "data/replay"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-calibration-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/replay/replay-calibration-engine-v0.2.json",
});

console.table(
  calibrationItems.map((c) => ({
    mechanism: c.mechanism_id,
    cases: c.cases_relevant,
    precision: c.precision,
    recall: c.recall,
    unexpected: c.unexpected_hits,
    missed: c.missed_hits,
    score: c.calibration_score,
    band: c.calibration_band,
  }))
);
