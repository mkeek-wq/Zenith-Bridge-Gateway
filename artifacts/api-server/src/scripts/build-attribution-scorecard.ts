import fs from "node:fs";

const taxonomyPath =
  "data/intelligence-driver-library/driver-evidence-taxonomy-v0.1.json";

const outputPath =
  "data/intelligence-driver-library/attribution-scorecard-test-v0.1.json";

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

const testCases = [
  {
    case_id: "TEST-SEMICONDUCTOR-DEMAND-2020",
    description: "Semiconductor output surge supported by chip shortage and demand growth.",
    evidence_items: [
      "Global chip shortage increased demand for foundry capacity.",
      "Data center demand and consumer electronics demand supported semiconductor output.",
      "Work-from-home demand lifted electronics orders.",
    ],
  },
  {
    case_id: "TEST-PETROLEUM-COVID-2020",
    description: "Petroleum output decline during COVID demand shock.",
    evidence_items: [
      "COVID lockdowns and travel restrictions caused a sharp demand fall.",
      "Jet fuel demand collapsed as international travel stopped.",
      "Refinery maintenance reduced petroleum production during the period.",
    ],
  },
  {
    case_id: "TEST-POLICY-CAPACITY",
    description: "Policy support and plant investment lifted output.",
    evidence_items: [
      "Government tax incentives supported new plant investment.",
      "Production ramp-up at a new facility increased capacity.",
      "Capacity expansion increased manufacturing output.",
    ],
  },
];

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

function buildScorecard(testCase: any) {
  const evidenceMatches = testCase.evidence_items.map((text: string) => ({
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
          testCase.evidence_items.length
        ),
        total_score: top.total_score,
        second_score: second?.total_score ?? 0,
        score_gap: top.total_score - (second?.total_score ?? 0),
      }
    : null;

  return {
    case_id: testCase.case_id,
    description: testCase.description,
    evidence_items: testCase.evidence_items,
    evidence_matches: evidenceMatches,
    ranked_drivers: rankedDrivers,
    recommended_outcome: recommendedOutcome,
  };
}

const scorecards = testCases.map(buildScorecard);

const output = {
  attribution_scorecard_test_version: "attribution-scorecard-test-v0.1",
  generated_at: new Date().toISOString(),
  source_taxonomy: taxonomyPath,
  policy: {
    principle:
      "Attribution scorecards aggregate matched evidence into ranked driver recommendations. They support review but do not automatically close cases.",
    production_mutation_allowed: false,
  },
  test_case_count: testCases.length,
  scorecards,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  attribution_scorecard_test_version:
    output.attribution_scorecard_test_version,
  test_case_count: output.test_case_count,
  output: outputPath,
});

for (const scorecard of scorecards) {
  console.log("\nCase:", scorecard.case_id);
  console.log("Recommended:", scorecard.recommended_outcome);
  console.log(
    "Ranked:",
    scorecard.ranked_drivers
      .slice(0, 5)
      .map(
        (d: any) =>
          `${d.driver_id}:${d.driver_name}=${d.total_score}`
      )
      .join(" | ")
  );
}
