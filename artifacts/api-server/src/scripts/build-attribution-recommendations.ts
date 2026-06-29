import fs from "node:fs";

const sourcePath =
  "data/intelligence-driver-library/attribution-scorecard-test-v0.1.json";

const outputPath =
  "data/intelligence-driver-library/attribution-recommendations-v0.1.json";

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const recommendations = source.scorecards.map((scorecard: any) => {
  const bucketScores: Record<string, number> = {};

  for (const driver of scorecard.ranked_drivers) {
    bucketScores[driver.attribution_bucket] =
      (bucketScores[driver.attribution_bucket] ?? 0) +
      driver.total_score;
  }

  const rankedBuckets = Object.entries(bucketScores)
    .map(([bucket, score]) => ({
      attribution_bucket: bucket,
      total_score: score,
    }))
    .sort((a, b) => b.total_score - a.total_score);

  const topBucket = rankedBuckets[0] ?? null;

  return {
    recommendation_version: "attribution-recommendation-v0.1",

    case_id: scorecard.case_id,

    recommended_driver:
      scorecard.recommended_outcome?.primary_driver ?? null,

    recommended_driver_name:
      scorecard.recommended_outcome?.primary_driver_name ?? null,

    recommended_bucket:
      topBucket?.attribution_bucket ?? null,

    confidence:
      scorecard.recommended_outcome?.confidence ?? "unknown",

    driver_score:
      scorecard.recommended_outcome?.total_score ?? 0,

    supporting_driver_count:
      scorecard.ranked_drivers.length,

    supporting_evidence_count:
      scorecard.evidence_items.length,

    bucket_scores: rankedBuckets,

    supporting_drivers: scorecard.ranked_drivers.map(
      (driver: any) => ({
        driver_id: driver.driver_id,
        driver_name: driver.driver_name,
        attribution_bucket: driver.attribution_bucket,
        total_score: driver.total_score,
        evidence_count: driver.evidence_count,
      })
    ),

    governance: {
      recommendation_only: true,
      auto_close_case: false,
      requires_human_review: true,
    },
  };
});

const output = {
  attribution_recommendations_version:
    "attribution-recommendations-v0.1",

  generated_at: new Date().toISOString(),

  source_scorecards: sourcePath,

  recommendation_count: recommendations.length,

  recommendations,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  attribution_recommendations_version:
    output.attribution_recommendations_version,

  recommendation_count:
    output.recommendation_count,

  output: outputPath,
});

for (const rec of recommendations) {
  console.log("\nCase:", rec.case_id);

  console.log(
    "Driver:",
    rec.recommended_driver,
    rec.recommended_driver_name
  );

  console.log(
    "Bucket:",
    rec.recommended_bucket
  );

  console.log(
    "Confidence:",
    rec.confidence
  );

  console.log(
    "Evidence:",
    rec.supporting_evidence_count
  );
}
