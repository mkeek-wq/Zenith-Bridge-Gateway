import fs from "fs";

const CANDIDATE_PATH = "data/intelligence/principle-candidate-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/principle-review-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function reviewId(index: number): string {
  return `PR_${String(index + 1).padStart(3, "0")}`;
}

function buildReviewQuestions(candidate: AnyRecord): string[] {
  return [
    "What recurring mechanism appears across the supporting cases?",
    "Does the mechanism hold across multiple periods and sectors?",
    "Are there counterexamples or failure cases?",
    "Is the candidate driver causal, reinforcing, or merely descriptive?",
    "Can the principle be stated with clear boundaries and conditions?",
    "Would this principle have predictive value in a future case?",
    "What evidence would falsify or weaken this principle?"
  ];
}

function buildInitialReviewNotes(candidate: AnyRecord): string[] {
  return [
    `Candidate ${candidate.candidate_id} passed coverage and diversity screening.`,
    `Driver ${candidate.driver_id} is ready for human principle review.`,
    "No principle has been proposed or approved by this registry.",
    "This review object is a governance scaffold only."
  ];
}

const candidateRegistry = readJson(CANDIDATE_PATH);
const candidates: AnyRecord[] = candidateRegistry.candidates ?? [];

const reviews = candidates.map((candidate, index) => ({
  review_id: reviewId(index),
  review_version: "principle-review-v0.1",

  candidate_id: candidate.candidate_id,
  driver_id: candidate.driver_id,
  driver_name: candidate.driver_name,

  review_status: "pending_human_review",

  proposed_principle: null,
  principle_scope: null,
  principle_conditions: [],
  principle_limitations: [],
  counter_evidence: [],
  falsification_tests: [],

  approved_principle: false,
  rejected_principle: false,

  coverage_score: candidate.coverage_score,
  diversity_score: candidate.diversity_score,
  principle_readiness_score: candidate.principle_readiness_score,

  supporting_case_count: candidate.supporting_case_count,
  supporting_period_count: candidate.supporting_period_count,
  supporting_cases: candidate.supporting_cases ?? [],

  review_questions: buildReviewQuestions(candidate),
  initial_review_notes: buildInitialReviewNotes(candidate),

  governance: {
    review_scaffold_only: true,
    human_review_required: true,
    approved_principle: false,
    production_mutation_allowed: false,
    note:
      "This registry prepares candidates for principle review. It does not extract or approve principles."
  }
}));

const summary = {
  reviews_created: reviews.length,
  source_candidates: candidates.length,
  pending_human_review: reviews.filter(
    (review) => review.review_status === "pending_human_review"
  ).length,
  approved_principles: 0,
  rejected_principles: 0,
  driver_ids_under_review: reviews.map((review) => review.driver_id)
};

const output = {
  principle_review_registry_version: "principle-review-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_principle_candidate_registry: CANDIDATE_PATH,

  policy: {
    principle:
      "Principle review registry v0.1 creates human-review scaffolds for principle candidates. It does not propose, approve, or mutate principles.",
    production_mutation_allowed: false,
    human_review_required: true,
    principle_review_is_not_principle_extraction: true
  },

  summary,
  reviews
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.principle_review_registry_version,
  reviews_created: summary.reviews_created,
  pending_human_review: summary.pending_human_review,
  driver_ids_under_review: summary.driver_ids_under_review,
  output: OUTPUT_PATH
});

for (const review of reviews) {
  console.log(
    `${review.review_id} | ${review.driver_id} | ${review.review_status} | approved=${review.approved_principle}`
  );
}
