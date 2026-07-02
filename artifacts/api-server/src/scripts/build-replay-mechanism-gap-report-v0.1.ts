import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const coveragePath = path.join(
  apiRoot,
  "data/replay/coverage/replay-mechanism-coverage-v0.1.json"
);

const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));

function targetCaseCount(band: string): number {
  if (band === "very_thin") return 5;
  if (band === "thin") return 5;
  if (band === "medium") return 10;
  return 10;
}

const gaps = (coverage.mechanisms ?? [])
  .map((item: any) => {
    const target = targetCaseCount(item.coverage_band);
    const missing = Math.max(target - item.case_count, 0);

    return {
      mechanism: item.mechanism,
      coverage_band: item.coverage_band,
      current_case_count: item.case_count,
      target_case_count: target,
      missing_case_count: missing,
      priority:
        item.coverage_band === "very_thin"
          ? "high"
          : item.coverage_band === "thin"
            ? "medium"
            : "low"
    };
  })
  .filter((item: any) => item.missing_case_count > 0)
  .sort((a: any, b: any) => {
    const priorityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (
      priorityRank[b.priority] - priorityRank[a.priority] ||
      b.missing_case_count - a.missing_case_count
    );
  });

const output = {
  version: "replay-mechanism-gap-report-v0.1",
  generated_at: new Date().toISOString(),
  source_coverage_file: coveragePath,
  historical_case_count: coverage.historical_case_count,
  unique_mechanism_count: coverage.unique_mechanism_count,
  gap_count: gaps.length,
  gaps
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-mechanism-gap-report-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  gap_report: output.version,
  gap_count: output.gap_count,
  output: outputPath
});
