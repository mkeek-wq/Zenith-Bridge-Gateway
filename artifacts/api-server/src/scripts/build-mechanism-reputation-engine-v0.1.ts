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

function clamp(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n));
}

function mapMechanismId(id: string): string {
  if (id.includes("MKT_002")) return "MKT_002";
  if (id.includes("MKT_006")) return "MKT_006";
  if (id.includes("MKT_010")) return "MKT_010";
  return id;
}

const mechanismConfidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const replayCalibration =
  readJsonSafe(path.join(ROOT, "data/replay/replay-calibration-engine-v0.1.json")) || {};

const fleetEvaluation =
  readJsonSafe(path.join(ROOT, "data/replay/fleet-evaluations/replay-fleet-evaluation-engine-v0.1.json")) || {};

const experienceConfidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-confidence-engine-v0.1.json")) || {};

const confidenceItems: any[] = mechanismConfidence.mechanism_confidence_items || [];
const calibrationItems: any[] = replayCalibration.calibration_items || [];
const experienceItems: any[] = experienceConfidence.experience_confidence_items || [];

const calibrationByBase = new Map<string, any>();
for (const c of calibrationItems) {
  calibrationByBase.set(mapMechanismId(c.mechanism_id), c);
}

const experienceByBase = new Map<string, any>();
for (const e of experienceItems) {
  if (e.mechanism_id) experienceByBase.set(e.mechanism_id, e);
}

const reputationItems = confidenceItems.map((m) => {
  const baseId = m.mechanism_id;
  const calibration = calibrationByBase.get(baseId);
  const experience = experienceByBase.get(baseId);

  const currentConfidence = Number(m.adjusted_confidence_score ?? 0);
  const replayCalibrationScore = Number(calibration?.calibration_score ?? 0);
  const experienceScore = Number(experience?.experience_confidence_score ?? 0);
  const fleetScore = Number(fleetEvaluation.summary?.fleet_quality_score ?? 0);

  const samplePenalty = calibration?.governance?.more_cases_required_before_confidence ? 0.12 : 0;

  const reputationScore = clamp(
    currentConfidence * 0.35 +
      replayCalibrationScore * 0.25 +
      experienceScore * 0.2 +
      fleetScore * 0.2 -
      samplePenalty
  );

  return {
    mechanism_id: baseId,
    mechanism_name: m.mechanism_name,
    reputation_score: Number(reputationScore.toFixed(3)),
    reputation_band:
      reputationScore >= 0.75
        ? "high_reputation"
        : reputationScore >= 0.55
          ? "moderate_reputation"
          : reputationScore >= 0.35
            ? "low_reputation"
            : "very_low_reputation",
    components: {
      current_confidence_score: currentConfidence,
      replay_calibration_score: replayCalibrationScore,
      experience_confidence_score: experienceScore,
      fleet_quality_score: fleetScore,
      sample_penalty: samplePenalty,
    },
    permitted_use: {
      may_inform_monitoring_priority: reputationScore >= 0.35,
      may_inform_publication_readiness: reputationScore >= 0.55,
      may_validate_mechanism: false,
      may_override_current_evidence: false,
    },
    governance: {
      reputation_is_not_truth: true,
      reputation_is_not_validation: true,
      reputation_is_historical_survivability_signal: true,
      mechanisms_remain_challengeable: true,
      evidence_remains_primary: true,
    },
  };
});

reputationItems.sort((a, b) => b.reputation_score - a.reputation_score);

const output = {
  registry_version: "mechanism-reputation-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    reputation_is_not_truth: true,
    reputation_is_not_validation: true,
    reputation_combines_current_confidence_replay_experience_and_governance: true,
    evidence_remains_primary: true,
  },
  inputs: {
    mechanism_confidence_items: confidenceItems.length,
    replay_calibration_items: calibrationItems.length,
    experience_confidence_items: experienceItems.length,
    fleet_quality_score: fleetEvaluation.summary?.fleet_quality_score ?? null,
  },
  summary: {
    reputation_items_created: reputationItems.length,
    high_reputation: reputationItems.filter((x) => x.reputation_band === "high_reputation").length,
    moderate_reputation: reputationItems.filter((x) => x.reputation_band === "moderate_reputation").length,
    low_reputation: reputationItems.filter((x) => x.reputation_band === "low_reputation").length,
    very_low_reputation: reputationItems.filter((x) => x.reputation_band === "very_low_reputation").length,
  },
  reputation_items: reputationItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-reputation-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-reputation-engine-v0.1.json",
});

console.table(
  reputationItems.map((r) => ({
    mechanism: r.mechanism_name,
    reputation: r.reputation_score,
    band: r.reputation_band,
    publication: r.permitted_use.may_inform_publication_readiness,
  }))
);
