import fs from "fs";
import path from "path";

const EXPERIENCE_PATH = "data/intelligence/experience-registry-v0.2.json";
const CONFIDENCE_PATH = "data/intelligence/intelligence-confidence-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/replay-coverage-assessment-registry-v0.1.json";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function coverageStatus(score: number): string {
  if (score >= 0.75) return "well_covered";
  if (score >= 0.55) return "moderately_covered";
  if (score >= 0.35) return "underrepresented";
  return "thin_or_missing";
}

function priorityFromStatus(status: string): string {
  if (status === "thin_or_missing") return "critical";
  if (status === "underrepresented") return "high";
  if (status === "moderately_covered") return "medium";
  return "low";
}

function main() {
  const experience = JSON.parse(fs.readFileSync(EXPERIENCE_PATH, "utf-8"));
  const confidence = JSON.parse(fs.readFileSync(CONFIDENCE_PATH, "utf-8"));

  const confidenceByDriver = new Map(
    confidence.confidence_records.map((r: any) => [r.driver_id, r])
  );

  const allDriverIds = Array.from(
    new Set([
      ...experience.driver_experiences.map((d: any) => d.driver_id),
      ...confidence.confidence_records.map((r: any) => r.driver_id),
    ])
  ).sort();

  const experienceByDriver = new Map(
    experience.driver_experiences.map((d: any) => [d.driver_id, d])
  );

  const assessments = allDriverIds.map((driverId) => {
    const d: any = experienceByDriver.get(driverId);
    const c: any = confidenceByDriver.get(driverId);

    const caseCount = d?.case_count || 0;
    const periodCount = d?.unique_periods || 0;
    const confidenceScore = d?.confidence_score ?? null;
    const experienceStrength = d?.experience_strength ?? null;

    const caseCoverage = clamp(caseCount / 10);
    const periodCoverage = clamp(periodCount / 6);
    const confidenceCoverage = confidenceScore === null ? 0 : confidenceScore;
    const strengthCoverage = experienceStrength === null ? 0 : experienceStrength;

    const coverageScore = Number(
      (
        caseCoverage * 0.3 +
        periodCoverage * 0.25 +
        confidenceCoverage * 0.2 +
        strengthCoverage * 0.25
      ).toFixed(3)
    );

    const status = coverageStatus(coverageScore);

    return {
      replay_coverage_assessment_version: "replay-coverage-assessment-v0.1",
      driver_id: driverId,
      driver_label: c?.driver_label || d?.driver_name || driverId,

      coverage_score: coverageScore,
      coverage_status: status,
      recommended_priority: priorityFromStatus(status),

      coverage_inputs: {
        case_count: caseCount,
        target_case_count: 10,
        case_coverage: Number(caseCoverage.toFixed(3)),

        period_count: periodCount,
        target_period_count: 6,
        period_coverage: Number(periodCoverage.toFixed(3)),

        confidence_score: confidenceScore,
        experience_strength: experienceStrength,
        intelligence_confidence_status: c?.confidence_status || "missing",
        intelligence_confidence_score: c?.overall_confidence_score ?? null,
      },

      recommended_replay_action:
        status === "well_covered"
          ? "defer_new_cases_unless_high_value_event"
          : status === "moderately_covered"
            ? "add_targeted_cases_to_improve_period_depth"
            : status === "underrepresented"
              ? "prioritize_new_cases_for_driver"
              : "build_foundational_replay_cases",

      governance: {
        coverage_assessment_is_diagnostic_not_memory: true,
        does_not_mutate_experience_registry: true,
        human_review_required_before_replay_expansion: true,
        production_mutation_allowed: false,
      },
    };
  });

  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};

  for (const a of assessments) {
    statusCounts[a.coverage_status] = (statusCounts[a.coverage_status] || 0) + 1;
    priorityCounts[a.recommended_priority] =
      (priorityCounts[a.recommended_priority] || 0) + 1;
  }

  const output = {
    replay_coverage_assessment_registry_version:
      "replay-coverage-assessment-registry-v0.1",
    generated_at: new Date().toISOString(),
    sources: {
      experience_registry: EXPERIENCE_PATH,
      intelligence_confidence_registry: CONFIDENCE_PATH,
    },
    policy: {
      principle:
        "Replay coverage assessment identifies evidence gaps and replay expansion priorities without changing historical memory.",
      diagnostic_only: true,
      replay_expansion_should_target_coverage_gaps: true,
      production_mutation_allowed: false,
    },
    summary: {
      drivers_assessed: assessments.length,
      coverage_status_counts: statusCounts,
      recommended_priority_counts: priorityCounts,
    },
    assessments,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    replay_coverage_assessment_registry_version:
      output.replay_coverage_assessment_registry_version,
    drivers_assessed: assessments.length,
    coverage_status_counts: statusCounts,
    recommended_priority_counts: priorityCounts,
    output: OUTPUT_PATH,
  });
}

main();
