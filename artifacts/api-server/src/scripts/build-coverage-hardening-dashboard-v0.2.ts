import fs from "fs";

const COVERAGE_PATH = "data/intelligence/coverage-hardening-dashboard-v0.1.json";
const DIVERSITY_PATH = "data/intelligence/experience-diversity-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/coverage-hardening-dashboard-v0.2.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function status(score: number): string {
  if (score >= 0.8) return "strong";
  if (score >= 0.6) return "developing";
  if (score >= 0.4) return "limited";
  return "weak";
}

function readinessStatus(coverageScore: number, diversityScore: number): string {
  if (coverageScore >= 0.75 && diversityScore >= 0.75) {
    return "principle_candidate";
  }

  if (coverageScore >= 0.7 && diversityScore >= 0.6) {
    return "watchlist_candidate";
  }

  if (coverageScore >= 0.7 && diversityScore < 0.6) {
    return "coverage_strong_diversity_limited";
  }

  if (coverageScore < 0.7 && diversityScore >= 0.6) {
    return "coverage_limited_diversity_acceptable";
  }

  return "not_ready";
}

function recommendation(readiness: string): string {
  switch (readiness) {
    case "principle_candidate":
      return "Eligible for cautious principle extraction after human review.";
    case "watchlist_candidate":
      return "Promising but should remain under review before principle extraction.";
    case "coverage_strong_diversity_limited":
      return "Do not extract broad principles yet. Add more diverse cases across replay families, sectors, or periods.";
    case "coverage_limited_diversity_acceptable":
      return "Improve coverage depth before principle extraction.";
    default:
      return "Not ready for principle extraction. Continue hardening.";
  }
}

const coverageDashboard = readJson(COVERAGE_PATH);
const diversityRegistry = readJson(DIVERSITY_PATH);

const coverageDrivers: AnyRecord[] =
  coverageDashboard.full_driver_table ??
  coverageDashboard.drivers ??
  coverageDashboard.driver_coverage ??
  coverageDashboard.coverage ??
  [];

const diversityDrivers: AnyRecord[] = diversityRegistry.drivers ?? [];

const diversityByDriver = new Map<string, AnyRecord>();
for (const driver of diversityDrivers) {
  diversityByDriver.set(driver.driver_id, driver);
}

const drivers = coverageDrivers.map((coverageDriver) => {
  const driverId = coverageDriver.driver_id;
  const diversityDriver = diversityByDriver.get(driverId);

  const coverageScore =
    coverageDriver.coverage_score ??
    coverageDriver.score ??
    coverageDriver.experience_strength ??
    0;

  const diversityScore = diversityDriver?.experience_diversity_score ?? 0;

  const principleReadinessScore = round(
    coverageScore * 0.55 + diversityScore * 0.45
  );

  const readiness = readinessStatus(coverageScore, diversityScore);

  const warnings = [
    ...(coverageDriver.warnings ?? []),
    ...(coverageDriver.bias_warnings ?? []),
    ...(diversityDriver?.warnings ?? []),
  ];

  return {
    driver_id: driverId,
    driver_name: coverageDriver.driver_name ?? diversityDriver?.driver_name,
    coverage_score: round(coverageScore),
    coverage_status:
      coverageDriver.coverage_status ??
      coverageDriver.status ??
      status(coverageScore),

    diversity_score: round(diversityScore),
    diversity_status:
      diversityDriver?.diversity_status ??
      (diversityDriver ? status(diversityScore) : "missing"),

    principle_readiness_score: principleReadinessScore,
    principle_readiness_status: readiness,

    case_count:
      coverageDriver.case_count ??
      coverageDriver.cases ??
      diversityDriver?.case_count ??
      0,

    periods:
      coverageDriver.periods ??
      coverageDriver.unique_periods ??
      diversityDriver?.temporal?.decade_count ??
      0,

    warnings: [...new Set(warnings)],

    hardening_recommendation: recommendation(readiness),

    diagnostic: {
      coverage_present: true,
      diversity_present: Boolean(diversityDriver),
      parked_or_no_primary_experience: !diversityDriver,
    },
  };
});

drivers.sort(
  (a, b) =>
    a.principle_readiness_score - b.principle_readiness_score ||
    a.driver_id.localeCompare(b.driver_id)
);

const summary = drivers.reduce(
  (acc: AnyRecord, driver: AnyRecord) => {
    acc.drivers_assessed += 1;
    acc[driver.principle_readiness_status] =
      (acc[driver.principle_readiness_status] ?? 0) + 1;

    if (driver.diversity_status === "missing") {
      acc.missing_diversity += 1;
    }

    if (driver.warnings.length > 0) {
      acc.drivers_with_warnings += 1;
    }

    return acc;
  },
  {
    drivers_assessed: 0,
    principle_candidate: 0,
    watchlist_candidate: 0,
    coverage_strong_diversity_limited: 0,
    coverage_limited_diversity_acceptable: 0,
    not_ready: 0,
    missing_diversity: 0,
    drivers_with_warnings: 0,
  }
);

const output = {
  dashboard_version: "coverage-hardening-dashboard-v0.2",
  generated_at: new Date().toISOString(),
  source_coverage_dashboard: COVERAGE_PATH,
  source_diversity_registry: DIVERSITY_PATH,
  policy: {
    principle:
      "Coverage hardening dashboard v0.2 combines coverage and diversity diagnostics to gate principle extraction. It is diagnostic only and does not mutate production memory.",
    production_mutation_allowed: false,
    human_review_required_before_principle_extraction: true,
  },
  scoring_notes: {
    principle_readiness_score:
      "coverage_score * 0.55 + diversity_score * 0.45",
    purpose:
      "Prevents principle extraction from high-coverage but low-diversity experience clusters.",
  },
  summary,
  drivers,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  dashboard_version: output.dashboard_version,
  drivers_assessed: summary.drivers_assessed,
  principle_candidate: summary.principle_candidate,
  watchlist_candidate: summary.watchlist_candidate,
  coverage_strong_diversity_limited:
    summary.coverage_strong_diversity_limited,
  not_ready: summary.not_ready,
  missing_diversity: summary.missing_diversity,
  drivers_with_warnings: summary.drivers_with_warnings,
  output: OUTPUT_PATH,
});

for (const driver of drivers) {
  console.log(
    `${driver.driver_id} | coverage=${driver.coverage_score} | diversity=${driver.diversity_score} | readiness=${driver.principle_readiness_score} | ${driver.principle_readiness_status}`
  );
}
