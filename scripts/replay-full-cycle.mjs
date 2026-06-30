#!/usr/bin/env node

import { execSync } from "node:child_process";

console.log("=================================");
console.log("Replay Full Cycle v0.1");
console.log("=================================");
console.log("");
console.log("Mode: SAFE PARTIAL EXECUTION - STEPS 1-2");
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
