import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const decisionSupport = readJson(
  "data/replay/replay-decision-support-layer-v0.1.json"
);

const clientProfiles = [
  {
    client_profile_id: "CLIENT_PROFILE_SG_SME_IMPORTER",
    label: "Singapore SME importer",
    exposure_tags: ["supply_chain_disruption", "energy_inflation_shock", "geopolitical_trade_shock"],
  },
  {
    client_profile_id: "CLIENT_PROFILE_SG_EXPORT_MANUFACTURER",
    label: "Singapore export manufacturer",
    exposure_tags: ["electronics_cycle", "supply_chain_disruption", "financial_conditions_shock"],
  },
  {
    client_profile_id: "CLIENT_PROFILE_REGIONAL_SERVICES",
    label: "Regional services firm",
    exposure_tags: ["pandemic_health_shock", "financial_conditions_shock", "general_macro_shock"],
  },
];

function impactLevel(matchCount: number) {
  if (matchCount >= 3) return "high";
  if (matchCount === 2) return "medium";
  if (matchCount === 1) return "low";
  return "watch";
}

const assessments = clientProfiles.map((profile) => {
  const matched = decisionSupport.decision_items.filter((item: any) =>
    profile.exposure_tags.includes(item.scenario_type)
  );

  const suggestedActions = matched.flatMap((item: any) =>
    item.suggested_actions.map((action: string) => ({
      scenario_type: item.scenario_type,
      action,
    }))
  );

  return {
    client_profile_id: profile.client_profile_id,
    label: profile.label,
    exposure_tags: profile.exposure_tags,
    matched_scenario_count: matched.length,
    impact_level: impactLevel(matched.length),
    matched_scenarios: matched.map((item: any) => ({
      scenario_type: item.scenario_type,
      evidence_strength: item.evidence_strength,
      case_count: item.case_count,
      mechanism_count: item.mechanism_count,
    })),
    suggested_actions: suggestedActions,
    human_review_required: true,
  };
});

const output = {
  version: "replay-client-impact-assessment-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Client impact assessment maps replay decision-support scenarios to generic client exposure profiles. It is not client-specific advice until reviewed by Papa/human governance.",
  safety_mode: "ADVISORY_ONLY",
  production_write_allowed: false,
  source_files: {
    decision_support: "data/replay/replay-decision-support-layer-v0.1.json",
  },
  client_profile_count: clientProfiles.length,
  assessment_count: assessments.length,
  assessments,
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-client-impact-assessment-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  assessment_count: output.assessment_count,
  high_impact_profiles: assessments.filter((a) => a.impact_level === "high").length,
});
