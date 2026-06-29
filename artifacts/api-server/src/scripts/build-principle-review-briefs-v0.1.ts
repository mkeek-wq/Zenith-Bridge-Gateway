import fs from "fs";

const REVIEW_PATH = "data/intelligence/principle-review-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/principle-review-briefs-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function summarizeCases(cases: AnyRecord[]): AnyRecord {
  const periods = [...new Set(cases.map((c) => c.period).filter(Boolean))].sort();
  const series = [...new Set(cases.map((c) => c.series_name).filter(Boolean))].sort();
  const confidence = cases.reduce((acc: AnyRecord, c) => {
    const key = c.confidence ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    case_count: cases.length,
    periods,
    series,
    confidence_distribution: confidence,
  };
}

function buildReviewFocus(driverId: string): string[] {
  const common = [
    "Identify the recurring mechanism across the supporting cases.",
    "Separate causal mechanism from descriptive label.",
    "Define the boundary conditions under which the principle should apply.",
    "Identify counterexamples or conditions where the mechanism may fail.",
  ];

  const specific: Record<string, string[]> = {
    MKT_006: [
      "Compare fiscal, tax, labour, and productivity policy channels.",
      "Determine whether the common mechanism is cost pressure, incentive response, compliance burden, or capacity support.",
    ],
    MKT_010: [
      "Compare recession, external demand, and sector-specific downturn cases.",
      "Determine whether the common mechanism is demand destruction, export sensitivity, confidence shock, or inventory adjustment.",
    ],
    MKT_002: [
      "Compare inventory cycle cases across electronics, precision engineering, and manufacturing periods.",
      "Determine whether inventory adjustment acts as a leading mechanism, lagging mechanism, or amplification mechanism.",
    ],
  };

  return [...common, ...(specific[driverId] ?? [])];
}

function buildBriefText(review: AnyRecord, summary: AnyRecord): string {
  return [
    `${review.review_id} / ${review.driver_id}`,
    review.driver_name,
    "",
    `Status: ${review.review_status}`,
    `Coverage score: ${review.coverage_score}`,
    `Diversity score: ${review.diversity_score}`,
    `Readiness score: ${review.principle_readiness_score}`,
    "",
    `Supporting cases: ${summary.case_count}`,
    `Periods: ${summary.periods.join(", ")}`,
    `Series: ${summary.series.join(", ")}`,
    "",
    "Review objective:",
    "Determine whether the supporting cases reveal a recurring, bounded, falsifiable principle.",
    "",
    "Important:",
    "This brief does not approve a principle. It only prepares human review.",
  ].join("\n");
}

const reviewRegistry = readJson(REVIEW_PATH);
const reviews: AnyRecord[] = reviewRegistry.reviews ?? [];

const briefs = reviews.map((review) => {
  const cases = review.supporting_cases ?? [];
  const caseSummary = summarizeCases(cases);

  return {
    brief_id: `BRIEF_${review.review_id.replace("PR_", "")}`,
    brief_version: "principle-review-brief-v0.1",

    review_id: review.review_id,
    candidate_id: review.candidate_id,
    driver_id: review.driver_id,
    driver_name: review.driver_name,

    review_status: review.review_status,
    approved_principle: false,

    coverage_score: review.coverage_score,
    diversity_score: review.diversity_score,
    principle_readiness_score: review.principle_readiness_score,

    case_summary: caseSummary,
    supporting_cases: cases,

    review_focus: buildReviewFocus(review.driver_id),
    review_questions: review.review_questions ?? [],

    analyst_brief: buildBriefText(review, caseSummary),

    governance: {
      brief_only: true,
      human_review_required: true,
      approved_principle: false,
      production_mutation_allowed: false,
      note:
        "This brief prepares human review. It does not propose, approve, or mutate principles.",
    },
  };
});

const summary = {
  briefs_created: briefs.length,
  source_reviews: reviews.length,
  pending_human_review: briefs.filter(
    (brief) => brief.review_status === "pending_human_review"
  ).length,
  driver_ids: briefs.map((brief) => brief.driver_id),
};

const output = {
  principle_review_briefs_version: "principle-review-briefs-v0.1",
  generated_at: new Date().toISOString(),
  source_principle_review_registry: REVIEW_PATH,

  policy: {
    principle:
      "Principle review briefs v0.1 turn principle review scaffolds into readable analyst review packages. They do not propose or approve principles.",
    production_mutation_allowed: false,
    human_review_required: true,
    brief_is_not_principle: true,
  },

  summary,
  briefs,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  briefs_version: output.principle_review_briefs_version,
  briefs_created: summary.briefs_created,
  pending_human_review: summary.pending_human_review,
  driver_ids: summary.driver_ids,
  output: OUTPUT_PATH,
});

for (const brief of briefs) {
  console.log(
    `${brief.brief_id} | ${brief.driver_id} | cases=${brief.case_summary.case_count} | periods=${brief.case_summary.periods.length} | approved=${brief.approved_principle}`
  );
}
