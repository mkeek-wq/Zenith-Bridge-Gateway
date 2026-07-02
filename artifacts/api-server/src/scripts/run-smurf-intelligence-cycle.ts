import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Step = {
  name: string;
  command: string;
  args: string[];
};

type StepResult = {
  name: string;
  command: string;
  started_at: string;
  completed_at?: string;
  status: "completed" | "failed";
  error?: string;
};

const RUN_DIR = "data/intelligence-runs";

const steps: Step[] = [
  {
    name: "Build case files",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-case-files.ts"],
  },
  {
    name: "Update case confidence",
    command: "pnpm",
    args: ["tsx", "src/scripts/update-case-confidence.ts"],
  },
  {
    name: "Update case state",
    command: "pnpm",
    args: ["tsx", "src/scripts/update-case-state.ts"],
  },
  {
    name: "Build investigation queue",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-investigation-queue.ts"],
  },
  {
    name: "Update case history",
    command: "pnpm",
    args: ["tsx", "src/scripts/update-case-history.ts"],
  },
  {
    name: "Build case fingerprints",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-case-fingerprints.ts"],
  },
  {
    name: "Build case similarity",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-case-similarity.ts"],
  },
  {
    name: "Build investigation hypotheses",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-investigation-hypotheses.ts"],
  },
  {
    name: "Enrich hypotheses with similarity",
    command: "pnpm",
    args: ["tsx", "src/scripts/enrich-hypotheses-with-similarity.ts"],
  },
  {
    name: "Build evidence search packages",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-evidence-search-packages-v2.ts"],
  },
  {
    name: "Build case outcomes",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-case-outcomes.ts"],
  },
  {
    name: "Build historical outcomes",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-historical-outcomes.ts"],
  },
  {
    name: "Build outcome recommendations",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-outcome-recommendations.ts"],
  },
];

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

async function writeRunLog(runLog: any) {
  await mkdir(RUN_DIR, { recursive: true });

  const latestPath = path.join(RUN_DIR, "latest.json");
  const timestampPath = path.join(
    RUN_DIR,
    `${safeTimestamp(new Date(runLog.cycle_started_at))}.json`,
  );

  await writeFile(latestPath, JSON.stringify(runLog, null, 2), "utf8");
  await writeFile(timestampPath, JSON.stringify(runLog, null, 2), "utf8");
}

function runStep(step: Step): Promise<StepResult> {
  return new Promise((resolve, reject) => {
    const startedAt = new Date().toISOString();
    const commandText = `${step.command} ${step.args.join(" ")}`;

    console.log(`\n▶ ${step.name}`);
    console.log(`$ ${commandText}`);

    const child = spawn(step.command, step.args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (error) => {
      reject({
        name: step.name,
        command: commandText,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        status: "failed",
        error: error.message,
      } satisfies StepResult);
    });

    child.on("close", (code) => {
      const completedAt = new Date().toISOString();

      if (code === 0) {
        console.log(`✓ ${step.name}`);

        resolve({
          name: step.name,
          command: commandText,
          started_at: startedAt,
          completed_at: completedAt,
          status: "completed",
        });
      } else {
        reject({
          name: step.name,
          command: commandText,
          started_at: startedAt,
          completed_at: completedAt,
          status: "failed",
          error: `Exited with code ${code}`,
        } satisfies StepResult);
      }
    });
  });
}

async function main() {
  const cycleStartedAt = new Date().toISOString();
  const cycleId = safeTimestamp(new Date(cycleStartedAt));

  const stepResults: StepResult[] = [];

  let runLog: any = {
    cycle_version: "smurf-intelligence-cycle-v0.2",
    cycle_id: cycleId,
    cycle_status: "running",
    cycle_started_at: cycleStartedAt,
    cycle_completed_at: null,
    steps_planned: steps.length,
    steps_completed: 0,
    steps_failed: 0,
    steps: stepResults,
  };

  await writeRunLog(runLog);

  console.log(JSON.stringify(runLog, null, 2));

  try {
    for (const step of steps) {
      const result = await runStep(step);
      stepResults.push(result);

      runLog = {
        ...runLog,
        steps_completed: stepResults.filter(
          (item) => item.status === "completed",
        ).length,
        steps_failed: stepResults.filter(
          (item) => item.status === "failed",
        ).length,
        steps: stepResults,
      };

      await writeRunLog(runLog);
    }

    runLog = {
      ...runLog,
      cycle_status: "completed",
      cycle_completed_at: new Date().toISOString(),
      steps_completed: stepResults.length,
      steps_failed: 0,
      steps: stepResults,
    };

    await writeRunLog(runLog);

    console.log(JSON.stringify(runLog, null, 2));
  } catch (error: any) {
    const failedStep = error as StepResult;

    stepResults.push(failedStep);

    runLog = {
      ...runLog,
      cycle_status: "failed",
      cycle_completed_at: new Date().toISOString(),
      steps_completed: stepResults.filter(
        (item) => item.status === "completed",
      ).length,
      steps_failed: stepResults.filter(
        (item) => item.status === "failed",
      ).length,
      steps: stepResults,
      error: failedStep.error ?? "Unknown error",
    };

    await writeRunLog(runLog);

    console.error(JSON.stringify(runLog, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
