#!/usr/bin/env node

import { execSync } from "node:child_process";

console.log("=================================");
console.log("Replay Full Cycle v0.1");
console.log("=================================");
console.log("");
console.log("Mode: SAFE PARTIAL EXECUTION - STEPS 1-14");
console.log("");

const commands = [
  {
    step: "Step 1 - Historical case registry",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/merge-replay-historical-cases-v0.1.ts",
  },
  {
    step: "Step 2 - Mechanism coverage",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-mechanism-coverage-v0.1.ts",
  },
  {
    step: "Step 3 - Mechanism taxonomy coverage",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-mechanism-taxonomy-coverage-v0.1.ts",
  },
  {
    step: "Step 4 - Mechanism gap report",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-mechanism-gap-report-v0.1.ts",
  },
  {
    step: "Step 5 - Case acquisition queue",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-case-acquisition-queue-v0.1.ts",
  },
  {
    step: "Step 6 - Case completeness report",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/case-completeness-engine-v0.1.ts",
  },
  {
    step: "Step 7 - Case audit",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-case-audit-v0.1.ts",
  },
  {
    step: "Step 8 - Audit summary",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-audit-summary-v0.1.ts",
  },
  {
    step: "Step 9 - Case depth audit",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-case-depth-audit-v0.1.ts",
  },
  {
    step: "Step 10 - Quality summary",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-quality-summary-v0.1.ts",
  },
  {
    step: "Step 11 - Similarity engine",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/run-replay-similarity-engine-v0.2.ts data/replay/inputs/canonical-replay-input-v0.1.json",
  },
  {
    step: "Step 12 - Analogue summary",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-analogue-summary-v0.1.ts",
  },
  {
    step: "Step 13 - Explanation summary",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-explanation-summary-v0.1.ts",
  },
  {
    step: "Step 14 - Papa replay dashboard package",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-papa-replay-dashboard-package-v0.1.ts",
  },
];

for (const item of commands) {
  console.log(`▶ ${item.step}`);
  console.log(`$ ${item.command}`);
  execSync(item.command, { stdio: "inherit" });
  console.log(`✓ ${item.step} completed`);
  console.log("");
}

console.log("Manual governance steps intentionally excluded:");
console.log("- approve-replay-proposal-v0.1.ts");
console.log("- reject-replay-proposal-v0.1.ts");
console.log("- promote-replay-proposal-v0.1.ts");
console.log("");
console.log("Replay full cycle partial execution completed.");
