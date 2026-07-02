import fs from "fs";
import path from "path";

const apiRoot = process.cwd();
const repoRoot = path.resolve(apiRoot, "../..");

function listFiles(dir: string, suffix?: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !suffix || name.endsWith(suffix))
    .sort();
}

function readTextIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

const scriptsDir = path.join(apiRoot, "src/scripts");
const replayDataDir = path.join(apiRoot, "data/replay");
const fullCyclePath = path.join(repoRoot, "scripts/replay-full-cycle.mjs");
const packageJsonPath = path.join(apiRoot, "package.json");

const replayScripts = listFiles(scriptsDir, ".ts").filter((name) =>
  name.includes("replay")
);

const replayOutputs = fs.existsSync(replayDataDir)
  ? fs
      .readdirSync(replayDataDir, { recursive: true })
      .map(String)
      .filter((name) => name.endsWith(".json"))
      .sort()
  : [];

const packageJson = JSON.parse(readTextIfExists(packageJsonPath));
const packageScripts = packageJson.scripts ?? {};
const replayPackageCommands = Object.keys(packageScripts)
  .filter((key) => key.startsWith("replay:"))
  .sort();

const fullCycleText = readTextIfExists(fullCyclePath);

const unwiredReplayScripts = replayScripts.filter((script) => {
  return !fullCycleText.includes(script) && !Object.values(packageScripts).some((cmd) =>
    String(cmd).includes(script)
  );
});

const fullCycleStepMatches = [...fullCycleText.matchAll(/Step\s+(\d+)\s+-/g)];
const fullCycleSteps = fullCycleStepMatches.map((match) => Number(match[1]));
const maxFullCycleStep = fullCycleSteps.length ? Math.max(...fullCycleSteps) : 0;

const landscape = {
  version: "replay-landscape-cartographer-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "The landscape cartographer scans the live replay subsystem before Brainy or coding agents recommend changes.",
  scope: {
    api_root: apiRoot,
    repo_root: repoRoot,
    scripts_dir: "artifacts/api-server/src/scripts",
    replay_data_dir: "artifacts/api-server/data/replay",
    full_cycle_orchestrator: "scripts/replay-full-cycle.mjs",
  },
  summary: {
    replay_script_count: replayScripts.length,
    replay_output_count: replayOutputs.length,
    package_replay_command_count: replayPackageCommands.length,
    full_cycle_step_count: fullCycleSteps.length,
    max_full_cycle_step: maxFullCycleStep,
    unwired_replay_script_count: unwiredReplayScripts.length,
  },
  orchestration: {
    package_replay_commands: replayPackageCommands,
    full_cycle_steps: fullCycleSteps,
    max_full_cycle_step: maxFullCycleStep,
    full_cycle_mentions_self_improvement:
      fullCycleText.includes("build-replay-self-improvement-orchestrator-v0.1.ts"),
  },
  replay_scripts: replayScripts,
  replay_outputs: replayOutputs,
  unwired_replay_scripts: unwiredReplayScripts,
  recommended_use:
    "Brainy should consume this file before producing improvement recommendations.",
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-landscape-cartographer-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(landscape, null, 2));

console.log({
  output: outputPath,
  replay_script_count: landscape.summary.replay_script_count,
  replay_output_count: landscape.summary.replay_output_count,
  max_full_cycle_step: landscape.summary.max_full_cycle_step,
  unwired_replay_script_count: landscape.summary.unwired_replay_script_count,
});
