import fs from "fs";
import path from "path";

const seedPath = path.join(
  process.cwd(),
  "data/article-generator/smurf-article-seed-from-opportunity-v0.1.json"
);

if (!fs.existsSync(seedPath)) {
  throw new Error(`Missing input: ${seedPath}`);
}

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const opportunity = seed.smurf_context?.original_opportunity;

if (!opportunity) {
  throw new Error("Missing original opportunity.");
}

const signal = opportunity.signal ?? {};
const driver = opportunity.source_driver ?? {};

const output = {
  snapshot_version: "smurf-intelligence-snapshot-v0.1",
  generated_at: new Date().toISOString(),

  article_id: opportunity.opportunity_id,

  intelligence_snapshot: {
    primary_driver: driver.driver_name,
    driver_id: driver.driver_id,

    confidence_score: signal.confidence_score,
    confidence_tier: signal.confidence_tier,

    historical_cases: signal.case_count,

    recurrence_score: signal.recurrence_score,
    experience_strength: signal.experience_strength,

    pattern_stability: signal.stability_assessment,

    top_evidence_patterns:
      (opportunity.evidence_patterns ?? [])
        .slice(0, 5)
        .map((p: any) => ({
          phrase: p.phrase,
          count: p.count,
        })),
  },
};

const outDir = path.join(process.cwd(), "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(
  outDir,
  "smurf-intelligence-snapshot-v0.1.json"
);

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  snapshot_version: output.snapshot_version,
  driver: output.intelligence_snapshot.primary_driver,
  confidence: output.intelligence_snapshot.confidence_score,
  historical_cases: output.intelligence_snapshot.historical_cases,
  output: outPath,
});
