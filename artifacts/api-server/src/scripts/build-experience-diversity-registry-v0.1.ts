import fs from "fs";

const OUTCOMES_PATH = "data/intelligence/historical-outcomes-v0.2.json";
const EXPERIENCE_PATH = "data/intelligence/experience-registry-v0.2.json";
const OUTPUT_PATH = "data/intelligence/experience-diversity-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function yearFromPeriod(period: string | number | undefined): number | null {
  if (!period) return null;
  const match = String(period).match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function decadeFromYear(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function familyFromCaseId(caseId: string): string {
  return caseId
    .replace(/^SG-/, "")
    .replace(/-\d{4}.*$/, "")
    .replace(/-scorecard.*$/, "");
}

function scoreByCount(count: number, strongAt: number): number {
  return clamp(count / strongAt);
}

function status(score: number): string {
  if (score >= 0.8) return "strong";
  if (score >= 0.6) return "developing";
  if (score >= 0.4) return "limited";
  return "weak";
}

const historicalOutcomes = readJson(OUTCOMES_PATH);
const experienceRegistry = readJson(EXPERIENCE_PATH);

const allOutcomes: AnyRecord[] = historicalOutcomes.outcomes ?? [];
const driverExperiences: AnyRecord[] = experienceRegistry.driver_experiences ?? [];

const drivers = driverExperiences.map((driver) => {
  const driverId = driver.driver_id;
  const cases: AnyRecord[] = driver.cases ?? [];

  const years = cases
    .map((c) => yearFromPeriod(c.period))
    .filter((y): y is number => y !== null);

  const decades = [...new Set(years.map(decadeFromYear))].sort();
  const oldestYear = years.length ? Math.min(...years) : null;
  const newestYear = years.length ? Math.max(...years) : null;
  const timeSpanYears =
    oldestYear !== null && newestYear !== null ? newestYear - oldestYear + 1 : 0;

  const families = cases.map((c) => familyFromCaseId(String(c.case_id ?? "")));
  const uniqueFamilies = [...new Set(families.filter(Boolean))].sort();

  const sectors = cases.map((c) => String(c.series_name ?? "UNKNOWN"));
  const uniqueSectors = [...new Set(sectors.filter(Boolean))].sort();

  const familyCounts: Record<string, number> = {};
  for (const family of families) {
    if (!family) continue;
    familyCounts[family] = (familyCounts[family] ?? 0) + 1;
  }

  const largestFamilyCount = Object.values(familyCounts).length
    ? Math.max(...Object.values(familyCounts))
    : 0;

  const concentrationRatio = cases.length ? largestFamilyCount / cases.length : 0;
  const concentrationScore = cases.length <= 1 ? 0 : clamp(1 - concentrationRatio);

  let primaryAppearances = 0;
  let secondaryAppearances = 0;

  for (const outcome of allOutcomes) {
    if (outcome.primary_driver === driverId) {
      primaryAppearances += 1;
    }

    const rankedDrivers: AnyRecord[] = outcome.ranked_drivers ?? [];
    const appearsSecondary = rankedDrivers.some(
      (ranked, index) => index > 0 && ranked.driver_id === driverId
    );

    if (appearsSecondary) {
      secondaryAppearances += 1;
    }
  }

  const totalAppearances = primaryAppearances + secondaryAppearances;
  const attributionMixScore =
    totalAppearances === 0
      ? 0
      : primaryAppearances > 0 && secondaryAppearances > 0
        ? 1
        : 0.45;

  const temporalScore = round(
    clamp(
      scoreByCount(decades.length, 3) * 0.65 +
        scoreByCount(timeSpanYears, 12) * 0.35
    )
  );

  const familyScore = round(scoreByCount(uniqueFamilies.length, 4));
  const sectorScore = round(scoreByCount(uniqueSectors.length, 4));
  const attributionScore = round(attributionMixScore);
  const concentrationDiversityScore = round(concentrationScore);

  const experienceDiversityScore = round(
    temporalScore * 0.25 +
      familyScore * 0.25 +
      sectorScore * 0.2 +
      attributionScore * 0.15 +
      concentrationDiversityScore * 0.15
  );

  const warnings: string[] = [];

  if (concentrationRatio >= 0.75 && cases.length >= 4) {
    warnings.push("HIGH_REPLAY_FAMILY_CONCENTRATION");
  }

  if (decades.length <= 1 && cases.length >= 4) {
    warnings.push("TEMPORAL_CONCENTRATION");
  }

  if (uniqueSectors.length <= 1 && cases.length >= 4) {
    warnings.push("SECTOR_CONCENTRATION");
  }

  if (primaryAppearances === 0 && secondaryAppearances > 0) {
    warnings.push("SECONDARY_ONLY_DRIVER");
  }

  return {
    diversity_version: "driver-experience-diversity-v0.1",
    driver_id: driverId,
    driver_name: driver.driver_name,
    attribution_bucket: driver.attribution_bucket,
    case_count: cases.length,

    temporal: {
      oldest_year: oldestYear,
      newest_year: newestYear,
      time_span_years: timeSpanYears,
      decades_represented: decades,
      decade_count: decades.length,
      score: temporalScore,
    },

    replay_family: {
      families_represented: uniqueFamilies,
      family_count: uniqueFamilies.length,
      family_counts: familyCounts,
      largest_family_count: largestFamilyCount,
      concentration_ratio: round(concentrationRatio),
      score: familyScore,
    },

    sector: {
      sectors_represented: uniqueSectors,
      sector_count: uniqueSectors.length,
      score: sectorScore,
    },

    attribution: {
      primary_appearances: primaryAppearances,
      secondary_appearances: secondaryAppearances,
      total_appearances: totalAppearances,
      score: attributionScore,
    },

    concentration: {
      largest_family_count: largestFamilyCount,
      concentration_ratio: round(concentrationRatio),
      concentration_diversity_score: concentrationDiversityScore,
    },

    experience_diversity_score: experienceDiversityScore,
    diversity_status: status(experienceDiversityScore),
    warnings,
  };
});

const summary = drivers.reduce(
  (acc: AnyRecord, driver: AnyRecord) => {
    acc.drivers_processed += 1;
    acc[driver.diversity_status] = (acc[driver.diversity_status] ?? 0) + 1;

    if (driver.warnings.length > 0) {
      acc.drivers_with_warnings += 1;
    }

    return acc;
  },
  {
    drivers_processed: 0,
    strong: 0,
    developing: 0,
    limited: 0,
    weak: 0,
    drivers_with_warnings: 0,
  }
);

const output = {
  experience_diversity_registry_version: "experience-diversity-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_historical_outcomes: OUTCOMES_PATH,
  source_experience_registry: EXPERIENCE_PATH,
  policy: {
    principle:
      "Experience diversity registry v0.1 evaluates whether driver experience is sufficiently diverse before principle extraction. It does not mutate production memory.",
    production_mutation_allowed: false,
    human_review_required_before_principle_extraction: true,
  },
  scoring_notes: {
    purpose:
      "Measures temporal, replay-family, sector, attribution, and concentration diversity to detect overfitting risk in experience memory.",
    weights: {
      temporal: 0.25,
      replay_family: 0.25,
      sector: 0.2,
      attribution: 0.15,
      concentration: 0.15,
    },
    status_bands: {
      strong: ">= 0.80",
      developing: ">= 0.60",
      limited: ">= 0.40",
      weak: "< 0.40",
    },
  },
  summary,
  drivers,
};

fs.mkdirSync("data/intelligence", { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.experience_diversity_registry_version,
  drivers_processed: summary.drivers_processed,
  strong: summary.strong,
  developing: summary.developing,
  limited: summary.limited,
  weak: summary.weak,
  drivers_with_warnings: summary.drivers_with_warnings,
  output: OUTPUT_PATH,
});

for (const driver of drivers) {
  console.log(
    `${driver.driver_id} | diversity=${driver.experience_diversity_score} | ${driver.diversity_status} | warnings=${driver.warnings.join(",") || "none"}`
  );
}
