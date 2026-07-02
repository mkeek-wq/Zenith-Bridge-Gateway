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

const attribution =
  readJsonSafe(path.join(ROOT, "data/intelligence/outcome-attribution-engine-v0.1.json")) || {};

const prediction =
  readJsonSafe(path.join(ROOT, "data/intelligence/prediction-validation-engine-v0.1.json")) || {};

const discovery =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json")) || {};

const contradiction =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const attributionItems: any[] = attribution.attribution_items || [];
const predictionItems: any[] = prediction.prediction_items || [];
const discoveryItems: any[] = discovery.discovery_candidates || [];
const contradictions: any[] = contradiction.contradictions || [];

const experienceItems: any[] = [];

for (const item of attributionItems) {
  experienceItems.push({
    experience_id: `EXP_${String(experienceItems.length + 1).padStart(4, "0")}`,
    experience_type: "mechanism_attribution_pattern",
    mechanism_id: item.mechanism_id,
    mechanism_name: item.mechanism_name,
    confidence_score: item.attribution_score,
    confidence_band: item.attribution_band,
    observation:
      item.attribution_score >= 0.55
        ? `${item.mechanism_name} shows meaningful provisional attribution in the current case.`
        : `${item.mechanism_name} shows limited provisional attribution in the current case.`,
    supporting_signals: item.top_contributing_signals?.slice(0, 5).map((s: any) => s.metric_name) || [],
    learning_status: "provisional_experience",
    governance: {
      experience_is_not_principle: true,
      experience_is_challengeable: true,
      requires_future_validation: true,
      evidence_remains_primary: true,
    },
  });
}

for (const d of discoveryItems.filter((x) => x.discovery_status === "candidate_discovery")) {
  experienceItems.push({
    experience_id: `EXP_${String(experienceItems.length + 1).padStart(4, "0")}`,
    experience_type: "candidate_discovery_pattern",
    mechanism_id: null,
    mechanism_name: d.suggested_mechanism_name,
    confidence_score: d.discovery_score,
    confidence_band:
      d.discovery_score >= 0.75
        ? "high"
        : d.discovery_score >= 0.55
          ? "moderate"
          : "low",
    observation: `${d.suggested_mechanism_name} emerged as a candidate discovery with ${d.evidence_items_matched} matched evidence items.`,
    supporting_signals: d.top_supporting_evidence?.slice(0, 5).map((e: any) => e.metric_name) || [],
    learning_status: "candidate_discovery_experience",
    governance: {
      experience_is_not_principle: true,
      discovery_is_not_validation: true,
      human_review_required_to_seed_mechanism: true,
      evidence_remains_primary: true,
    },
  });
}

for (const c of contradictions) {
  experienceItems.push({
    experience_id: `EXP_${String(experienceItems.length + 1).padStart(4, "0")}`,
    experience_type: "contradiction_pattern",
    mechanism_id: null,
    mechanism_name: null,
    confidence_score: c.contradiction_strength,
    confidence_band: c.contradiction_band,
    observation: `${c.evidence_bucket} contains contradictory evidence and should reduce certainty in related assessments.`,
    supporting_signals: [
      ...(c.sample_positive_evidence || []).slice(0, 3).map((e: any) => e.metric_name),
      ...(c.sample_negative_evidence || []).slice(0, 3).map((e: any) => e.metric_name),
    ],
    learning_status: "contradiction_experience",
    governance: {
      experience_is_not_principle: true,
      contradiction_reduces_certainty: true,
      evidence_remains_primary: true,
    },
  });
}

const output = {
  registry_version: "experience-extraction-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    experience_patterns_are_not_principles: true,
    experience_is_challengeable: true,
    validated_mechanisms_require_human_review: true,
    evidence_remains_primary: true,
  },
  inputs: {
    attribution_items: attributionItems.length,
    prediction_items: predictionItems.length,
    discovery_items: discoveryItems.length,
    contradictions: contradictions.length,
  },
  summary: {
    experience_items_created: experienceItems.length,
    mechanism_attribution_patterns: experienceItems.filter((x) => x.experience_type === "mechanism_attribution_pattern").length,
    candidate_discovery_patterns: experienceItems.filter((x) => x.experience_type === "candidate_discovery_pattern").length,
    contradiction_patterns: experienceItems.filter((x) => x.experience_type === "contradiction_pattern").length,
  },
  experience_items: experienceItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/experience-extraction-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/experience-extraction-engine-v0.1.json",
});

console.table(
  experienceItems.map((x) => ({
    id: x.experience_id,
    type: x.experience_type,
    mechanism: x.mechanism_name || "",
    score: x.confidence_score,
    status: x.learning_status,
  }))
);
