import fs from "fs";
import path from "path";

const INPUT_PATH = "data/intelligence/memory-grading-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/observation-memory-registry-v0.1.json";

type MemoryGrade = {
  driver_id: string;
  driver_name: string;
  case_id: string;
  period: string;
  series_name: string;
  memory_score: number;
  memory_action: string;
  retention_reason: string;
  grading_inputs: {
    confidence: string;
    confidence_weight: number;
    driver_score: number;
    evidence_count: number;
    driver_experience_strength: number;
    driver_confidence_score: number;
    recurrence_score: number;
    persistence_score: number;
    volatility_score: number;
    maturity_stage: string;
    bias_warnings: string[];
    cluster_case_count: number;
  };
};

function memoryTier(action: string): string {
  if (action === "retain_anchor") return "hot_anchor";
  if (action === "retain_active") return "hot_active";
  if (action === "compress") return "warm_compressed_candidate";
  if (action === "archive_to_lake") return "cold_archive_candidate";
  return "unclassified";
}

function retrievalPriority(action: string, score: number): number {
  if (action === "retain_anchor") return 1;
  if (score >= 0.85) return 2;
  if (score >= 0.75) return 3;
  if (score >= 0.65) return 4;
  return 5;
}

function main() {
  const source = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  const grades: MemoryGrade[] = source.memory_grades;

  if (!Array.isArray(grades)) {
    throw new Error("Expected source.memory_grades to be an array.");
  }

  const observations = grades.map((g) => ({
    observation_memory_version: "observation-memory-v0.1",
    observation_id: `OBS-${g.case_id}`,
    source_memory_grading_registry: INPUT_PATH,

    driver_id: g.driver_id,
    driver_name: g.driver_name,
    case_id: g.case_id,
    period: g.period,
    series_name: g.series_name,

    observation_type: "historical_driver_case",
    factual_summary: `${g.series_name} in ${g.period} was associated with driver ${g.driver_id} (${g.driver_name}).`,

    memory_tier: memoryTier(g.memory_action),
    retrieval_priority: retrievalPriority(g.memory_action, g.memory_score),

    memory_score: g.memory_score,
    memory_action: g.memory_action,
    retention_reason: g.retention_reason,

    factual_detail_fields: {
      confidence: g.grading_inputs.confidence,
      confidence_weight: g.grading_inputs.confidence_weight,
      driver_score: g.grading_inputs.driver_score,
      evidence_count: g.grading_inputs.evidence_count,
      maturity_stage: g.grading_inputs.maturity_stage,
      bias_warnings: g.grading_inputs.bias_warnings,
    },

    abstraction_links: {
      experience_strength: g.grading_inputs.driver_experience_strength,
      driver_confidence_score: g.grading_inputs.driver_confidence_score,
      recurrence_score: g.grading_inputs.recurrence_score,
      persistence_score: g.grading_inputs.persistence_score,
      volatility_score: g.grading_inputs.volatility_score,
      cluster_case_count: g.grading_inputs.cluster_case_count,
    },

    governance: {
      observation_is_fact_memory_not_principle: true,
      can_support_future_recall: true,
      can_support_principle_extraction: true,
      delete_allowed: false,
      archive_only: true,
      production_mutation_allowed: false,
    },
  }));

  const tierCounts: Record<string, number> = {};
  for (const obs of observations) {
    tierCounts[obs.memory_tier] = (tierCounts[obs.memory_tier] || 0) + 1;
  }

  const output = {
    observation_memory_registry_version: "observation-memory-registry-v0.1",
    generated_at: new Date().toISOString(),
    source_memory_grading_registry: INPUT_PATH,
    policy: {
      principle:
        "Observation memory preserves factual historical details for recall, comparison, and later abstraction without replacing experience memory.",
      observation_memory_is_not_experience_memory: true,
      facts_are_retained_separately_from_principles: true,
      archive_is_preferred_over_deletion: true,
      production_mutation_allowed: false,
    },
    summary: {
      observations_created: observations.length,
      tier_counts: tierCounts,
    },
    observations,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    observation_memory_registry_version: output.observation_memory_registry_version,
    observations_created: observations.length,
    tier_counts: tierCounts,
    output: OUTPUT_PATH,
  });
}

main();
