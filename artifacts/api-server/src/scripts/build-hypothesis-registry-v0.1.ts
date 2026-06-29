import fs from "fs";

const BRIEFS_PATH = "data/intelligence/principle-review-briefs-v0.1.json";
const OUTPUT_PATH = "data/intelligence/hypothesis-registry-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function hypothesisId(index: number): string {
  return `HYP_${String(index + 1).padStart(3, "0")}`;
}

function proposeInitialHypothesis(driverId: string): AnyRecord {
  const hypotheses: Record<string, AnyRecord> = {
    MKT_002: {
      hypothesis_statement:
        "Inventory adjustments amplify manufacturing downturns and recoveries by causing production changes that exceed the underlying change in demand.",
      mechanism_type: "amplification_mechanism",
      expected_direction:
        "Inventory drawdowns deepen production cuts; restocking supports production recovery.",
      confidence_level: "untested",
    },
    MKT_006: {
      hypothesis_statement:
        "Policy and regulatory changes affect industrial outcomes through cost, incentive, compliance, or capacity-support channels.",
      mechanism_type: "policy_transmission_mechanism",
      expected_direction:
        "Policy measures change firm behaviour by altering costs, incentives, constraints, or available support.",
      confidence_level: "untested",
    },
    MKT_010: {
      hypothesis_statement:
        "External demand shocks propagate through export-sensitive sectors before appearing in broader manufacturing outcomes.",
      mechanism_type: "external_demand_transmission_mechanism",
      expected_direction:
        "Demand-sensitive sectors weaken first during external downturns and may recover earlier when demand conditions improve.",
      confidence_level: "untested",
    },
  };

  return (
    hypotheses[driverId] ?? {
      hypothesis_statement: null,
      mechanism_type: "unknown",
      expected_direction: null,
      confidence_level: "untested",
    }
  );
}

function buildTestingPlan(driverId: string): string[] {
  const common = [
    "Confirm whether the hypothesis is supported by the listed historical cases.",
    "Search for counterexamples where the expected mechanism did not hold.",
    "Check whether the mechanism appears across multiple periods, not only one crisis.",
    "Check whether the mechanism appears across more than one sector or replay family.",
    "Separate correlation from causal interpretation.",
  ];

  const specific: Record<string, string[]> = {
    MKT_002: [
      "Test whether inventory drawdowns were followed by production recovery in multiple cases.",
      "Test whether inventory build-ups coincided with production cuts or delayed recovery.",
      "Check whether restocking amplified recoveries rather than merely coinciding with them.",
    ],
    MKT_006: [
      "Classify each policy case by channel: cost, incentive, compliance, constraint, or support.",
      "Check whether policy impact differs between taxes, grants, labour constraints, and global tax rules.",
      "Look for cases where policy change had limited observable industrial impact.",
    ],
    MKT_010: [
      "Check whether export-sensitive sectors weakened before broader manufacturing downturns.",
      "Compare downturn timing across total manufacturing, chemicals, petrochemicals, and electronics.",
      "Look for cases where domestic or supply-side factors explain the outcome better than external demand.",
    ],
  };

  return [...common, ...(specific[driverId] ?? [])];
}

function buildTestingLevels(): AnyRecord[] {
  return [
    {
      level: 1,
      name: "qualitative_case_review",
      description:
        "Review supporting cases and counterexamples using existing replay evidence.",
      compute_cost: "very_low",
      required_data: "existing registries",
      status: "available_now",
    },
    {
      level: 2,
      name: "directional_consistency_check",
      description:
        "Check whether case direction aligns with the hypothesized mechanism.",
      compute_cost: "low",
      required_data: "structured case outcomes and periods",
      status: "future_extension",
    },
    {
      level: 3,
      name: "simple_time_series_or_lag_check",
      description:
        "Check whether indicators move before, during, or after the expected mechanism.",
      compute_cost: "low_to_moderate",
      required_data: "official time series data",
      status: "future_extension",
    },
    {
      level: 4,
      name: "statistical_model_test",
      description:
        "Use regression, explanatory factors, R-squared, residual checks, or robustness tests where data depth justifies it.",
      compute_cost: "moderate",
      required_data: "clean multi-period structured datasets",
      status: "future_extension",
    },
  ];
}

const briefsRegistry = readJson(BRIEFS_PATH);
const briefs: AnyRecord[] = briefsRegistry.briefs ?? [];

const hypotheses = briefs.map((brief, index) => {
  const initial = proposeInitialHypothesis(brief.driver_id);

  return {
    hypothesis_id: hypothesisId(index),
    hypothesis_version: "hypothesis-v0.1",

    source_brief_id: brief.brief_id,
    source_review_id: brief.review_id,
    source_candidate_id: brief.candidate_id,

    driver_id: brief.driver_id,
    driver_name: brief.driver_name,

    hypothesis_statement: initial.hypothesis_statement,
    mechanism_type: initial.mechanism_type,
    expected_direction: initial.expected_direction,

    hypothesis_status: "untested",
    approved_principle: false,

    confidence_level: initial.confidence_level,
    confidence_score: null,

    supporting_case_count: brief.case_summary?.case_count ?? 0,
    supporting_periods: brief.case_summary?.periods ?? [],
    supporting_series: brief.case_summary?.series ?? [],
    confidence_distribution: brief.case_summary?.confidence_distribution ?? {},

    testing_plan: buildTestingPlan(brief.driver_id),
    testing_levels: buildTestingLevels(),

    current_testing_level: 1,
    current_testing_level_name: "qualitative_case_review",

    support_evidence: [],
    counter_evidence: [],
    unresolved_questions: [
      "Does the hypothesis survive counterexample search?",
      "Is the mechanism causal, reinforcing, or merely descriptive?",
      "What evidence would materially weaken the hypothesis?",
    ],

    governance: {
      hypothesis_only: true,
      approved_principle: false,
      human_review_required: true,
      production_mutation_allowed: false,
      note:
        "This registry stores untested hypotheses. Hypotheses are not principles and must be tested before approval.",
    },
  };
});

const summary = {
  hypotheses_created: hypotheses.length,
  source_briefs: briefs.length,
  untested: hypotheses.filter((h) => h.hypothesis_status === "untested").length,
  approved_principles: 0,
  testing_level_available_now: "level_1_qualitative_case_review",
  future_testing_levels: [
    "level_2_directional_consistency_check",
    "level_3_simple_time_series_or_lag_check",
    "level_4_statistical_model_test",
  ],
  driver_ids: hypotheses.map((h) => h.driver_id),
};

const output = {
  hypothesis_registry_version: "hypothesis-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_principle_review_briefs: BRIEFS_PATH,

  policy: {
    principle:
      "Hypothesis registry v0.1 records proposed mechanisms generated from reviewed principle candidates. It does not approve principles or mutate production memory.",
    production_mutation_allowed: false,
    human_review_required: true,
    hypothesis_is_not_principle: true,
    testing_required_before_principle_approval: true,
  },

  summary,
  hypotheses,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.hypothesis_registry_version,
  hypotheses_created: summary.hypotheses_created,
  untested: summary.untested,
  driver_ids: summary.driver_ids,
  output: OUTPUT_PATH,
});

for (const h of hypotheses) {
  console.log(
    `${h.hypothesis_id} | ${h.driver_id} | ${h.mechanism_type} | ${h.hypothesis_status}`
  );
}
