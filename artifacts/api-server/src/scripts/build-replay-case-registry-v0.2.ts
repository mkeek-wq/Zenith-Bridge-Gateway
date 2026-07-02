import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const replayCases = [
  ["SG-MANUFACTURING-2020", "Singapore Manufacturing Recovery 2020-2021", "manufacturing", "2020-01", "2021-12", ["MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY", "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-manufacturing-recovery-v0.1.json"],
  ["SG-PETROLEUM-2020", "Singapore Petroleum Shock 2020", "petroleum", "2020-01", "2020-12", ["MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-petroleum-2020-v0.1.json"],
  ["SG-SEMICONDUCTOR-2021", "Singapore Semiconductor Recovery 2021", "semiconductors", "2021-01", "2021-12", ["MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY", "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-semiconductor-2021-v0.1.json"],
  ["SG-BIOMEDICAL-2021", "Singapore Biomedical Output 2021", "biomedical", "2021-01", "2021-12", ["MKT_006_POLICY_REGULATORY_IMPACT", "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-biomedical-2021-v0.1.json"],
  ["SG-ELECTRONICS-2020", "Singapore Electronics Shock 2020", "electronics", "2020-01", "2020-12", ["MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-electronics-2020-v0.1.json"],
  ["SG-ELECTRONICS-2021", "Singapore Electronics Recovery 2021", "electronics", "2021-01", "2021-12", ["MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY", "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-electronics-2021-v0.1.json"],
  ["SG-SERVICES-2020", "Singapore Services Shock 2020", "services", "2020-01", "2020-12", ["MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"], "data/replay/input/replay-input-sg-services-2020-v0.1.json"],
  ["SG-SERVICES-2021", "Singapore Services Partial Recovery 2021", "services", "2021-01", "2021-12", ["MKT_006_POLICY_REGULATORY_IMPACT"], "data/replay/input/replay-input-sg-services-2021-v0.1.json"],
].map(([case_id, case_label, domain, period_start, period_end, expected_mechanisms, input_file]) => {
  const inputExists = fs.existsSync(path.join(ROOT, input_file as string));

  return {
    case_id,
    case_label,
    country: "SG",
    period_start,
    period_end,
    domain,
    status: inputExists ? "ready_for_replay" : "registered_pending_input",
    expected_mechanisms,
    input_file,
    input_exists: inputExists,
    replay_case_status: inputExists ? "ready_for_replay" : "registered_pending_input",
    governance: {
      dry_run_only: true,
      production_mutation_allowed: false,
      calibration_allowed: true,
    },
  };
});

const output = {
  registry_version: "replay-case-registry-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_cases_are_registered_before_execution: true,
    replay_cases_do_not_mutate_production: true,
    expected_mechanisms_are_calibration_targets_not_truth: true,
  },
  summary: {
    cases_registered: replayCases.length,
    ready_for_replay: replayCases.filter((c) => c.replay_case_status === "ready_for_replay").length,
    pending_input: replayCases.filter((c) => !c.input_exists).length,
  },
  replay_cases: replayCases,
};

ensureDir(path.join(ROOT, "data/replay"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-case-registry-v0.2.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-case-registry-v0.1.json"),
  JSON.stringify({ ...output, registry_version: "replay-case-registry-v0.1-compat" }, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/replay/replay-case-registry-v0.2.json",
  compat_output: "data/replay/replay-case-registry-v0.1.json",
});

console.table(
  replayCases.map((c) => ({
    case_id: c.case_id,
    domain: c.domain,
    status: c.replay_case_status,
    input_exists: c.input_exists,
    expected: (c.expected_mechanisms as any[]).length,
  }))
);
