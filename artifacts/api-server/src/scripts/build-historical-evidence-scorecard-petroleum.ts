import fs from "node:fs";

const taxonomyPath =
  "data/intelligence-driver-library/driver-evidence-taxonomy-v0.1.json";

const evidencePath =
  "data/historical-replay/m355381/evidence-pilots/SG-PETROLEUM-2020-evidence-v0.1.json";

const outputPath =
  "data/historical-replay/m355381/evidence-pilots/SG-PETROLEUM-2020-scorecard-v0.1.json";

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
const evidencePilot = JSON.parse(fs.readFileSync(evidencePath, "utf8"));

function normalize(value: string) {
  return value.toLowerCase();
}

function matchEvidence(text: string) {
  const normalized = normalize(text);
  const matches: any[] = [];

  for (const driver of taxonomy.drivers) {
    const matchedPhrases = driver.evidence_phrases.filter((phrase: string) =>
      normalized.includes(normalize(phrase))
    );

    if (matchedPhrases.length > 0) {
      matches.push({
        driver_id: driver.driver_id,
        driver_name: driver.driver_name,
        attribution_bucket: driver.attribution_bucket,
        default_score: driver.default_score,
        matched_phrases: matchedPhrases,
        match_score: driver.default_score * matchedPhrases.length,
      });
    }
  }

  matches.sort((a, b) => b.match_score - a.match_score);
  return matches;
}

function confidenceFromScores(
  topScore: number,
  secondScore: number,
  evidenceCount: number
) {
  const gap = topScore - secondScore;

  if (evidenceCount >= 3 && topScore >= 20 && gap >= 8) return "high";
  if (evidenceCount >= 2 && topScore >= 10 && gap >= 3) return "medium";
  if (topScore > 0) return "low";

  return "unknown";
}

const evidenceMatches = evidencePilot.evidence_items.map((text: string) => ({
  evidence_text: text,
  matches: matchEvidence(text),
}));

const driverScores: Record<string, any> = {};

for (const item of evidenceMatches) {
  for (const match of item.matches) {
    if (!driverScores[match.driver_id]) {
      driverScores[match.driver_id] = {
        driver_id: match.driver_id,
        driver_name: match.driver_name,
        attribution_bucket: match.attribution_bucket,
        total_score: 0,
        evidence_count: 0,
        matched_phrases: [],
        supporting_evidence: [],
      };
    }

    driverScores[match.driver_id].total_score += match.match_score;
    driverScores[match.driver_id].evidence_count += 1;
    driverScores[match.driver_id].matched_phrases.push(...match.matched_phrases);
    driverScores[match.driver_id].supporting_evidence.push(item.evidence_text);
  }
}

const rankedDrivers = Object.values(driverScores).sort(
  (a: any, b: any) => b.total_score - a.total_score
);

const bucketScores: Record<string, number> = {};

for (const driver of rankedDrivers as any[]) {
  bucketScores[driver.attribution_bucket] =
    (bucketScores[driver.attribution_bucket] ?? 0) + driver.total_score;
}

const rankedBuckets = Object.entries(bucketScores)
  .map(([bucket, score]) => ({
    attribution_bucket: bucket,
    total_score: score,
  }))
  .sort((a, b) => b.total_score - a.total_score);

const top = rankedDrivers[0] as any | undefined;
const second = rankedDrivers[1] as any | undefined;

const recommendedOutcome = top
  ? {
      primary_driver: top.driver_id,
      primary_driver_name: top.driver_name,
      attribution_bucket: top.attribution_bucket,
      confidence: confidenceFromScores(
        top.total_score,
        second?.total_score ?? 0,
        evidencePilot.evidence_items.length
      ),
      total_score: top.total_score,
      second_score: second?.total_score ?? 0,
      score_gap: top.total_score - (second?.total_score ?? 0),
    }
  : null;

const output = {
  historical_evidence_scorecard_version: "historical-evidence-scorecard-v0.1",
  generated_at: new Date().toISOString(),
  source_taxonomy: taxonomyPath,
  source_evidence: evidencePath,
  case_id: evidencePilot.case_id,
  period: evidencePilot.period,
  series_name: evidencePilot.series_name,
  governance: {
    sandbox_only: true,
    recommendation_only: true,
    auto_close_case: false,
    requires_human_review: true,
    production_mutation_allowed: false,
  },
  evidence_items: evidencePilot.evidence_items,
  evidence_matches: evidenceMatches,
  ranked_drivers: rankedDrivers,
  bucket_scores: rankedBuckets,
  recommended_outcome: recommendedOutcome,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  historical_evidence_scorecard_version:
    output.historical_evidence_scorecard_version,
  case_id: output.case_id,
  recommended_outcome: output.recommended_outcome,
  output: outputPath,
});

console.log("\nRanked drivers:");
for (const d of (rankedDrivers as any[]).slice(0, 5)) {
  console.log(`${d.driver_id} ${d.driver_name} = ${d.total_score}`);
}

console.log("\nBucket scores:");
for (const b of rankedBuckets) {
  console.log(`${b.attribution_bucket} = ${b.total_score}`);
}
