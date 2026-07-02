import fs from "fs";

const MECHANISM_PATH = "data/intelligence/validated-mechanism-registry-v0.1.json";
const OUTPUT_PATH = "data/intelligence/similarity-confidence-adjustment-layer-v0.1.json";

type AnyRecord = Record<string, any>;

function readJson(path: string): AnyRecord {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const mechanismRegistry = readJson(MECHANISM_PATH);
const candidates: AnyRecord[] = mechanismRegistry.mechanism_candidates ?? [];

const adjustmentRules = candidates.map((candidate, index) => ({
  adjustment_rule_id: `SCA_${String(index + 1).padStart(3, "0")}`,
  adjustment_rule_version: "similarity-confidence-adjustment-rule-v0.1",

  mechanism_candidate_id: candidate.mechanism_candidate_id,
  driver_id: candidate.driver_id,
  driver_name: candidate.driver_name,
  mechanism_type: candidate.mechanism_type,

  rule_status: "inactive_until_mechanism_validated",

  evidence_assessment_role: {
    may_create_primary_evidence: false,
    may_override_primary_evidence: false,
    may_determine_case_outcome: false,
    may_adjust_confidence_after_primary_assessment: false,
  },

  future_activation_conditions: [
    "Mechanism validated after counter-evidence review.",
    "Current case evidence assessment completed independently.",
    "Historical similarity score calculated separately.",
    "Confidence adjustment cap applied.",
    "Human review threshold respected where required.",
  ],

  future_adjustment_policy: {
    maximum_positive_confidence_adjustment: 0.15,
    maximum_negative_confidence_adjustment: -0.15,
    evidence_remains_primary: true,
    historical_similarity_is_secondary: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },

  governance: {
    inactive_rule: true,
    validated_mechanism_required: true,
    production_mutation_allowed: false,
    note:
      "Similarity may only adjust confidence after primary evidence assessment. It must never drive or override the case assessment.",
  },
}));

const summary = {
  adjustment_rules_created: adjustmentRules.length,
  active_rules: adjustmentRules.filter((r) => r.rule_status !== "inactive_until_mechanism_validated").length,
  inactive_rules: adjustmentRules.filter((r) => r.rule_status === "inactive_until_mechanism_validated").length,
};

const output = {
  similarity_confidence_adjustment_layer_version:
    "similarity-confidence-adjustment-layer-v0.1",
  generated_at: new Date().toISOString(),
  source_validated_mechanism_registry: MECHANISM_PATH,

  policy: {
    principle:
      "Similarity confidence adjustment layer v0.1 ensures historical mechanisms may only adjust confidence after independent evidence assessment.",
    evidence_remains_primary: true,
    historical_similarity_is_secondary: true,
    mechanisms_must_not_override_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
    production_mutation_allowed: false,
  },

  decision_doctrine: {
    junior_smurf: "Collects and structures current evidence.",
    medior_smurf: "Assesses attribution and mechanism candidates.",
    senior_smurf: "Compares with validated historical mechanisms.",
    papa_smurf:
      "Combines evidence confidence and historical confidence into decision support without allowing history to override evidence.",
  },

  confidence_architecture: {
    primary_confidence:
      "Derived from current evidence, source quality, attribution quality, and data quality.",
    secondary_confidence:
      "Derived from validated mechanisms and historical similarity.",
    final_confidence:
      "Primary confidence plus capped secondary adjustment. Historical similarity cannot dominate.",
  },

  summary,
  adjustment_rules: adjustmentRules,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  layer_version: output.similarity_confidence_adjustment_layer_version,
  adjustment_rules_created: summary.adjustment_rules_created,
  active_rules: summary.active_rules,
  inactive_rules: summary.inactive_rules,
  output: OUTPUT_PATH,
});

for (const rule of adjustmentRules) {
  console.log(
    `${rule.adjustment_rule_id} | ${rule.driver_id} | ${rule.rule_status}`
  );
}
