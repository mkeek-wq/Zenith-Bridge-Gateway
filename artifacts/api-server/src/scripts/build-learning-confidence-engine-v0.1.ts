import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/replay-experience-accumulator-v0.1.json";

const OUTPUT =
  "data/intelligence/learning-confidence-engine-v0.1.json";

function confidenceBand(score: number): string {
  if (score >= 0.8) return "mature";
  if (score >= 0.6) return "strong";
  if (score >= 0.3) return "emerging";
  return "experimental";
}

function main() {
  const accumulator = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const confidence = (accumulator.mechanisms ?? []).map((m: any) => {
    const experienceScore = Math.min(m.experience_count / 5, 1) * 0.35;
    const alignmentScore = m.positive_alignment_ratio * 0.4;
    const strongScore = m.strong_alignment_ratio * 0.15;

    const uniqueCaseCount = new Set((m.cases ?? []).map((c: any) => c.case_id)).size;
    const diversityScore = Math.min(uniqueCaseCount / 5, 1) * 0.1;

    const learningConfidence = Number(
      (experienceScore + alignmentScore + strongScore + diversityScore).toFixed(3)
    );

    return {
      mechanism_id: m.mechanism_id,
      experience_count: m.experience_count,
      strong_alignment: m.strong_alignment,
      moderate_alignment: m.moderate_alignment,
      weak_alignment: m.weak_alignment,
      contradictory: m.contradictory,
      positive_alignment_ratio: m.positive_alignment_ratio,
      strong_alignment_ratio: m.strong_alignment_ratio,
      learning_confidence_score: learningConfidence,
      learning_confidence_band: confidenceBand(learningConfidence),
      confidence_components: {
        experience_score: Number(experienceScore.toFixed(3)),
        alignment_score: Number(alignmentScore.toFixed(3)),
        strong_score: Number(strongScore.toFixed(3)),
        diversity_score: Number(diversityScore.toFixed(3)),
      },
      governance_note:
        "Learning confidence summarizes replay-supported experience. It does not validate a mechanism.",
    };
  });

  const output = {
    engine_version: "learning-confidence-engine-v0.1",
    generated_at: new Date().toISOString(),
    source_accumulator: INPUT,
    mechanisms_assessed: confidence.length,
    experimental: confidence.filter((c: any) => c.learning_confidence_band === "experimental").length,
    emerging: confidence.filter((c: any) => c.learning_confidence_band === "emerging").length,
    strong: confidence.filter((c: any) => c.learning_confidence_band === "strong").length,
    mature: confidence.filter((c: any) => c.learning_confidence_band === "mature").length,
    confidence,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    engine_version: output.engine_version,
    mechanisms_assessed: output.mechanisms_assessed,
    experimental: output.experimental,
    emerging: output.emerging,
    strong: output.strong,
    mature: output.mature,
    output: OUTPUT,
  });

  for (const c of confidence) {
    console.log(
      `${c.mechanism_id} | confidence=${c.learning_confidence_score} | ${c.learning_confidence_band}`
    );
  }
}

main();
