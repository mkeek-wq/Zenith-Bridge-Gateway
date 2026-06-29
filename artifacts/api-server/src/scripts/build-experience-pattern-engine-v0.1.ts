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

const registry =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-registry-engine-v0.1.json")) || {};

const registryItems: any[] = registry.experience_registry_items || [];

const grouped = new Map<string, any[]>();

for (const item of registryItems) {
  const groupKey = item.mechanism_id || item.mechanism_name || item.experience_type || "unknown_pattern";
  if (!grouped.has(groupKey)) grouped.set(groupKey, []);
  grouped.get(groupKey)!.push(item);
}

const patternItems = Array.from(grouped.entries()).map(([groupKey, items], index) => {
  const totalObservations = items.reduce((sum, item) => sum + Number(item.observation_count ?? 0), 0);
  const averageConfidence = avg(items.map((item) => Number(item.latest_confidence_score ?? 0)));
  const repeatedItems = items.filter((item) => Number(item.observation_count ?? 0) > 1);

  const experienceTypes = Array.from(new Set(items.map((item) => item.experience_type)));
  const supportingSignals = Array.from(
    new Set(items.flatMap((item) => item.supporting_signals || []))
  ).slice(0, 20);

  const patternStrength =
    Math.min(totalObservations / 10, 1) * 0.35 +
    averageConfidence * 0.4 +
    Math.min(items.length / 5, 1) * 0.15 +
    Math.min(repeatedItems.length / 3, 1) * 0.1;

  return {
    pattern_id: `EXP_PATTERN_${String(index + 1).padStart(4, "0")}`,
    pattern_key: groupKey,
    mechanism_id: items.find((item) => item.mechanism_id)?.mechanism_id || null,
    mechanism_name: items.find((item) => item.mechanism_name)?.mechanism_name || null,
    experience_types: experienceTypes,
    registry_items: items.length,
    total_observations: totalObservations,
    repeated_items: repeatedItems.length,
    average_confidence_score: Number(averageConfidence.toFixed(3)),
    pattern_strength_score: Number(patternStrength.toFixed(3)),
    pattern_band:
      patternStrength >= 0.75
        ? "strong_recurring_pattern"
        : patternStrength >= 0.55
          ? "moderate_recurring_pattern"
          : patternStrength >= 0.35
            ? "weak_recurring_pattern"
            : "insufficient_pattern",
    supporting_signals: supportingSignals,
    interpretation:
      patternStrength >= 0.55
        ? "Experience pattern is recurring enough to support monitoring and future review."
        : "Experience pattern remains early-stage or weak.",
    governance: {
      pattern_is_not_principle: true,
      recurring_experience_is_not_validation: true,
      human_review_required_for_mechanism_changes: true,
      evidence_remains_primary: true,
    },
  };
});

patternItems.sort((a, b) => b.pattern_strength_score - a.pattern_strength_score);

const output = {
  registry_version: "experience-pattern-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    recurring_patterns_are_not_principles: true,
    repeated_experience_informs_attention_not_truth: true,
    evidence_remains_primary: true,
    human_review_required_for_validation: true,
  },
  inputs: {
    registry_items: registryItems.length,
  },
  summary: {
    patterns_created: patternItems.length,
    strong_patterns: patternItems.filter((x) => x.pattern_band === "strong_recurring_pattern").length,
    moderate_patterns: patternItems.filter((x) => x.pattern_band === "moderate_recurring_pattern").length,
    weak_patterns: patternItems.filter((x) => x.pattern_band === "weak_recurring_pattern").length,
    insufficient_patterns: patternItems.filter((x) => x.pattern_band === "insufficient_pattern").length,
  },
  experience_patterns: patternItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/experience-pattern-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/experience-pattern-engine-v0.1.json",
});

console.table(
  patternItems.slice(0, 12).map((x) => ({
    pattern: x.mechanism_name || x.pattern_key,
    observations: x.total_observations,
    items: x.registry_items,
    score: x.pattern_strength_score,
    band: x.pattern_band,
  }))
);
