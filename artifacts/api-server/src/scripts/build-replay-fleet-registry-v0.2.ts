import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OUTPUT =
  "data/replay/replay-fleet-registry-v0.2.json";

const seedCases = [
  {
    case_id: "SG-MANUFACTURING-2020",
    domain: "manufacturing",
    status: "completed"
  },
  {
    case_id: "SG-PETROLEUM-2020",
    domain: "petroleum",
    status: "completed"
  },
  {
    case_id: "SG-SEMICONDUCTOR-2021",
    domain: "semiconductors",
    status: "completed"
  },
  {
    case_id: "SG-BIOMEDICAL-2021",
    domain: "biomedical",
    status: "completed"
  }
];

const output = {
  registry_version: "replay-fleet-registry-v0.2",
  generated_at: new Date().toISOString(),

  doctrine: {
    replay_cases_are_versioned: true,
    replay_runs_are_repeatable: true,
    replay_learning_requires_scale: true
  },

  summary: {
    total_cases: seedCases.length,
    ready: 0,
    running: 0,
    completed: seedCases.length,
    failed: 0,
    retired: 0
  },

  fleet: seedCases
};

fs.mkdirSync(path.join(ROOT, "data/replay"), {
  recursive: true
});

fs.writeFileSync(
  path.join(ROOT, OUTPUT),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  total_cases: output.summary.total_cases,
  output: OUTPUT
});
