import fs from "node:fs";
import path from "node:path";

const coveragePath =
  "data/intelligence/replay-coverage-assessment-registry-v0.1.json";

const experiencePath =
  "data/intelligence/experience-registry-v0.2.json";

const outputPath =
  "data/intelligence/coverage-hardening-dashboard-v0.1.json";

const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
const experience = JSON.parse(fs.readFileSync(experiencePath, "utf8"));

const experienceByDriver = new Map(
  experience.driver_experiences.map((d: any) => [d.driver_id, d])
);

const rows = coverage.assessments
  .map((a: any) => {
    const e: any = experienceByDriver.get(a.driver_id);

    return {
      driver_id: a.driver_id,
      driver_label: a.driver_label,
      coverage_score: a.coverage_score,
      coverage_status: a.coverage_status,
      recommended_priority: a.recommended_priority,
      case_count: a.coverage_inputs.case_count,
      period_count: a.coverage_inputs.period_count,
      experience_strength: a.coverage_inputs.experience_strength,
      maturity_stage: e?.maturity_stage ?? "none",
      confidence_score: a.coverage_inputs.confidence_score,
      intelligence_confidence_status:
        a.coverage_inputs.intelligence_confidence_status,
      recommended_action: a.recommended_replay_action
    };
  })
  .sort((a: any, b: any) => a.coverage_score - b.coverage_score);

const dashboard = {
  coverage_hardening_dashboard_version:
    "coverage-hardening-dashboard-v0.1",
  generated_at: new Date().toISOString(),
  sources: {
    coverage_assessment: coveragePath,
    experience_registry: experiencePath
  },
  policy: {
    diagnostic_only: true,
    production_mutation_allowed: false,
    purpose:
      "Summarize replay coverage, experience maturity, and hardening priorities without mutating memory."
  },
  summary: {
    drivers_assessed: rows.length,
    well_covered: rows.filter((r: any) => r.coverage_status === "well_covered").length,
    moderately_covered: rows.filter((r: any) => r.coverage_status === "moderately_covered").length,
    thin_or_missing: rows.filter((r: any) => r.coverage_status === "thin_or_missing").length,
    critical_priority: rows.filter((r: any) => r.recommended_priority === "critical").length,
    low_priority: rows.filter((r: any) => r.recommended_priority === "low").length
  },
  parked_items: [
    {
      driver_id: "MKT_001",
      reason:
        "No primary cases observed; appears to behave as a supporting mechanism rather than standalone driver.",
      status: "parked_for_taxonomy_review",
      action:
        "Do not force replay cases until taxonomy review determines whether driver should remain primary."
    }
  ],
  hardening_queue: rows.filter(
    (r: any) =>
      r.driver_id !== "MKT_001" &&
      r.recommended_priority !== "low"
  ),
  full_driver_table: rows
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));

console.log({
  dashboard_version: dashboard.coverage_hardening_dashboard_version,
  drivers_assessed: dashboard.summary.drivers_assessed,
  well_covered: dashboard.summary.well_covered,
  moderately_covered: dashboard.summary.moderately_covered,
  thin_or_missing: dashboard.summary.thin_or_missing,
  hardening_queue_count: dashboard.hardening_queue.length,
  output: outputPath
});

console.table(
  rows.map((r: any) => ({
    driver: r.driver_id,
    score: r.coverage_score,
    status: r.coverage_status,
    priority: r.recommended_priority,
    cases: r.case_count,
    periods: r.period_count,
    maturity: r.maturity_stage
  }))
);
