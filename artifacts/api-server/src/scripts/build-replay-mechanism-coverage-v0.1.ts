import fs from "fs";
import path from "path";

type HistoricalCase = {
  case_id: string;
  mechanisms: string[];
};

const apiRoot = process.cwd();

const historicalCasePath = path.join(
  apiRoot,
  "data/replay/cases/replay-historical-case-registry-v0.1.json"
);

const outputDir = path.join(apiRoot, "data/replay/coverage");
fs.mkdirSync(outputDir, { recursive: true });

const historicalData = JSON.parse(fs.readFileSync(historicalCasePath, "utf8"));
const cases: HistoricalCase[] = historicalData.cases ?? [];

const mechanismCounts = new Map<string, number>();

for (const item of cases) {
  for (const mechanism of item.mechanisms ?? []) {
    mechanismCounts.set(mechanism, (mechanismCounts.get(mechanism) ?? 0) + 1);
  }
}

function coverageBand(count: number): string {
  if (count >= 10) return "high";
  if (count >= 5) return "medium";
  if (count >= 2) return "thin";
  return "very_thin";
}

const mechanisms = [...mechanismCounts.entries()]
  .map(([mechanism, case_count]) => ({
    mechanism,
    case_count,
    coverage_band: coverageBand(case_count)
  }))
  .sort((a, b) => b.case_count - a.case_count);

const output = {
  version: "replay-mechanism-coverage-v0.1",
  generated_at: new Date().toISOString(),
  historical_case_registry: historicalCasePath,
  historical_case_count: cases.length,
  unique_mechanism_count: mechanisms.length,
  mechanisms
};

const outputPath = path.join(outputDir, "replay-mechanism-coverage-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  coverage_report: output.version,
  historical_case_count: output.historical_case_count,
  unique_mechanism_count: output.unique_mechanism_count,
  output: outputPath
});
