import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REVIEW_INPUT =
  "data/intelligence/mechanism-validation-review-engine-v0.1.json";

const COUNTER_INPUT =
  "data/intelligence/counter-evidence-engine-v0.2.json";

const OUTPUT =
  "data/intelligence/mechanism-lifecycle-promotion-gate-v0.2.json";

function main() {
  const review = JSON.parse(fs.readFileSync(path.join(ROOT, REVIEW_INPUT), "utf8"));
  const counter = JSON.parse(fs.readFileSync(path.join(ROOT, COUNTER_INPUT), "utf8"));

  const lifecycleDecisions = (review.reviews ?? []).map((r: any) => {
    const counterReview = (counter.counter_reviews ?? []).find(
      (c: any) => c.mechanism_id === r.mechanism_id
    );

    const noBlockingCounterEvidence =
      counterReview && counterReview.blocking_counter_evidence_found === false;

    const enoughReviewBasis =
      r.experience_count >= 3 &&
      r.positive_alignment_ratio >= 0.6 &&
      r.learning_confidence_score >= 0.6;

    const decision =
      enoughReviewBasis && noBlockingCounterEvidence
        ? "PROMOTE_TO_UNDER_VALIDATION_REVIEW"
        : "REMAIN_CANDIDATE_NOT_VALIDATED";

    return {
      mechanism_id: r.mechanism_id,
      prior_lifecycle_status: "candidate_not_validated",
      lifecycle_decision: decision,
      new_lifecycle_status:
        decision === "PROMOTE_TO_UNDER_VALIDATION_REVIEW"
          ? "under_validation_review"
          : "candidate_not_validated",
      evidence_basis: {
        experience_count: r.experience_count,
        positive_alignment_ratio: r.positive_alignment_ratio,
        learning_confidence_score: r.learning_confidence_score,
        blocking_counter_evidence_found:
          counterReview?.blocking_counter_evidence_found ?? null,
      },
      next_required_action:
        decision === "PROMOTE_TO_UNDER_VALIDATION_REVIEW"
          ? "perform_formal_validation_review"
          : "collect_more_replay_experience",
      governance_note:
        "Lifecycle promotion to under_validation_review is not validation. Formal validation remains a separate gate.",
    };
  });

  const output = {
    gate_version: "mechanism-lifecycle-promotion-gate-v0.2",
    generated_at: new Date().toISOString(),
    sources: {
      review_engine: REVIEW_INPUT,
      counter_evidence_engine: COUNTER_INPUT,
    },
    mechanisms_reviewed: lifecycleDecisions.length,
    promoted_to_under_validation_review: lifecycleDecisions.filter(
      (d: any) => d.new_lifecycle_status === "under_validation_review"
    ).length,
    remaining_candidate_not_validated: lifecycleDecisions.filter(
      (d: any) => d.new_lifecycle_status === "candidate_not_validated"
    ).length,
    lifecycle_decisions: lifecycleDecisions,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    gate_version: output.gate_version,
    mechanisms_reviewed: output.mechanisms_reviewed,
    promoted_to_under_validation_review:
      output.promoted_to_under_validation_review,
    remaining_candidate_not_validated:
      output.remaining_candidate_not_validated,
    output: OUTPUT,
  });

  for (const d of lifecycleDecisions) {
    console.log(`${d.mechanism_id} | ${d.new_lifecycle_status}`);
  }
}

main();
