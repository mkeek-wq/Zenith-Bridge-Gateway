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

const registry =
  readJsonSafe(path.join(ROOT, "data/replay/replay-case-registry-v0.1.json")) || {};

const cases: any[] = registry.replay_cases || [];

const fleetItems = cases.map((c, index) => ({
  fleet_item_id: `FLEET_ITEM_${String(index + 1).padStart(4, "0")}`,
  case_id: c.case_id,
  case_label: c.case_label,
  country: c.country,
  domain: c.domain,
  period_start: c.period_start,
  period_end: c.period_end,
  input_file: c.input_file,
  input_exists: fs.existsSync(path.join(ROOT, c.input_file)),
  expected_mechanisms: c.expected_mechanisms || [],
  replay_priority:
    c.case_id === "SG-MANUFACTURING-2020"
      ? "completed_baseline"
      : "pilot_replay",
  fleet_status:
    fs.existsSync(path.join(ROOT, c.input_file))
      ? "ready_for_fleet_replay"
      : "blocked_missing_input",
  governance: {
    dry_run_only: true,
    production_mutation_allowed: false,
    no_lifecycle_mutation: true,
    calibration_allowed: true
  }
}));

const output = {
  registry_version: "replay-fleet-manifest-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    fleet_manifest_controls_replay_batch_scope: true,
    replay_fleet_is_dry_run_only: true,
    production_mutation_forbidden: true,
    each_case_requires_input_file: true
  },
  summary: {
    fleet_items: fleetItems.length,
    ready_for_fleet_replay: fleetItems.filter((x) => x.fleet_status === "ready_for_fleet_replay").length,
    blocked_missing_input: fleetItems.filter((x) => x.fleet_status === "blocked_missing_input").length
  },
  fleet_items: fleetItems
};

ensureDir(path.join(ROOT, "data/replay/fleet"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/fleet/replay-fleet-manifest-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/replay/fleet/replay-fleet-manifest-v0.1.json"
});

console.table(
  fleetItems.map((x) => ({
    case_id: x.case_id,
    domain: x.domain,
    input: x.input_exists,
    status: x.fleet_status,
    expected: x.expected_mechanisms.length
  }))
);
