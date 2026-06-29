import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/mechanism-validation-review-queue-v0.2.json";

const ACCUMULATOR =
  "data/intelligence/replay-experience-accumulator-v0.2.json";

const OUTPUT =
  "data/intelligence/mechanism-validation-review-engine-v0.1.json";

function main() {
  const queue = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));
  const accumulator = JSON.parse(fs.readFileSync(path.join(ROOT, ACCUMULATOR), "utf8"));

  const ready = (queue.queue ?? []).filter(
    (q: any) => q.validation_review_status === "ready_for_validation_review"
  );

  const reviews = ready.map((q: any) => {
    const experience = (accumulator.mechanisms ?? []).find(
      (m: any) => m.mechanism_id === q.mechanism_id
    );

    return {
      mechanism_id: q.mechanism_id,
      review_status: "under_validation_review",
      experience_count: q.experience_count,
      positive_alignment_ratio: q.positive_alignment_ratio,
      learning_confidence_score: q.learning_confidence_score,
      learning_confidence_band: q.learning_confidence_band,
      supporting_cases: experience?.cases ?? [],
      review_rationale:
        "Mechanism reached minimum replay experience threshold with positive alignment and sufficient learning confidence.",
      required_review_checks: [
        "supporting_case_review",
        "counter_evidence_review",
        "domain_diversity_review",
        "mechanism_specificity_review",
        "human_governance_review",
      ],
      governance_note:
        "Validation review does not validate the mechanism. It opens the review process.",
    };
  });

  const output = {
    engine_version: "mechanism-validation-review-engine-v0.1",
    generated_at: new Date().toISOString(),
    source_queue: INPUT,
    mechanisms_ready_for_review: reviews.length,
    reviews,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    engine_version: output.engine_version,
    mechanisms_ready_for_review: output.mechanisms_ready_for_review,
    output: OUTPUT,
  });

  for (const r of reviews) {
    console.log(`${r.mechanism_id} | ${r.review_status} | cases=${r.experience_count}`);
  }
}

main();
