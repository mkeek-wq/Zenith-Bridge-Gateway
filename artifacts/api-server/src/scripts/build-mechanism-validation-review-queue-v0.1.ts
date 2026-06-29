import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/learning-confidence-engine-v0.1.json";

const OUTPUT =
  "data/intelligence/mechanism-validation-review-queue-v0.1.json";

function main() {
  const confidence = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const queue = (confidence.confidence ?? []).map((m: any) => {
    const enoughExperience = m.experience_count >= 3;
    const enoughAlignment = m.positive_alignment_ratio >= 0.6;
    const enoughConfidence = m.learning_confidence_score >= 0.6;

    const ready =
      enoughExperience && enoughAlignment && enoughConfidence;

    return {
      mechanism_id: m.mechanism_id,
      experience_count: m.experience_count,
      positive_alignment_ratio: m.positive_alignment_ratio,
      learning_confidence_score: m.learning_confidence_score,
      learning_confidence_band: m.learning_confidence_band,
      validation_review_status: ready
        ? "ready_for_validation_review"
        : "not_ready_for_validation_review",
      missing_requirements: [
        !enoughExperience ? "minimum_3_replay_experiences" : null,
        !enoughAlignment ? "positive_alignment_ratio_0.6" : null,
        !enoughConfidence ? "learning_confidence_score_0.6" : null,
      ].filter(Boolean),
      governance_note:
        "Validation review queue does not validate mechanisms. It only determines whether a mechanism is ready for human/engine validation review.",
    };
  });

  const output = {
    queue_version: "mechanism-validation-review-queue-v0.1",
    generated_at: new Date().toISOString(),
    source_confidence_engine: INPUT,
    mechanisms_reviewed: queue.length,
    ready_for_validation_review: queue.filter(
      (q: any) => q.validation_review_status === "ready_for_validation_review"
    ).length,
    not_ready_for_validation_review: queue.filter(
      (q: any) => q.validation_review_status !== "ready_for_validation_review"
    ).length,
    queue,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    queue_version: output.queue_version,
    mechanisms_reviewed: output.mechanisms_reviewed,
    ready_for_validation_review: output.ready_for_validation_review,
    not_ready_for_validation_review: output.not_ready_for_validation_review,
    output: OUTPUT,
  });

  for (const q of queue) {
    console.log(
      `${q.mechanism_id} | ${q.validation_review_status} | missing=${q.missing_requirements.join(",")}`
    );
  }
}

main();
