import fs from "node:fs";
import path from "node:path";

const taxonomyPath =
  "data/intelligence-driver-library/driver-evidence-taxonomy-v0.1.json";

const evidenceDir =
  "data/historical-replay/m355381/evidence-pilots";

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

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

function confidenceFromScores(topScore: number, secondScore: number, evidenceCount: number) {
  const gap = topScore - secondScore;

  if (evidenceCount >= 3 && topScore >= 20 && gap >= 8) return "high";
  if (evidenceCount >= 2 && topScore >= 10 && gap >= 3) return "medium";
  if (topScore > 0) return "low";

  return "unknown";
}

function buildScorecard(evidencePath: string) {
  const evidencePilot = JSON.parse(fs.readFileSync(evidencePath, "utf8"));

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
    evidence_metadata: {
      evidence_origin: "synthetic",
      template_generated: true,
      attribution_discovery_ready: true,
      requires_human_review: true
    },
    evidence_items: evidencePilot.evidence_items,
    evidence_matches: evidenceMatches,
    ranked_drivers: rankedDrivers,
    bucket_scores: rankedBuckets,
    recommended_outcome: recommendedOutcome,
  };

  const outputPath = path.join(
    evidenceDir,
    `${evidencePilot.case_id}-scorecard-v0.1.json`
  );

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  return {
    case_id: evidencePilot.case_id,
    output: outputPath,
    recommended_outcome: recommendedOutcome,
    ranked_drivers: rankedDrivers.slice(0, 5).map((d: any) => ({
      driver_id: d.driver_id,
      driver_name: d.driver_name,
      total_score: d.total_score,
    })),
  };
}

const evidenceFiles = fs
  .readdirSync(evidenceDir)
  .filter((file) => file.endsWith("-evidence-v0.1.json"))
  .sort();

const results = evidenceFiles.map((file) =>
  buildScorecard(path.join(evidenceDir, file))
);

console.log({
  batch: "historical-evidence-scorecards-batch-v0.1",
  evidence_files: evidenceFiles.length,
  scorecards_written: results.length,
});

for (const result of results) {
  console.log("\nCase:", result.case_id);
  console.log("Recommended:", result.recommended_outcome);
  console.log(
    "Ranked:",
    result.ranked_drivers
      .map((d: any) => `${d.driver_id}:${d.driver_name}=${d.total_score}`)
      .join(" | ")
  );
}
