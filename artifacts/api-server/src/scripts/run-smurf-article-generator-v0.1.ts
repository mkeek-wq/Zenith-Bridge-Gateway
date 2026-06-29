import { execSync } from "child_process";

const steps = [
  "build-smurf-article-seed-from-opportunity-v0.1.ts",
  "build-article-evidence-package-v0.2.ts",
  "build-article-insight-package-v0.2.ts",
  "build-article-brief-package-v0.3.ts",
  "build-smurf-intelligence-snapshot-v0.1.ts",
  "build-article-draft-generator-v0.6.ts",
  "build-data-request-queue-v0.1.ts",
  "build-verified-metrics-registry-v0.1.ts",
  "build-graph-opportunity-generator-v0.2.ts",
  "build-publication-package-v0.1.ts",
  "build-concept-visual-package-v0.2.ts",
  "build-cover-image-brief-v0.1.ts",
  "build-linkedin-post-package-v0.1.ts",
  "build-cms-export-package-v0.1.ts",
  "build-interpretation-workbench-package-v0.1.ts",
  "build-graph-data-workbench-package-v0.1.ts",
  "build-article-thesis-package-v0.1.ts",
  "build-article-editor-v0.1.ts",
  "build-editorial-memory-engine-v0.1.ts",
];

console.log("Running SMURF article generator v0.1...\n");

for (const step of steps) {
  console.log(`\n▶ ${step}`);
  execSync(`pnpm tsx src/scripts/${step}`, { stdio: "inherit" });
}

console.log("\nSMURF article generator v0.1 complete.");
