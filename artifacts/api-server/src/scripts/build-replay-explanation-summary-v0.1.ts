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
  console.error("No similarity files found.");
  process.exit(1);
}

const similarityPath = path.join(similarityDir, latestFile);
const similarity = JSON.parse(fs.readFileSync(similarityPath, "utf8"));

function confidenceBand(score: number | null): string {
  if (score === null) return "unknown";
  if (score >= 0.75) return "strong";
  if (score >= 0.5) return "moderate";
  if (score >= 0.25) return "weak";
  return "very_weak";
}

function buildExplanation(match: any): string[] {
  const notes: string[] = [];

  if ((match.mechanism_similarity ?? 0) >= 1) {
    notes.push("Exact mechanism match detected.");
  } else if ((match.mechanism_similarity ?? 0) >= 0.7) {
    notes.push("Related mechanism-family match detected.");
  }

  if ((match.similarity_score ?? 0) >= 0.75) {
    notes.push("High overall similarity score.");
  } else if ((match.similarity_score ?? 0) >= 0.5) {
    notes.push("Moderate overall similarity score.");
  } else if ((match.similarity_score ?? 0) >= 0.25) {
    notes.push("Weak but visible analogue signal.");
  }

  if ((match.matched_mechanisms ?? []).length > 0) {
    notes.push(`Matched mechanisms: ${(match.matched_mechanisms ?? []).join(", ")}.`);
  }

  return notes;
}

const explained = (similarity.results ?? []).map((record: any) => {
  const top = record.top_matches?.[0] ?? null;
  const score = top?.similarity_score ?? null;

  return {
    replay_record_id: record.replay_record_id,
    source_record_id: record.source_record_id,
    metric_name: record.metric_name,
    period: record.period,
    top_analogue: top
      ? {
          case_id: top.case_id,
          title: top.title,
          similarity_score: top.similarity_score,
          mechanism_similarity: top.mechanism_similarity,
          confidence_band: confidenceBand(score),
          explanation: buildExplanation(top)
        }
      : null
  };
});

const output = {
  version: "replay-explanation-summary-v0.1",
  generated_at: new Date().toISOString(),
  source_similarity_file: similarityPath,
  replay_record_count: explained.length,
  taxonomy_aware: Boolean(similarity.mechanism_taxonomy),
  explanations: explained
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-explanation-summary-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
