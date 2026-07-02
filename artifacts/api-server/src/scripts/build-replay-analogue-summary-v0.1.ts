import fs from "fs";
import path from "path";

const apiRoot = process.cwd();
const similarityDir = path.join(apiRoot, "data/replay/similarity");

const latestFile = fs
  .readdirSync(similarityDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .at(-1);

if (!latestFile) {
  console.error("No similarity result files found.");
  process.exit(1);
}

const similarityPath = path.join(similarityDir, latestFile);
const similarity = JSON.parse(fs.readFileSync(similarityPath, "utf8"));

const records = similarity.results ?? [];

const output = {
  version: "replay-analogue-summary-v0.1",
  generated_at: new Date().toISOString(),
  source_similarity_file: similarityPath,
  replay_record_count: records.length,
  historical_case_count: similarity.historical_case_count,
  taxonomy_aware: Boolean(similarity.mechanism_taxonomy),
  top_analogues: records.map((record: any) => {
    const top = record.top_matches?.[0];

    return {
      replay_record_id: record.replay_record_id,
      metric_name: record.metric_name,
      period: record.period,
      top_case_id: top?.case_id ?? null,
      top_title: top?.title ?? null,
      similarity_score: top?.similarity_score ?? null,
      mechanism_similarity: top?.mechanism_similarity ?? null,
      matched_mechanisms: top?.matched_mechanisms ?? []
    };
  })
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-analogue-summary-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(output);
