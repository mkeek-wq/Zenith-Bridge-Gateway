import fs from "node:fs";
import path from "node:path";

const scorecardDir =
  "data/historical-replay/m355381/evidence-pilots";

const outputPath = "data/intelligence/historical-outcomes-v0.2.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countBy(items: any[], keyFn: (item: any) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeOutcome(scorecard: any) {
  if (scorecard.recommended_outcome) {
    return {
      primary_driver: scorecard.recommended_outcome.primary_driver ?? null,
      primary_driver_name:
        scorecard.recommended_outcome.primary_driver_name ?? null,
      attribution_bucket:
        scorecard.recommended_outcome.attribution_bucket ?? null,
      confidence: scorecard.recommended_outcome.confidence ?? "unknown",
      driver_score: scorecard.recommended_outcome.total_score ?? 0,
      second_score: scorecard.recommended_outcome.second_score ?? 0,
      score_gap: scorecard.recommended_outcome.score_gap ?? 0,
      evidence_count: scorecard.evidence_items?.length ?? 0,
      supporting_evidence: scorecard.evidence_items ?? [],
      ranked_drivers: scorecard.ranked_drivers ?? [],
      bucket_scores: scorecard.bucket_scores ?? [],
    };
  }

    if (scorecard.attribution_summary) {
    return {
      primary_driver: scorecard.attribution_summary.primary_driver ?? null,
      primary_driver_name:
        scorecard.attribution_summary.primary_driver_name ?? null,
      attribution_bucket:
        scorecard.attribution_summary.attribution_bucket ?? null,
      confidence: scorecard.attribution_summary.confidence ?? "unknown",
      driver_score: scorecard.attribution_summary.driver_score ?? 0,
      second_score: scorecard.attribution_summary.second_score ?? 0,
      score_gap: scorecard.attribution_summary.score_gap ?? 0,
      evidence_count: scorecard.attribution_summary.evidence_count ?? 0,
      supporting_evidence:
        scorecard.ranked_drivers?.[0]?.supporting_evidence ?? [],
      ranked_drivers: scorecard.ranked_drivers ?? [],
      bucket_scores: scorecard.bucket_scores ?? [],
    };
  }

  if (scorecard.final_attribution?.primary_driver) {
    const rankedDrivers = scorecard.driver_scores ?? [];
    const primary = scorecard.final_attribution.primary_driver;
    const secondary = scorecard.final_attribution.secondary_driver ?? null;

    return {
      primary_driver: primary.driver_id ?? null,
      primary_driver_name: primary.driver_name ?? null,
      attribution_bucket: "policy_effect",
      confidence: scorecard.final_attribution.confidence ?? "unknown",
      driver_score: primary.score ?? 0,
      second_score: secondary?.score ?? 0,
      score_gap: (primary.score ?? 0) - (secondary?.score ?? 0),
      evidence_count: rankedDrivers.length,
      supporting_evidence: rankedDrivers,
      ranked_drivers: rankedDrivers,
      bucket_scores: rankedDrivers.map((driver: any) => ({
        bucket: driver.driver_id,
        score: driver.score,
        driver_name: driver.driver_name,
      })),
    };
  }

  return {
    primary_driver: null,
    primary_driver_name: null,
    attribution_bucket: null,
    confidence: "unknown",
    driver_score: 0,
    second_score: 0,
    score_gap: 0,
    evidence_count: 0,
    supporting_evidence: [],
    ranked_drivers: scorecard.ranked_drivers ?? [],
    bucket_scores: scorecard.bucket_scores ?? [],
  };
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const sourceScorecards = fs
  .readdirSync(scorecardDir)
  .filter((file) => file.endsWith("-scorecard-v0.1.json"))
  .sort()
  .map((file) => path.join(scorecardDir, file));

const outcomes = sourceScorecards.map((sourcePath) => {
  const scorecard = readJson(sourcePath);
  const normalized = normalizeOutcome(scorecard);

  return {
    outcome_version: "historical-outcome-v0.2",
    case_id: scorecard.case_id,
    period: scorecard.period ?? scorecard.case_summary?.period,
    series_name: scorecard.series_name ?? scorecard.case_summary?.series_name,
    outcome_type: "historical_attribution",
    primary_driver: normalized.primary_driver,
    primary_driver_name: normalized.primary_driver_name,
    attribution_bucket: normalized.attribution_bucket,
    confidence: normalized.confidence,
    driver_score: normalized.driver_score,
    second_score: normalized.second_score,
    score_gap: normalized.score_gap,
    evidence_count: normalized.evidence_count,
    supporting_evidence: normalized.supporting_evidence,
    ranked_drivers: normalized.ranked_drivers,
    bucket_scores: normalized.bucket_scores,
    review_status: "sandbox_approved",
    governance: {
      sandbox_only: true,
      production_mutation_allowed: false,
      human_review_required_before_production: true,
      source_scorecard: sourcePath,
    },
    created_at: new Date().toISOString(),
  };
});

const output = {
  historical_outcomes_version: "historical-outcomes-v0.2",
  generated_at: new Date().toISOString(),
  source_scorecards: sourceScorecards,
  policy: {
    principle:
      "Historical outcomes v0.2 convert reviewed attribution scorecards into reusable sandbox learning memory. They do not mutate production cases.",
    production_mutation_allowed: false,
  },
  summary: {
    outcome_count: outcomes.length,
    by_driver: countBy(outcomes, (x) => x.primary_driver ?? "UNKNOWN"),
    by_confidence: countBy(outcomes, (x) => x.confidence ?? "unknown"),
    by_review_status: countBy(outcomes, (x) => x.review_status ?? "unknown"),
  },
  outcomes,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  historical_outcomes_version: output.historical_outcomes_version,
  scorecards_found: sourceScorecards.length,
  outcome_count: output.summary.outcome_count,
  by_driver: output.summary.by_driver,
  by_confidence: output.summary.by_confidence,
  output: outputPath,
});
