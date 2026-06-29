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

const scoreboard =
  readJsonSafe(path.join(ROOT, "data/replay/replay-case-scoreboard-v0.1.json")) || {};

const items: any[] = scoreboard.scoreboard_items || [];

const completed = items.filter((x) => x.replay_status === "completed");

const mechanismIds = Array.from(
  new Set(
    completed.flatMap((x) => [
      ...(x.expected_mechanisms || []),
      ...(x.detected_mechanisms || [])
    ])
  )
);

const calibrationItems = mechanismIds.map((mechanismId) => {
  const relevantCases = completed.filter((x) =>
    (x.expected_mechanisms || []).includes(mechanismId) ||
    (x.detected_mechanisms || []).includes(mechanismId)
  );

  const expectedCount = relevantCases.filter((x) =>
    (x.expected_mechanisms || []).includes(mechanismId)
  ).length;

  const detectedCount = relevantCases.filter((x) =>
    (x.detected_mechanisms || []).includes(mechanismId)
  ).length;

  const matchedCount = relevantCases.filter((x) =>
    (x.expected_mechanisms || []).includes(mechanismId) &&
    (x.detected_mechanisms || []).includes(mechanismId)
  ).length;

  const falsePositiveCount = relevantCases.filter((x) =>
    !(x.expected_mechanisms || []).includes(mechanismId) &&
    (x.detected_mechanisms || []).includes(mechanismId)
  ).length;

  const missedCount = relevantCases.filter((x) =>
    (x.expected_mechanisms || []).includes(mechanismId) &&
    !(x.detected_mechanisms || []).includes(mechanismId)
  ).length;

  const precision =
    detectedCount > 0 ? matchedCount / detectedCount : 0;

  const recall =
    expectedCount > 0 ? matchedCount / expectedCount : 0;

  const calibrationScore =
    precision || recall
      ? Number(((precision * 0.5) + (recall * 0.5)).toFixed(3))
      : 0;

  return {
    mechanism_id: mechanismId,
    cases_relevant: relevantCases.length,
    expected_count: expectedCount,
    detected_count: detectedCount,
    matched_count: matchedCount,
    false_positive_count: falsePositiveCount,
    missed_count: missedCount,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    calibration_score: calibrationScore,
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
      more_cases_required_before_confidence: relevantCases.length < 5,
      replay_dry_run_only: true
    }
  };
});

const output = {
  registry_version: "replay-calibration-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    calibration_measures_replay_behavior_not_truth: true,
    calibration_requires_many_cases: true,
    dry_run_calibration_does_not_validate_mechanisms: true
  },
  inputs: {
    scoreboard_cases: items.length,
    completed_cases: completed.length
  },
  summary: {
    mechanisms_calibrated: calibrationItems.length,
    average_calibration_score: Number(avg(calibrationItems.map((x) => x.calibration_score)).toFixed(3)),
    strong_calibration: calibrationItems.filter((x) => x.calibration_band === "strong_calibration").length,
    moderate_calibration: calibrationItems.filter((x) => x.calibration_band === "moderate_calibration").length,
    weak_calibration: calibrationItems.filter((x) => x.calibration_band === "weak_calibration").length,
    insufficient_calibration: calibrationItems.filter((x) => x.calibration_band === "insufficient_calibration").length
  },
  calibration_items: calibrationItems
};

ensureDir(path.join(ROOT, "data/replay"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-calibration-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/replay/replay-calibration-engine-v0.1.json"
});

console.table(
  calibrationItems.map((c) => ({
    mechanism: c.mechanism_id,
    cases: c.cases_relevant,
    precision: c.precision,
    recall: c.recall,
    score: c.calibration_score,
    band: c.calibration_band
  }))
);
