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

const patterns =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-pattern-engine-v0.1.json")) || {};

const registry =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-registry-engine-v0.1.json")) || {};

const patternItems: any[] = patterns.experience_patterns || [];
const registryItems: any[] = registry.experience_registry_items || [];

const confidenceItems = patternItems.map((pattern, index) => {
  const relatedRegistryItems = registryItems.filter((item) => {
    const key = item.mechanism_id || item.mechanism_name || item.experience_type || "unknown_pattern";
    return key === pattern.pattern_key;
  });

  const observationDepth = clamp(Number(pattern.total_observations ?? 0) / 20);
  const patternStrength = Number(pattern.pattern_strength_score ?? 0);
  const confidenceAverage = Number(pattern.average_confidence_score ?? 0);
  const diversityScore = clamp(Number(pattern.experience_types?.length ?? 0) / 3);
  const repetitionScore = clamp(Number(pattern.repeated_items ?? 0) / 5);

  const experienceConfidence = clamp(
    observationDepth * 0.25 +
      patternStrength * 0.3 +
      confidenceAverage * 0.25 +
      diversityScore * 0.1 +
      repetitionScore * 0.1
  );

  return {
    experience_confidence_id: `EXP_CONF_${String(index + 1).padStart(4, "0")}`,
    pattern_id: pattern.pattern_id,
    pattern_key: pattern.pattern_key,
    mechanism_id: pattern.mechanism_id,
    mechanism_name: pattern.mechanism_name,
    experience_confidence_score: Number(experienceConfidence.toFixed(3)),
    experience_confidence_band:
      experienceConfidence >= 0.75
        ? "high_experience_confidence"
        : experienceConfidence >= 0.55
          ? "moderate_experience_confidence"
          : experienceConfidence >= 0.35
            ? "low_experience_confidence"
            : "very_low_experience_confidence",
    components: {
      observation_depth: Number(observationDepth.toFixed(3)),
      pattern_strength: Number(patternStrength.toFixed(3)),
      average_confidence_score: Number(confidenceAverage.toFixed(3)),
      diversity_score: Number(diversityScore.toFixed(3)),
      repetition_score: Number(repetitionScore.toFixed(3)),
    },
    related_registry_items: relatedRegistryItems.map((item) => item.registry_experience_id),
    permitted_use: {
      may_inform_monitoring: experienceConfidence >= 0.35,
      may_inform_review_prioritization: experienceConfidence >= 0.55,
      may_drive_validation: false,
      may_override_current_evidence: false,
    },
    governance: {
      experience_confidence_is_not_truth: true,
      accumulated_experience_is_not_validation: true,
      evidence_remains_primary: true,
      human_review_required_for_lifecycle_change: true,
    },
  };
});

confidenceItems.sort(
  (a, b) => b.experience_confidence_score - a.experience_confidence_score
);

const output = {
  registry_version: "experience-confidence-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    experience_confidence_measures_recurrence_not_truth: true,
    experience_cannot_override_current_evidence: true,
    accumulated_experience_is_not_validation: true,
    evidence_remains_primary: true,
  },
  inputs: {
    experience_patterns: patternItems.length,
    registry_items: registryItems.length,
  },
  summary: {
    confidence_items_created: confidenceItems.length,
    high_experience_confidence: confidenceItems.filter((x) => x.experience_confidence_band === "high_experience_confidence").length,
    moderate_experience_confidence: confidenceItems.filter((x) => x.experience_confidence_band === "moderate_experience_confidence").length,
    low_experience_confidence: confidenceItems.filter((x) => x.experience_confidence_band === "low_experience_confidence").length,
    very_low_experience_confidence: confidenceItems.filter((x) => x.experience_confidence_band === "very_low_experience_confidence").length,
  },
  experience_confidence_items: confidenceItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/experience-confidence-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/experience-confidence-engine-v0.1.json",
});

console.table(
  confidenceItems.slice(0, 12).map((x) => ({
    pattern: x.mechanism_name || x.pattern_key,
    score: x.experience_confidence_score,
    band: x.experience_confidence_band,
    may_review: x.permitted_use.may_inform_review_prioritization,
  }))
);
