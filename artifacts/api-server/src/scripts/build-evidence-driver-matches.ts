import fs from "node:fs";

const taxonomyPath =
  "data/intelligence-driver-library/driver-evidence-taxonomy-v0.1.json";

const outputPath =
  "data/intelligence-driver-library/evidence-driver-match-test-v0.1.json";

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

const testEvidence = [
  "Global chip shortage increased demand for foundry capacity.",
  "COVID lockdowns and travel restrictions caused a sharp demand fall.",
  "Refinery maintenance reduced petroleum production during the period.",
  "Government tax incentives supported new plant investment.",
  "Inventory restocking lifted electronics output after earlier drawdown.",
  "Data center demand and consumer electronics demand supported semiconductor output.",
  "Export decline reflected weak external demand and trade slowdown.",
  "Production ramp-up at a new facility increased capacity.",
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

  return {
    evidence_text: text,
    matches,
    top_match: matches[0] ?? null,
  };
}

const results = testEvidence.map(matchEvidence);

const output = {
  evidence_driver_match_test_version: "evidence-driver-match-test-v0.1",
  generated_at: new Date().toISOString(),
  source_taxonomy: taxonomyPath,
  test_evidence_count: testEvidence.length,
  results,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  evidence_driver_match_test_version:
    output.evidence_driver_match_test_version,
  test_evidence_count: output.test_evidence_count,
  output: outputPath,
});

for (const result of results) {
  console.log("\nEvidence:", result.evidence_text);
  console.log(
    "Top:",
    result.top_match
      ? `${result.top_match.driver_id} ${result.top_match.driver_name} | ${result.top_match.attribution_bucket} | score ${result.top_match.match_score}`
      : "NO MATCH"
  );
  console.log(
    "Phrases:",
    result.top_match?.matched_phrases?.join(", ") ?? "-"
  );
}
