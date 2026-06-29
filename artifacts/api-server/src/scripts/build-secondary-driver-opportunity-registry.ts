import fs from "fs";
import path from "path";

const OUTCOMES_PATH = "data/intelligence/historical-outcomes-v0.2.json";
const COVERAGE_PATH = "data/intelligence/replay-coverage-assessment-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/secondary-driver-opportunity-registry-v0.1.json";

function opportunityLevel(args: {
  secondaryAppearances: number;
  avgSecondaryScore: number;
  coverageScore: number | null;
}): string {
  const coverage = args.coverageScore ?? 0;

  if (
    args.secondaryAppearances >= 5 &&
    args.avgSecondaryScore >= 15 &&
    coverage < 0.35
  ) {
    return "very_high";
  }

  if (
    args.secondaryAppearances >= 3 &&
    args.avgSecondaryScore >= 10 &&
    coverage < 0.55
  ) {
    return "high";
  }

  if (args.secondaryAppearances >= 3 && coverage < 0.75) {
    return "medium";
  }

  return "low";
}

function recommendation(level: string): string {
  if (level === "very_high") {
    return "promote_to_transmission_mechanism_candidate_and_add_targeted_replay_cases";
  }

  if (level === "high") {
    return "review_as_transmission_mechanism_candidate";
  }

  if (level === "medium") {
    return "monitor_secondary_driver_role";
  }

  return "no_immediate_action";
}

function main() {
  const outcomes = JSON.parse(fs.readFileSync(OUTCOMES_PATH, "utf-8"));
  const coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, "utf-8"));

  const coverageByDriver = new Map(
    coverage.assessments.map((a: any) => [a.driver_id, a])
  );

  const appearances: Record<string, any> = {};

  for (const outcome of outcomes.outcomes) {
    for (const driver of outcome.ranked_drivers || []) {
      if (driver.driver_id === outcome.primary_driver) continue;

      if (!appearances[driver.driver_id]) {
        appearances[driver.driver_id] = {
          driver_id: driver.driver_id,
          driver_name: driver.driver_name,
          secondary_appearances: 0,
          total_secondary_score: 0,
          total_secondary_evidence_count: 0,
          primary_drivers_observed_with: {},
          cases: [],
        };
      }

      const item = appearances[driver.driver_id];

      item.secondary_appearances += 1;
      item.total_secondary_score += driver.total_score || 0;
      item.total_secondary_evidence_count += driver.evidence_count || 0;

      item.primary_drivers_observed_with[outcome.primary_driver] =
        (item.primary_drivers_observed_with[outcome.primary_driver] || 0) + 1;

      item.cases.push({
        case_id: outcome.case_id,
        period: outcome.period,
        series_name: outcome.series_name,
        primary_driver: outcome.primary_driver,
        primary_driver_name: outcome.primary_driver_name,
        secondary_score: driver.total_score || 0,
        secondary_evidence_count: driver.evidence_count || 0,
        matched_phrases: driver.matched_phrases || [],
        supporting_evidence: driver.supporting_evidence || [],
      });
    }
  }

  const opportunities = Object.values(appearances).map((item: any) => {
    const coverageRecord: any = coverageByDriver.get(item.driver_id);

    const avgSecondaryScore = Number(
      (item.total_secondary_score / item.secondary_appearances).toFixed(3)
    );

    const avgSecondaryEvidenceCount = Number(
      (item.total_secondary_evidence_count / item.secondary_appearances).toFixed(3)
    );

    const level = opportunityLevel({
      secondaryAppearances: item.secondary_appearances,
      avgSecondaryScore,
      coverageScore: coverageRecord?.coverage_score ?? null,
    });

    return {
      secondary_driver_opportunity_version: "secondary-driver-opportunity-v0.1",
      driver_id: item.driver_id,
      driver_name: item.driver_name,

      opportunity_level: level,
      recommended_action: recommendation(level),

      secondary_role_metrics: {
        secondary_appearances: item.secondary_appearances,
        average_secondary_score: avgSecondaryScore,
        average_secondary_evidence_count: avgSecondaryEvidenceCount,
        total_secondary_score: item.total_secondary_score,
      },

      replay_coverage_context: {
        coverage_score: coverageRecord?.coverage_score ?? null,
        coverage_status: coverageRecord?.coverage_status ?? "missing",
        recommended_priority: coverageRecord?.recommended_priority ?? "unknown",
      },

      mechanism_hypothesis: {
        possible_transmission_mechanism: level === "very_high" || level === "high",
        observed_with_primary_drivers: item.primary_drivers_observed_with,
        hypothesis:
          level === "very_high" || level === "high"
            ? `${item.driver_name} may act as a recurring transmission mechanism rather than only a primary driver.`
            : `${item.driver_name} has secondary appearances but does not yet warrant mechanism promotion.`,
      },

      supporting_cases: item.cases,

      governance: {
        diagnostic_only: true,
        does_not_mutate_experience_registry: true,
        does_not_promote_driver_automatically: true,
        human_review_required_before_memory_update: true,
        production_mutation_allowed: false,
      },
    };
  });

  opportunities.sort((a: any, b: any) => {
    const order: Record<string, number> = {
      very_high: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return (
      order[a.opportunity_level] - order[b.opportunity_level] ||
      b.secondary_role_metrics.secondary_appearances -
        a.secondary_role_metrics.secondary_appearances
    );
  });

  const opportunityCounts: Record<string, number> = {};
  for (const opp of opportunities as any[]) {
    opportunityCounts[opp.opportunity_level] =
      (opportunityCounts[opp.opportunity_level] || 0) + 1;
  }

  const output = {
    secondary_driver_opportunity_registry_version:
      "secondary-driver-opportunity-registry-v0.1",
    generated_at: new Date().toISOString(),
    sources: {
      historical_outcomes: OUTCOMES_PATH,
      replay_coverage_assessment: COVERAGE_PATH,
    },
    policy: {
      principle:
        "Secondary driver opportunities identify repeated non-primary drivers that may function as transmission mechanisms.",
      diagnostic_only: true,
      secondary_driver_is_not_automatically_experience_memory: true,
      human_review_required_before_driver_promotion: true,
      production_mutation_allowed: false,
    },
    summary: {
      secondary_drivers_assessed: opportunities.length,
      opportunity_counts: opportunityCounts,
    },
    opportunities,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    secondary_driver_opportunity_registry_version:
      output.secondary_driver_opportunity_registry_version,
    secondary_drivers_assessed: opportunities.length,
    opportunity_counts: opportunityCounts,
    output: OUTPUT_PATH,
  });
}

main();
