import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/cases/replay-historical-case-registry-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/case-completeness-report-v0.1.json"
);

type HistoricalCase = {
  case_id: string;
  title?: string;
  mechanisms?: string[];
  sources?: unknown[];
  evidence?: unknown[];
  outcomes?: unknown[];
  timeline?: unknown[];
  lessons_learned?: unknown[];
  forecast_notes?: unknown[];
};

function scoreArray(value: unknown): number {
  return Array.isArray(value) && value.length > 0 ? 1 : 0;
}

function completenessScore(c: HistoricalCase) {
  const scores = {
    mechanisms: scoreArray(c.mechanisms),
    sources: scoreArray(c.sources),
    evidence: scoreArray(c.evidence),
    outcomes: scoreArray(c.outcomes),
    timeline: scoreArray(c.timeline),
    lessons_learned: scoreArray(c.lessons_learned),
    forecast_notes: scoreArray(c.forecast_notes),
  };

  const total =
    Object.values(scores).reduce((sum, value) => sum + value, 0) /
    Object.keys(scores).length;

  return {
    case_id: c.case_id,
    title: c.title ?? null,
    completeness_score: Number(total.toFixed(3)),
    band: total >= 0.8 ? "strong" : total >= 0.5 ? "moderate" : "thin",
    missing_fields: Object.entries(scores)
      .filter(([, value]) => value === 0)
      .map(([key]) => key),
  };
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const cases: HistoricalCase[] = registry.cases ?? registry.historical_cases ?? [];

const report = {
  report_version: "case-completeness-report-v0.1",
  generated_at: new Date().toISOString(),
  case_count: cases.length,
  cases: cases.map(completenessScore),
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log({
  output: outputPath,
  case_count: report.case_count,
});
