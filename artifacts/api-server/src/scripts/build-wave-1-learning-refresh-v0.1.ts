import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const SINGLE_GATE =
  "data/intelligence/experience-registry-promotion-gate-v0.1.json";

const BATCH_PROMOTION =
  "data/intelligence/wave-1-batch-experience-promotion-v0.1.json";

const OUTPUT_ACCUMULATOR =
  "data/intelligence/replay-experience-accumulator-v0.2.json";

const OUTPUT_CONFIDENCE =
  "data/intelligence/learning-confidence-engine-v0.2.json";

const OUTPUT_REVIEW =
  "data/intelligence/mechanism-validation-review-queue-v0.2.json";

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function band(score: number): string {
  if (score >= 0.8) return "mature";
  if (score >= 0.6) return "strong";
  if (score >= 0.3) return "emerging";
  return "experimental";
}

function main() {
  const singleGate = readJson(SINGLE_GATE);
  const batchPromotion = readJson(BATCH_PROMOTION);

  const experiences: any[] = [];

  for (const item of singleGate.gate_items ?? []) {
    if (item.resulting_status === "promoted_to_experience_memory") {
      experiences.push({
        case_id: item.case_id,
        mechanism_ids: item.mechanism_ids,
        alignment_score: item.alignment_score,
        alignment_band: item.alignment_band,
      });
    }
  }

  for (const item of batchPromotion.promoted ?? []) {
    if (item.promotion_status === "promoted_to_experience_memory") {
      experiences.push({
        case_id: item.case_id,
        mechanism_ids: item.mechanism_ids,
        alignment_score: item.alignment_score,
        alignment_band: item.alignment_band,
      });
    }
  }

  const mechanismMap = new Map<string, any>();

  for (const exp of experiences) {
    for (const mechanismId of exp.mechanism_ids ?? []) {
      if (!mechanismMap.has(mechanismId)) {
        mechanismMap.set(mechanismId, {
          mechanism_id: mechanismId,
          experience_count: 0,
          strong_alignment: 0,
          moderate_alignment: 0,
          weak_alignment: 0,
          contradictory: 0,
          cases: [],
        });
      }

      const m = mechanismMap.get(mechanismId);
      m.experience_count += 1;
      m.cases.push({
        case_id: exp.case_id,
        alignment_score: exp.alignment_score,
        alignment_band: exp.alignment_band,
      });

      if (exp.alignment_band === "strong_alignment") m.strong_alignment += 1;
      else if (exp.alignment_band === "moderate_alignment") m.moderate_alignment += 1;
      else if (exp.alignment_band === "weak_alignment") m.weak_alignment += 1;
      else if (exp.alignment_band === "contradictory") m.contradictory += 1;
    }
  }

  const mechanisms = Array.from(mechanismMap.values()).map((m: any) => ({
    ...m,
    strong_alignment_ratio: Number(
      (m.strong_alignment / m.experience_count).toFixed(3)
    ),
    positive_alignment_ratio: Number(
      ((m.strong_alignment + m.moderate_alignment) / m.experience_count).toFixed(3)
    ),
  }));

  const accumulator = {
    accumulator_version: "replay-experience-accumulator-v0.2",
    generated_at: new Date().toISOString(),
    sources: {
      single_gate: SINGLE_GATE,
      batch_promotion: BATCH_PROMOTION,
    },
    promoted_experience_items: experiences.length,
    mechanisms_tracked: mechanisms.length,
    mechanisms,
    governance_note:
      "Accumulator v0.2 combines single-case and batch replay experiences. It does not validate mechanisms.",
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_ACCUMULATOR),
    JSON.stringify(accumulator, null, 2)
  );

  const confidence = mechanisms.map((m: any) => {
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
      learning_confidence_band: band(learningConfidence),
      cases: m.cases,
      governance_note:
        "Learning confidence summarizes replay-supported experience. It does not validate a mechanism.",
    };
  });

  const confidenceOutput = {
    engine_version: "learning-confidence-engine-v0.2",
    generated_at: new Date().toISOString(),
    source_accumulator: OUTPUT_ACCUMULATOR,
    mechanisms_assessed: confidence.length,
    confidence,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_CONFIDENCE),
    JSON.stringify(confidenceOutput, null, 2)
  );

  const reviewQueue = confidence.map((m: any) => {
    const enoughExperience = m.experience_count >= 3;
    const enoughAlignment = m.positive_alignment_ratio >= 0.6;
    const enoughConfidence = m.learning_confidence_score >= 0.6;

    const ready = enoughExperience && enoughAlignment && enoughConfidence;

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
        "Validation review queue does not validate mechanisms. It only identifies candidates ready for review.",
    };
  });

  const reviewOutput = {
    queue_version: "mechanism-validation-review-queue-v0.2",
    generated_at: new Date().toISOString(),
    source_confidence_engine: OUTPUT_CONFIDENCE,
    mechanisms_reviewed: reviewQueue.length,
    ready_for_validation_review: reviewQueue.filter(
      (q: any) => q.validation_review_status === "ready_for_validation_review"
    ).length,
    not_ready_for_validation_review: reviewQueue.filter(
      (q: any) => q.validation_review_status !== "ready_for_validation_review"
    ).length,
    queue: reviewQueue,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_REVIEW),
    JSON.stringify(reviewOutput, null, 2)
  );

  console.log({
    refresh_version: "wave-1-learning-refresh-v0.1",
    promoted_experience_items: experiences.length,
    mechanisms_tracked: mechanisms.length,
    ready_for_validation_review: reviewOutput.ready_for_validation_review,
    accumulator: OUTPUT_ACCUMULATOR,
    confidence: OUTPUT_CONFIDENCE,
    review_queue: OUTPUT_REVIEW,
  });

  for (const q of reviewQueue) {
    console.log(
      `${q.mechanism_id} | exp=${q.experience_count} | conf=${q.learning_confidence_score} | ${q.validation_review_status}`
    );
  }
}

main();
