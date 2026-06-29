import { spawn } from "node:child_process";

type Step = {
  name: string;
  command: string;
  args: string[];
};

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
    name: "Build investigation hypotheses",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-investigation-hypotheses.ts"],
  },
  {
    name: "Build evidence search packages",
    command: "pnpm",
    args: ["tsx", "src/scripts/build-evidence-search-packages-v2.ts"],
  },
];

function runStep(step: Step): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${step.name}`);
    console.log(`$ ${step.command} ${step.args.join(" ")}`);

    const child = spawn(step.command, step.args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✓ ${step.name}`);
        resolve();
      } else {
        reject(
          new Error(
            `Step failed: ${step.name} exited with code ${code}`,
          ),
        );
      }
    });
  });
}

async function main() {
  const cycleStartedAt = new Date().toISOString();

  console.log(
    JSON.stringify(
      {
        cycle_version: "smurf-intelligence-cycle-v0.1",
        cycle_started_at: cycleStartedAt,
        steps_planned: steps.length,
      },
      null,
      2,
    ),
  );

  for (const step of steps) {
    await runStep(step);
  }

  const cycleCompletedAt = new Date().toISOString();

  console.log(
    JSON.stringify(
      {
        cycle_version: "smurf-intelligence-cycle-v0.1",
        cycle_status: "completed",
        cycle_started_at: cycleStartedAt,
        cycle_completed_at: cycleCompletedAt,
        steps_completed: steps.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        cycle_version: "smurf-intelligence-cycle-v0.1",
        cycle_status: "failed",
        error: error.message,
      },
      null,
      2,
    ),
  );

  process.exit(1);
});
