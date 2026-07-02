import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const confidence =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-confidence-engine-v0.2.json")) || {};

const replaySupport =
  readJsonSafe(path.join(ROOT, "data/intelligence/replay-support-engine-v0.2.json")) || {};

const readiness =
  readJsonSafe(path.join(ROOT, "data/intelligence/validation-readiness-engine-v0.1.json")) || {};

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const confidenceItems: any[] = confidence.mechanism_confidence_items || [];
const replayItems: any[] = replaySupport.replay_support_items || [];
const readinessItems: any[] = readiness.validation_readiness_items || [];

const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

const promotionItems = confidenceItems.map((m) => {
  const replay = replayItems.find((r) => r.mechanism_id === m.mechanism_id) || {};
  const ready = readinessItems.find((r) => r.mechanism_id === m.mechanism_id) || {};
  const life = lifecycleItems.find((l) => l.driver_id === m.mechanism_id || l.mechanism_id === m.mechanism_id) || {};

  const confidenceScore = Number(m.adjusted_confidence_score ?? 0);
  const replayScore = Number(replay.replay_support_score ?? 0);
  const readinessScore = Number(ready.readiness_score ?? 0);
  const evidenceLinkSupport = Number(m.confidence_components?.evidence_link_support ?? 0);

  const lifecycleStatus = m.lifecycle_status || life.lifecycle_status || "unknown";

  const promotion_score = clamp(
    confidenceScore * 0.3 +
      replayScore * 0.25 +
      readinessScore * 0.25 +
      evidenceLinkSupport * 0.2
  );

  let promotionStatus = "do_not_promote";

  if (
    lifecycleStatus === "candidate_not_validated" &&
    promotion_score >= 0.7 &&
    confidenceScore >= 0.55 &&
    readinessScore >= 0.55
  ) {
    promotionStatus = "promote_to_human_review_queue";
  } else if (promotion_score >= 0.55) {
    promotionStatus = "watch_for_promotion";
  }

  return {
    mechanism_id: m.mechanism_id,
    mechanism_name: m.mechanism_name,
    lifecycle_status: lifecycleStatus,
    promotion_score: Number(promotion_score.toFixed(3)),
    promotion_band:
      promotion_score >= 0.75
        ? "high_promotion_candidate"
        : promotion_score >= 0.55
          ? "moderate_promotion_candidate"
          : promotion_score >= 0.35
            ? "low_promotion_candidate"
            : "not_a_promotion_candidate",
    promotion_status: promotionStatus,
    components: {
      adjusted_confidence_score: Number(confidenceScore.toFixed(3)),
      replay_support_score: Number(replayScore.toFixed(3)),
      validation_readiness_score: Number(readinessScore.toFixed(3)),
      evidence_link_support: Number(evidenceLinkSupport.toFixed(3)),
    },
    recommendation:
      promotionStatus === "promote_to_human_review_queue"
        ? "Add to human review queue. Do not mutate lifecycle automatically."
        : promotionStatus === "watch_for_promotion"
          ? "Continue monitoring; candidate may become review-worthy with additional evidence."
          : "Do not promote. Support is not yet sufficient.",
    governance: {
      promotion_is_not_validation: true,
      automatic_lifecycle_change_allowed: false,
      human_review_required: true,
      evidence_remains_primary: true,
      past_results_do_not_guarantee_future_outcomes: true,
    },
  };
});

const output = {
  registry_version: "mechanism-promotion-candidate-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    promotion_is_not_validation: true,
    promotion_only_creates_review_queue_candidates: true,
    automatic_lifecycle_change_allowed: false,
    evidence_remains_primary: true,
    human_review_required: true,
  },
  inputs: {
    confidence_items: confidenceItems.length,
    replay_support_items: replayItems.length,
    readiness_items: readinessItems.length,
    lifecycle_items: lifecycleItems.length,
  },
  summary: {
    mechanisms_processed: promotionItems.length,
    promote_to_human_review_queue: promotionItems.filter((x) => x.promotion_status === "promote_to_human_review_queue").length,
    watch_for_promotion: promotionItems.filter((x) => x.promotion_status === "watch_for_promotion").length,
    do_not_promote: promotionItems.filter((x) => x.promotion_status === "do_not_promote").length,
    average_promotion_score: Number(avg(promotionItems.map((x) => x.promotion_score)).toFixed(3)),
  },
  promotion_candidate_items: promotionItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-promotion-candidate-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-promotion-candidate-engine-v0.1.json",
});

console.table(
  promotionItems.map((x) => ({
    mechanism_id: x.mechanism_id,
    mechanism: x.mechanism_name,
    promotion: x.promotion_score,
    band: x.promotion_band,
    status: x.promotion_status,
  }))
);
