import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REVIEW_INPUT =
  "data/intelligence/mechanism-validation-review-engine-v0.1.json";

const OUTPUT =
  "data/intelligence/counter-evidence-engine-v0.2.json";

function main() {
  const review = JSON.parse(
    fs.readFileSync(path.join(ROOT, REVIEW_INPUT), "utf8")
  );

  const counterReviews = (review.reviews ?? []).map((r: any) => {
    const counterEvidenceCandidates =
      r.mechanism_id === "MKT_010"
        ? [
            {
              counter_evidence_id: "CE-MKT_010-001",
              description:
                "Look for trade downturn cases where external demand shock was not the primary driver.",
              status: "not_yet_observed",
              review_need: "future_replay_required",
            },
            {
              counter_evidence_id: "CE-MKT_010-002",
              description:
                "Look for cases where NODX weakened despite stable or improving global trade conditions.",
              status: "not_yet_observed",
              review_need: "macro_cross_check_required",
            },
            {
              counter_evidence_id: "CE-MKT_010-003",
              description:
                "Look for domestic-policy or sector-specific explanations that outperform external demand shock.",
              status: "not_yet_observed",
              review_need: "alternative_mechanism_review_required",
            },
          ]
        : [];

    return {
      mechanism_id: r.mechanism_id,
      counter_evidence_review_status:
        counterEvidenceCandidates.length === 0
          ? "no_counter_evidence_framework_defined"
          : "counter_evidence_framework_created",
      counter_evidence_candidates: counterEvidenceCandidates,
      blocking_counter_evidence_found: false,
      governance_note:
        "Absence of observed counter-evidence is not proof of validity. It only means no blocking counter-evidence has been registered yet.",
    };
  });

  const output = {
    engine_version: "counter-evidence-engine-v0.2",
    generated_at: new Date().toISOString(),
    source_review_engine: REVIEW_INPUT,
    mechanisms_reviewed: counterReviews.length,
    blocking_counter_evidence_found: counterReviews.filter(
      (c: any) => c.blocking_counter_evidence_found
    ).length,
    counter_reviews: counterReviews,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    engine_version: output.engine_version,
    mechanisms_reviewed: output.mechanisms_reviewed,
    blocking_counter_evidence_found: output.blocking_counter_evidence_found,
    output: OUTPUT,
  });

  for (const c of counterReviews) {
    console.log(
      `${c.mechanism_id} | ${c.counter_evidence_review_status} | blocking=${c.blocking_counter_evidence_found}`
    );
  }
}

main();
