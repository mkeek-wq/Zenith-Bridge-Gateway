import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const replayCases = [
  {
    case_id: "SG-MANUFACTURING-2020",
    case_label: "Singapore Manufacturing Recovery 2020-2021",
    country: "SG",
    period_start: "2020-01",
    period_end: "2021-12",
    domain: "manufacturing",
    status: "ready_for_replay",
    expected_mechanisms: [
      "MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY",
      "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"
    ],
    input_file: "data/replay/input/replay-input-sg-manufacturing-recovery-v0.1.json",
    governance: {
      dry_run_only: true,
      production_mutation_allowed: false,
      calibration_allowed: true
    }
  },
  {
    case_id: "SG-PETROLEUM-2020",
    case_label: "Singapore Petroleum Shock 2020",
    country: "SG",
    period_start: "2020-01",
    period_end: "2020-12",
    domain: "petroleum",
    status: "registered_pending_input",
    expected_mechanisms: [
      "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"
    ],
    input_file: "data/replay/input/replay-input-sg-petroleum-2020-v0.1.json",
    governance: {
      dry_run_only: true,
      production_mutation_allowed: false,
      calibration_allowed: true
    }
  },
  {
    case_id: "SG-SEMICONDUCTOR-2021",
    case_label: "Singapore Semiconductor Recovery 2021",
    country: "SG",
    period_start: "2021-01",
    period_end: "2021-12",
    domain: "semiconductors",
    status: "registered_pending_input",
    expected_mechanisms: [
      "MKT_002_INVENTORY_CYCLE_OR_PRODUCTION_RECOVERY",
      "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"
    ],
    input_file: "data/replay/input/replay-input-sg-semiconductor-2021-v0.1.json",
    governance: {
      dry_run_only: true,
      production_mutation_allowed: false,
      calibration_allowed: true
    }
  },
  {
    case_id: "SG-BIOMEDICAL-2021",
    case_label: "Singapore Biomedical Output 2021",
    country: "SG",
    period_start: "2021-01",
    period_end: "2021-12",
    domain: "biomedical",
    status: "registered_pending_input",
    expected_mechanisms: [
      "MKT_006_POLICY_REGULATORY_IMPACT",
      "MKT_010_DEMAND_SHOCK_OR_EXTERNAL_RECOVERY"
    ],
    input_file: "data/replay/input/replay-input-sg-biomedical-2021-v0.1.json",
    governance: {
      dry_run_only: true,
      production_mutation_allowed: false,
      calibration_allowed: true
    }
  }
];

const enrichedCases = replayCases.map((c) => {
  const inputExists = fs.existsSync(path.join(ROOT, c.input_file));

  return {
    ...c,
    input_exists: inputExists,
    replay_case_status:
      c.status === "ready_for_replay" && inputExists
        ? "ready_for_replay"
        : inputExists
          ? "input_available"
          : c.status,
  };
});

const output = {
  registry_version: "replay-case-registry-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_cases_are_registered_before_execution: true,
    replay_cases_do_not_mutate_production: true,
    expected_mechanisms_are_calibration_targets_not_truth: true
  },
  summary: {
    cases_registered: enrichedCases.length,
    ready_for_replay: enrichedCases.filter((c) => c.replay_case_status === "ready_for_replay").length,
    pending_input: enrichedCases.filter((c) => !c.input_exists).length
  },
  replay_cases: enrichedCases
};

ensureDir(path.join(ROOT, "data/replay"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-case-registry-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/replay/replay-case-registry-v0.1.json"
});

console.table(
  enrichedCases.map((c) => ({
    case_id: c.case_id,
    domain: c.domain,
    status: c.replay_case_status,
    input_exists: c.input_exists,
    expected: c.expected_mechanisms.length
  }))
);
