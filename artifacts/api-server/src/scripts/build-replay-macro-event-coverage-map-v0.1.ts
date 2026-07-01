import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const macro = readJson(
  "data/replay/replay-macro-event-anchor-registry-v0.1.json"
);

const scenarios = readJson(
  "data/replay/replay-scenario-library-v0.1.json"
);

const scenarioTypes = scenarios.scenarios.map((s: any) => s.scenario_type);

const coverage = scenarioTypes.map((scenarioType: string) => {
  const anchors = macro.events.filter((event: any) =>
    event.linked_scenario_types.includes(scenarioType)
  );

  let coverageBand = "thin";
  if (anchors.length >= 4) coverageBand = "strong";
  else if (anchors.length >= 2) coverageBand = "adequate";

  return {
    scenario_type: scenarioType,
    anchor_count: anchors.length,
    coverage_band: coverageBand,
    anchor_ids: anchors.map((event: any) => event.macro_event_id),
    anchor_labels: anchors.map((event: any) => event.label),
  };
});

const output = {
  version: "replay-macro-event-coverage-map-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro event coverage maps benchmark anchors to scenario families. It identifies calibration coverage gaps without influencing raw data.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_event_anchor_registry:
      "data/replay/replay-macro-event-anchor-registry-v0.1.json",
    scenario_library: "data/replay/replay-scenario-library-v0.1.json",
  },
  scenario_count: scenarioTypes.length,
  coverage,
  gaps: coverage.filter((item: any) => item.coverage_band === "thin"),
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-event-coverage-map-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  scenario_count: output.scenario_count,
  thin_coverage_count: output.gaps.length,
});
