import fs from "fs";
import path from "path";

const EXPERIENCE_INPUT = "data/intelligence/experience-registry-v0.2.json";
const OBSERVATION_INPUT = "data/intelligence/observation-memory-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/principle-candidate-registry-v0.1.json";

function topPatterns(patterns: any[], limit = 5) {
  return [...(patterns || [])]
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, limit);
}

function principleTemplate(driverName: string, patterns: any[]) {
  const phrases = topPatterns(patterns, 3).map((p) => p.phrase);

  if (phrases.length === 0) {
    return `${driverName} appears to form a recurring historical driver pattern, but supporting mechanisms require further review.`;
  }

  return `${driverName} appears to be associated with recurring evidence patterns around ${phrases.join(", ")}.`;
}

function confidenceBand(experienceStrength: number, confidenceScore: number) {
  const combined = experienceStrength * 0.6 + confidenceScore * 0.4;

  if (combined >= 0.8) return "strong_candidate";
  if (combined >= 0.6) return "moderate_candidate";
  return "weak_candidate";
}

function main() {
  const experience = JSON.parse(fs.readFileSync(EXPERIENCE_INPUT, "utf-8"));
  const observation = JSON.parse(fs.readFileSync(OBSERVATION_INPUT, "utf-8"));

  const drivers = experience.driver_experiences;
  const observations = observation.observations;

  if (!Array.isArray(drivers)) {
    throw new Error("Expected experience.driver_experiences to be an array.");
  }

  if (!Array.isArray(observations)) {
    throw new Error("Expected observation.observations to be an array.");
  }

  const principles = drivers.map((d: any) => {
    const supportingObservations = observations.filter(
      (o: any) => o.driver_id === d.driver_id
    );

    const patterns = topPatterns(d.evidence_patterns || [], 5);

    return {
      principle_candidate_version: "principle-candidate-v0.1",
      principle_id: `PRN-${d.driver_id}`,
      driver_id: d.driver_id,
      driver_name: d.driver_name,

      candidate_principle: principleTemplate(d.driver_name, d.evidence_patterns),

      principle_status: "candidate",
      confidence_band: confidenceBand(d.experience_strength, d.confidence_score),

      supporting_evidence: {
        supporting_case_count: d.case_count,
        supporting_observation_count: supportingObservations.length,
        supporting_periods: Array.from(
          new Set(supportingObservations.map((o: any) => o.period))
        ).sort(),
        supporting_patterns: patterns,
        supporting_observation_ids: supportingObservations.map(
          (o: any) => o.observation_id
        ),
      },

      experience_metrics: {
        experience_strength: d.experience_strength,
        confidence_score: d.confidence_score,
        recurrence_score: d.recurrence_score,
        persistence_score: d.persistence_score,
        volatility_score: d.volatility_score,
        maturity_stage: d.maturity_stage,
        bias_warnings: d.bias_warnings,
      },

      future_validation: {
        validation_required: true,
        supporting_future_observations: [],
        contradicting_future_observations: [],
        validation_status: "unvalidated",
        principle_score: null,
      },

      governance: {
        principle_is_candidate_not_truth: true,
        human_review_required: true,
        auto_publish_allowed: false,
        production_mutation_allowed: false,
      },
    };
  });

  const confidenceCounts: Record<string, number> = {};
  for (const p of principles) {
    confidenceCounts[p.confidence_band] =
      (confidenceCounts[p.confidence_band] || 0) + 1;
  }

  const output = {
    principle_candidate_registry_version: "principle-candidate-registry-v0.1",
    generated_at: new Date().toISOString(),
    source_experience_registry: EXPERIENCE_INPUT,
    source_observation_memory_registry: OBSERVATION_INPUT,
    policy: {
      principle:
        "Principle candidates are generalized lessons derived from observation memory and experience memory. They are not treated as validated truth.",
      observation_memory_is_source_for_cases: true,
      experience_registry_is_source_for_patterns: true,
      validation_required_before_use_as_principle: true,
      production_mutation_allowed: false,
    },
    summary: {
      drivers_processed: drivers.length,
      candidate_principles_generated: principles.length,
      confidence_counts: confidenceCounts,
    },
    principles,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    principle_candidate_registry_version:
      output.principle_candidate_registry_version,
    candidate_principles_generated: principles.length,
    confidence_counts: confidenceCounts,
    output: OUTPUT_PATH,
  });
}

main();
