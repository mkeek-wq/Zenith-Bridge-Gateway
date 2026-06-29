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

const fleetRun =
  readJsonSafe(path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json")) || {};

const caseOutputs: any[] = fleetRun.case_outputs || [];

const caseEvaluations = caseOutputs.map((c) => {
  const detectedMechanisms = Object.keys(c.mechanism_counts || {});
  const expectedMechanisms = c.expected_mechanisms || [];

  const matched = expectedMechanisms.filter((m: string) => detectedMechanisms.includes(m));
  const missed = expectedMechanisms.filter((m: string) => !detectedMechanisms.includes(m));
  const unexpected = detectedMechanisms.filter((m: string) => !expectedMechanisms.includes(m));

  const mechanismCoverage =
    c.records_replayed > 0 ? c.records_with_mechanisms / c.records_replayed : 0;

  const expectedMatchRatio =
    expectedMechanisms.length > 0 ? matched.length / expectedMechanisms.length : 0;

  const caseQualityScore = Number(
    (mechanismCoverage * 0.45 + expectedMatchRatio * 0.45 + 0.1).toFixed(3)
  );

  return {
    case_id: c.case_id,
    domain: c.domain,
    records_replayed: c.records_replayed,
    mechanism_coverage: Number(mechanismCoverage.toFixed(3)),
    expected_match_ratio: Number(expectedMatchRatio.toFixed(3)),
    detected_mechanisms: detectedMechanisms,
    matched_expected_mechanisms: matched,
    missed_expected_mechanisms: missed,
    unexpected_mechanisms: unexpected,
    case_quality_score: caseQualityScore,
    case_quality_band:
      caseQualityScore >= 0.8
        ? "strong_replay_case"
        : caseQualityScore >= 0.6
          ? "moderate_replay_case"
          : caseQualityScore >= 0.35
            ? "weak_replay_case"
            : "insufficient_replay_case",
  };
});

const allDetectedMechanisms = Array.from(
  new Set(caseEvaluations.flatMap((c) => c.detected_mechanisms))
);

const fleetQualityScore = Number(avg(caseEvaluations.map((c) => c.case_quality_score)).toFixed(3));
const fleetMechanismCoverage = Number(avg(caseEvaluations.map((c) => c.mechanism_coverage)).toFixed(3));
const fleetExpectedMatchRatio = Number(avg(caseEvaluations.map((c) => c.expected_match_ratio)).toFixed(3));

const output = {
  registry_version: "replay-fleet-evaluation-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    fleet_evaluation_scores_replay_behavior_not_truth: true,
    replay_quality_does_not_validate_mechanisms: true,
    dry_run_only: true,
  },
  fleet_run_id: fleetRun.fleet_run_id || null,
  inputs: {
    cases_processed: caseOutputs.length,
    total_records_replayed: fleetRun.summary?.total_records_replayed ?? 0,
  },
  summary: {
    fleet_quality_score: fleetQualityScore,
    fleet_mechanism_coverage: fleetMechanismCoverage,
    fleet_expected_match_ratio: fleetExpectedMatchRatio,
    unique_mechanisms_detected: allDetectedMechanisms.length,
    strong_cases: caseEvaluations.filter((c) => c.case_quality_band === "strong_replay_case").length,
    moderate_cases: caseEvaluations.filter((c) => c.case_quality_band === "moderate_replay_case").length,
    weak_cases: caseEvaluations.filter((c) => c.case_quality_band === "weak_replay_case").length,
    insufficient_cases: caseEvaluations.filter((c) => c.case_quality_band === "insufficient_replay_case").length,
    production_records_written: fleetRun.summary?.production_records_written ?? null,
  },
  case_evaluations: caseEvaluations,
};

ensureDir(path.join(ROOT, "data/replay/fleet-evaluations"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  fleet_run_id: output.fleet_run_id,
  summary: output.summary,
  output: "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json",
});

console.table(
  caseEvaluations.map((c) => ({
    case_id: c.case_id,
    coverage: c.mechanism_coverage,
    match: c.expected_match_ratio,
    quality: c.case_quality_score,
    band: c.case_quality_band,
  }))
);
