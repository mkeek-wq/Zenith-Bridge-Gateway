import fs from "fs";
import path from "path";

type ExperienceCase = {
  case_id: string;
  period: string;
  series_name: string;
  confidence: string;
  confidence_weight: number;
  driver_score: number;
  evidence_count: number;
};

type DriverExperience = {
  driver_id: string;
  driver_name: string;
  experience_strength: number;
  confidence_score: number;
  recurrence_score: number;
  persistence_score: number;
  volatility_score: number;
  maturity_stage: string;
  bias_warnings: string[];
  cases: ExperienceCase[];
};

const INPUT_PATH = "data/intelligence/experience-registry-v0.2.json";
const OUTPUT_PATH = "data/intelligence/memory-grading-registry-v0.1.json";

function memoryScore(c: ExperienceCase, d: DriverExperience): number {
  const confidence = c.confidence_weight ?? 0;
  const evidence = Math.min((c.evidence_count ?? 0) / 5, 1);
  const driverScore = Math.min((c.driver_score ?? 0) / 100, 1);
  const experienceStrength = d.experience_strength ?? 0;

  return Number(
    (
      confidence * 0.3 +
      evidence * 0.2 +
      driverScore * 0.2 +
      experienceStrength * 0.3
    ).toFixed(3)
  );
}

function gradeCases(driver: DriverExperience) {
  const cases = [...driver.cases].sort((a, b) =>
    String(a.period).localeCompare(String(b.period))
  );

  const first = cases[0]?.case_id;
  const last = cases[cases.length - 1]?.case_id;

  return cases.map((c) => {
    const score = memoryScore(c, driver);

    let memory_action = "retain_active";
    let retention_reason = "High enough memory score for active retention.";

    if (c.case_id === first) {
      memory_action = "retain_anchor";
      retention_reason = "First known memory for this driver must be retained.";
    } else if (c.case_id === last) {
      memory_action = "retain_anchor";
      retention_reason = "Most recent memory for this driver must be retained.";
    } else if (cases.length >= 10 && score < 0.65) {
      memory_action = "archive_to_lake";
      retention_reason =
        "Intermediate memory in large cluster with lower grading score.";
    } else if (cases.length >= 10 && score < 0.75) {
      memory_action = "compress";
      retention_reason =
        "Intermediate memory in large cluster suitable for compression.";
    }

    return {
      memory_grade_version: "memory-grade-v0.1",
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      case_id: c.case_id,
      period: c.period,
      series_name: c.series_name,

      memory_score: score,
      memory_action,
      retention_reason,

      grading_inputs: {
        confidence: c.confidence,
        confidence_weight: c.confidence_weight,
        driver_score: c.driver_score,
        evidence_count: c.evidence_count,
        driver_experience_strength: driver.experience_strength,
        driver_confidence_score: driver.confidence_score,
        recurrence_score: driver.recurrence_score,
        persistence_score: driver.persistence_score,
        volatility_score: driver.volatility_score,
        maturity_stage: driver.maturity_stage,
        bias_warnings: driver.bias_warnings,
        cluster_case_count: cases.length,
      },

      governance: {
        delete_allowed: false,
        archive_only: true,
        human_review_required_before_removal: true,
        production_mutation_allowed: false,
      },
    };
  });
}

function main() {
  const source = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  const drivers: DriverExperience[] = source.driver_experiences;

  if (!Array.isArray(drivers)) {
    throw new Error("Expected source.driver_experiences to be an array.");
  }

  const memory_grades = drivers.flatMap(gradeCases);

  const actionCounts: Record<string, number> = {};
  for (const g of memory_grades) {
    actionCounts[g.memory_action] = (actionCounts[g.memory_action] || 0) + 1;
  }

  const output = {
    memory_grading_registry_version: "memory-grading-registry-v0.1",
    generated_at: new Date().toISOString(),
    source_experience_registry: INPUT_PATH,
    policy: {
      principle:
        "Memory grading classifies historical memory for retention, compression, or archive without deleting or mutating source memory.",
      first_memory_always_retained: true,
      latest_memory_always_retained: true,
      intermediate_memory_may_be_compressed_or_archived: true,
      deletion_allowed: false,
      production_mutation_allowed: false,
    },
    summary: {
      drivers_processed: drivers.length,
      memories_graded: memory_grades.length,
      action_counts: actionCounts,
    },
    memory_grades,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    memory_grading_registry_version: output.memory_grading_registry_version,
    drivers_processed: drivers.length,
    memories_graded: memory_grades.length,
    action_counts: actionCounts,
    output: OUTPUT_PATH,
  });
}

main();
