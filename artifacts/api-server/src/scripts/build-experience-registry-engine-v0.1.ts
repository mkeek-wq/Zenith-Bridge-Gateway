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

function stableExperienceKey(exp: any): string {
  return [
    exp.experience_type || "unknown_type",
    exp.mechanism_id || exp.mechanism_name || "no_mechanism",
    exp.observation || "no_observation",
  ].join("::");
}

const extracted =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-extraction-engine-v0.1.json")) || {};

const currentExperiences: any[] = extracted.experience_items || [];

const registryPath = path.join(ROOT, "data/intelligence/experience-registry-engine-v0.1.json");
const existingRegistry = readJsonSafe(registryPath) || null;
const existingExperiences: any[] = existingRegistry?.experience_registry_items || [];

const existingByKey = new Map<string, any>();

for (const exp of existingExperiences) {
  existingByKey.set(exp.experience_key, exp);
}

for (const exp of currentExperiences) {
  const key = stableExperienceKey(exp);
  const existing = existingByKey.get(key);

  if (existing) {
    existing.observation_count = Number(existing.observation_count || 1) + 1;
    existing.last_observed_at = new Date().toISOString();
    existing.latest_confidence_score = exp.confidence_score ?? existing.latest_confidence_score;
    existing.confidence_history = [
      ...(existing.confidence_history || []),
      {
        observed_at: new Date().toISOString(),
        confidence_score: exp.confidence_score ?? null,
        confidence_band: exp.confidence_band ?? null,
        source_experience_id: exp.experience_id,
      },
    ];
  } else {
    existingByKey.set(key, {
      registry_experience_id: `REG_EXP_${String(existingByKey.size + 1).padStart(5, "0")}`,
      experience_key: key,
      first_observed_at: new Date().toISOString(),
      last_observed_at: new Date().toISOString(),
      observation_count: 1,
      experience_type: exp.experience_type,
      mechanism_id: exp.mechanism_id,
      mechanism_name: exp.mechanism_name,
      observation: exp.observation,
      latest_confidence_score: exp.confidence_score ?? null,
      latest_confidence_band: exp.confidence_band ?? null,
      supporting_signals: exp.supporting_signals || [],
      learning_status: exp.learning_status,
      confidence_history: [
        {
          observed_at: new Date().toISOString(),
          confidence_score: exp.confidence_score ?? null,
          confidence_band: exp.confidence_band ?? null,
          source_experience_id: exp.experience_id,
        },
      ],
      governance: {
        experience_is_not_principle: true,
        experience_is_challengeable: true,
        accumulated_experience_is_not_validation: true,
        evidence_remains_primary: true,
      },
    });
  }
}

const registryItems = Array.from(existingByKey.values()).sort(
  (a, b) => Number(b.observation_count ?? 0) - Number(a.observation_count ?? 0)
);

const output = {
  registry_version: "experience-registry-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    experience_registry_accumulates_memory_not_truth: true,
    experience_patterns_are_not_principles: true,
    accumulated_experience_requires_future_validation: true,
    evidence_remains_primary: true,
  },
  inputs: {
    current_experience_items: currentExperiences.length,
    existing_registry_items: existingExperiences.length,
  },
  summary: {
    registry_items: registryItems.length,
    new_or_updated_items: currentExperiences.length,
    repeated_experiences: registryItems.filter((x) => Number(x.observation_count ?? 0) > 1).length,
    max_observation_count: Math.max(0, ...registryItems.map((x) => Number(x.observation_count ?? 0))),
  },
  experience_registry_items: registryItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(registryPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/experience-registry-engine-v0.1.json",
});

console.table(
  registryItems.slice(0, 12).map((x) => ({
    id: x.registry_experience_id,
    type: x.experience_type,
    mechanism: x.mechanism_name || "",
    count: x.observation_count,
    score: x.latest_confidence_score,
  }))
);
