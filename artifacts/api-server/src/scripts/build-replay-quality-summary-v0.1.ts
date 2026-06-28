import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const caseRegistryPath = path.join(
  apiRoot,
  "data/replay/cases/replay-historical-case-registry-v0.1.json"
);

const coveragePath = path.join(
  apiRoot,
  "data/replay/coverage/replay-mechanism-coverage-v0.1.json"
);

const registry = JSON.parse(fs.readFileSync(caseRegistryPath, "utf8"));
const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));

const output = {
  version: "replay-quality-summary-v0.1",
  generated_at: new Date().toISOString(),
  historical_case_count: registry.cases?.length ?? 0,
  unique_mechanism_count: coverage.unique_mechanism_count ?? 0,
  thin_mechanism_count: (coverage.mechanisms ?? []).filter(
    (m: any) => m.coverage_band === "thin"
  ).length,
  very_thin_mechanism_count: (coverage.mechanisms ?? []).filter(
    (m: any) => m.coverage_band === "very_thin"
  ).length,
  dashboard_status: "early_learning",
  next_target: "Expand historical cases to 25 and improve taxonomy-aware similarity."
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-quality-summary-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(output);
