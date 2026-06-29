import fs from "fs";

const CONFIDENCE_PATH = "data/intelligence/confidence-framework-v0.1.json";
const HYPOTHESIS_PATH = "data/intelligence/hypothesis-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/approved-principles-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const confidenceFramework = readJson(CONFIDENCE_PATH);
const hypothesisRegistry = readJson(HYPOTHESIS_PATH);

const assessments: AnyRecord[] = confidenceFramework.assessments ?? [];
const hypotheses: AnyRecord[] = hypothesisRegistry.hypotheses ?? [];

const hypothesisById = new Map<string, AnyRecord>();
for (const h of hypotheses) {
  hypothesisById.set(h.hypothesis_id, h);
}

const reviewQueue = assessments.map((a, index) => {
  const h = hypothesisById.get(a.hypothesis_id);

  return {
    principle_review_queue_id: `APRQ_${String(index + 1).padStart(3, "0")}`,

    hypothesis_id: a.hypothesis_id,
    driver_id: a.driver_id,
    driver_name: a.driver_name,

    proposed_principle_statement: h?.hypothesis_statement ?? null,
    proposed_mechanism_type: h?.mechanism_type ?? null,
    expected_direction: h?.expected_direction ?? null,

    confidence_score: a.confidence_score,
    confidence_band: a.confidence_band,
    confidence_label: a.confidence_label,

    approval_readiness: a.approval_readiness,

    approval_status: "not_approved",
    approved_principle: false,
    approved_principle_id: null,

    required_before_approval: [
      "Human review of hypothesis statement.",
      "Human review of support evidence.",
      "Counter-evidence search completed.",
      "Falsification questions answered.",
      "Scope and limitations defined.",
      "Confidence score accepted or adjusted by reviewer.",
    ],

    governance: {
      queue_only: true,
      approved_principle: false,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "This object places a tested hypothesis into an approval queue. It does not approve principles automatically.",
    },
  };
});

const approvedPrinciples: AnyRecord[] = [];

const summary = {
  review_queue_count: reviewQueue.length,
  approved_principles_count: approvedPrinciples.length,
  not_approved_count: reviewQueue.filter((q) => q.approval_status === "not_approved").length,
  eligible_for_human_principle_review: reviewQueue.filter(
    (q) => q.approval_readiness === "eligible_for_human_principle_review"
  ).length,
};

const output = {
  approved_principles_registry_version: "approved-principles-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_confidence_framework: CONFIDENCE_PATH,
  source_hypothesis_registry: HYPOTHESIS_PATH,

  policy: {
    principle:
      "Approved principles registry v0.1 creates a governance container for approved principles and a review queue for eligible hypotheses. It does not auto-approve principles.",
    production_mutation_allowed: false,
    human_approval_required: true,
    no_automatic_principle_approval: true,
  },

  summary,
  review_queue: reviewQueue,
  approved_principles: approvedPrinciples,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.approved_principles_registry_version,
  review_queue_count: summary.review_queue_count,
  approved_principles_count: summary.approved_principles_count,
  eligible_for_human_principle_review: summary.eligible_for_human_principle_review,
  output: OUTPUT_PATH,
});

for (const q of reviewQueue) {
  console.log(
    `${q.principle_review_queue_id} | ${q.driver_id} | confidence=${q.confidence_score} | ${q.confidence_band} | ${q.approval_status}`
  );
}
