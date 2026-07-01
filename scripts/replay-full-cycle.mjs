#!/usr/bin/env node

import { execSync } from "node:child_process";

console.log("=================================");
console.log("Replay Full Cycle v0.1");
console.log("=================================");
console.log("");
console.log("Mode: SAFE PARTIAL EXECUTION - STEPS 1-40");
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
  {
    step: "Step 15 - Forecast envelope",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-forecast-envelope-v0.1.ts",
  },
  {
    step: "Step 16 - Confidence engine",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-confidence-engine-v0.1.ts",
  },
  {
    step: "Step 17 - Historian snapshot",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-historian-snapshot-v0.1.ts",
  },
  {
    step: "Step 18 - Brainy diagnosis",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-brainy-diagnosis-v0.1.ts",
  },
  {
    step: "Step 19 - Depth enrichment queue",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-depth-enrichment-queue-v0.1.ts",
  },
  {
    step: "Step 20 - Improvement proposal engine",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/replay-improvement-proposal-engine-v0.1.ts",
  },
  {
    step: "Step 21 - Proposal registry",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/replay-proposal-registry-v0.1.ts",
  },
  {
    step: "Step 22 - Proposal dashboard",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-proposal-dashboard-v0.1.ts",
  },
  {
    step: "Step 23 - Shadow execution",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-shadow-execution-v0.1.ts",
  },
  {
    step: "Step 24 - Audit engine",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-audit-engine-v0.1.ts",
  },
  {
    step: "Step 25 - Improvement history",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-improvement-history-v0.1.ts",
  },
  {
    step: "Step 26 - Governance history",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-governance-history-v0.1.ts",
  },
  {
    step: "Step 27 - Confidence history and improvement report",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-confidence-history-v0.1.ts && pnpm tsx src/scripts/build-replay-improvement-report-v0.1.ts",
  },
  {
    step: "Step 28 - Self-improvement orchestrator",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-self-improvement-orchestrator-v0.1.ts",
  },
  {
    step: "Step 29 - Landscape cartographer",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-landscape-cartographer-v0.1.ts",
  },
  {
    step: "Step 30 - Scenario library",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-scenario-library-v0.1.ts",
  },
  {
    step: "Step 31 - Decision support layer",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-decision-support-layer-v0.1.ts",
  },
  {
    step: "Step 32 - Client impact assessment",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-client-impact-assessment-v0.1.ts",
  },
  {
    step: "Step 33 - Forecast range Smurf",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-forecast-range-smurf-v0.1.ts",
  },
  {
    step: "Step 34 - Macro event anchor registry",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-event-registry-v0.1.ts",
  },
  {
    step: "Step 35 - Macro event coverage map",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-event-coverage-map-v0.1.ts",
  },
  {
    step: "Step 36 - Macro anchor expansion queue",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-anchor-expansion-queue-v0.1.ts",
  },
  {
    step: "Step 37 - Macro acquisition queue",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-acquisition-queue-v0.1.ts",
  },
  {
    step: "Step 38 - Macro sourced batch",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-sourced-batch-v0.1.ts",
  },
  {
    step: "Step 39 - Macro source checklist",
    command:
      "cd artifacts/api-server && pnpm tsx src/scripts/build-replay-macro-source-checklist-v0.1.ts",
  },
  {
    step: "Step 40 - Macro source attachment drafts",
    command:
      "cd artifacts/api-server && pnpm replay:macro-source-attachments",
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
