import fs from "fs";

const DASHBOARD_PATH = "data/intelligence/coverage-hardening-dashboard-v0.2.json";
const EXPERIENCE_PATH = "data/intelligence/experience-registry-v0.2.json";
const OUTPUT_PATH = "data/intelligence/principle-candidate-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function candidateId(index: number): string {
  return `PC_${String(index + 1).padStart(3, "0")}`;
}

function buildRationale(driver: AnyRecord, experience: AnyRecord | undefined): string[] {
  const notes: string[] = [];

  if (driver.coverage_score >= 0.75) {
    notes.push("Coverage score meets principle-candidate threshold.");
  }

  if (driver.diversity_score >= 0.75) {
    notes.push("Diversity score meets principle-candidate threshold.");
  }

  if (driver.principle_readiness_score >= 0.8) {
    notes.push("Combined readiness score is strong.");
  }

  if ((driver.warnings ?? []).length === 0) {
    notes.push("No active coverage or diversity warnings.");
  }

  if (experience?.case_count) {
    notes.push(`Supported by ${experience.case_count} reviewed historical cases.`);
  }

  if (experience?.unique_periods) {
    notes.push(`Observed across ${experience.unique_periods} unique periods.`);
  }

  if (experience?.maturity_stage) {
    notes.push(`Current maturity stage: ${experience.maturity_stage}.`);
  }

  return notes;
}

const dashboard = readJson(DASHBOARD_PATH);
const experienceRegistry = readJson(EXPERIENCE_PATH);

const dashboardDrivers: AnyRecord[] = dashboard.drivers ?? [];
const experiences: AnyRecord[] = experienceRegistry.driver_experiences ?? [];

const experienceByDriver = new Map<string, AnyRecord>();
for (const experience of experiences) {
  experienceByDriver.set(experience.driver_id, experience);
}

const eligibleDrivers = dashboardDrivers.filter(
  (driver) => driver.principle_readiness_status === "principle_candidate"
);

const candidates = eligibleDrivers.map((driver, index) => {
  const experience = experienceByDriver.get(driver.driver_id);

  return {
    candidate_id: candidateId(index),
    candidate_version: "principle-candidate-v0.1",

    driver_id: driver.driver_id,
    driver_name: driver.driver_name,

    candidate_status: "ready_for_review",
    approved_principle: false,

    coverage_score: round(driver.coverage_score ?? 0),
    coverage_status: driver.coverage_status,

    diversity_score: round(driver.diversity_score ?? 0),
    diversity_status: driver.diversity_status,

    principle_readiness_score: round(driver.principle_readiness_score ?? 0),
    principle_readiness_status: driver.principle_readiness_status,

    supporting_case_count: driver.case_count ?? experience?.case_count ?? 0,
    supporting_period_count: experience?.unique_periods ?? driver.periods ?? 0,

    experience_strength: experience?.experience_strength ?? null,
    maturity_stage: experience?.maturity_stage ?? null,
    confidence_score: experience?.confidence_score ?? null,

    warnings: driver.warnings ?? [],

    review_rationale: buildRationale(driver, experience),

    governance: {
      principle_candidate_only: true,
      approved_principle: false,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "This candidate has passed coverage and diversity screening, but it is not an approved principle.",
    },

    supporting_cases: (experience?.cases ?? []).map((c: AnyRecord) => ({
      case_id: c.case_id,
      period: c.period,
      series_name: c.series_name,
      confidence: c.confidence,
      driver_score: c.driver_score,
      evidence_count: c.evidence_count,
    })),
  };
});

const summary = {
  candidates_identified: candidates.length,
  source_drivers_assessed: dashboard.summary?.drivers_assessed ?? dashboardDrivers.length,
  selection_rule: "principle_readiness_status == principle_candidate",
  candidate_driver_ids: candidates.map((candidate) => candidate.driver_id),
};

const output = {
  principle_candidate_registry_version: "principle-candidate-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_dashboard: DASHBOARD_PATH,
  source_experience_registry: EXPERIENCE_PATH,

  policy: {
    principle:
      "Principle candidate registry v0.1 records drivers that passed coverage and diversity gates. It does not approve principles and does not mutate production memory.",
    production_mutation_allowed: false,
    human_review_required_before_principle_extraction: true,
    principle_candidate_is_not_principle: true,
  },

  summary,
  candidates,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.principle_candidate_registry_version,
  candidates_identified: summary.candidates_identified,
  candidate_driver_ids: summary.candidate_driver_ids,
  output: OUTPUT_PATH,
});

for (const candidate of candidates) {
  console.log(
    `${candidate.candidate_id} | ${candidate.driver_id} | readiness=${candidate.principle_readiness_score} | ${candidate.candidate_status}`
  );
}
