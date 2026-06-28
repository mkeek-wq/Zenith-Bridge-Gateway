import fs from "fs";
import path from "path";

type HistoricalCase = {
  case_id: string;
  title: string;
  region: string;
  sector: string;
  period: string;
  mechanisms: string[];
  keywords: string[];
  confidence?: number;
};

type ReplayRecord = {
  replay_record_id?: string;
  source_record_id?: string;
  metric_name?: string;
  period?: string;
  inferred_mechanisms?: string[];
  evidence_window?: string;
};

const apiRoot = process.cwd();

const replayOutputPath = process.argv[2];

if (!replayOutputPath) {
  console.error("Usage: pnpm tsx src/scripts/run-replay-similarity-engine-v0.1.ts <replay-output-json>");
  process.exit(1);
}

const absoluteReplayPath = path.isAbsolute(replayOutputPath)
  ? replayOutputPath
  : path.join(apiRoot, replayOutputPath);

const historicalCasePath = path.join(
  apiRoot,
  "data/replay/cases/replay-historical-case-registry-v0.1.json"
);

const outputDir = path.join(apiRoot, "data/replay/similarity");
fs.mkdirSync(outputDir, { recursive: true });

const replayData = JSON.parse(fs.readFileSync(absoluteReplayPath, "utf8"));
const historicalData = JSON.parse(fs.readFileSync(historicalCasePath, "utf8"));

const replayRecords: ReplayRecord[] = replayData.replayed_records ?? [];
const historicalCases: HistoricalCase[] = historicalData.cases ?? [];

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenSet(values: string[]): Set<string> {
  return new Set(values.flatMap((v) => normalise(v).split(" ").filter(Boolean)));
}

function overlapRatio(a: string[], b: string[]): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);

  if (setA.size === 0) return 0;

  let matches = 0;
  for (const item of setA) {
    if (setB.has(item)) matches++;
  }

  return matches / setA.size;
}

function mechanismScore(record: ReplayRecord, historicalCase: HistoricalCase): number {
  return overlapRatio(record.inferred_mechanisms ?? [], historicalCase.mechanisms);
}

function keywordScore(record: ReplayRecord, historicalCase: HistoricalCase): number {
  const recordText = [
    record.metric_name ?? "",
    record.evidence_window ?? "",
    record.period ?? ""
  ];

  return overlapRatio(historicalCase.keywords, recordText);
}

function sectorScore(record: ReplayRecord, historicalCase: HistoricalCase): number {
  const metric = normalise(record.metric_name ?? "");
  const sector = normalise(historicalCase.sector);
  return metric.includes(sector) || sector.includes(metric) ? 1 : 0;
}

function similarityScore(record: ReplayRecord, historicalCase: HistoricalCase): number {
  const score =
    mechanismScore(record, historicalCase) * 0.5 +
    keywordScore(record, historicalCase) * 0.3 +
    sectorScore(record, historicalCase) * 0.2;

  return Number(score.toFixed(3));
}

const results = replayRecords.map((record) => {
  const matches = historicalCases
    .map((historicalCase) => ({
      case_id: historicalCase.case_id,
      title: historicalCase.title,
      similarity_score: similarityScore(record, historicalCase),
      matched_mechanisms: historicalCase.mechanisms.filter((m) =>
        (record.inferred_mechanisms ?? []).includes(m)
      )
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);

  return {
    replay_record_id: record.replay_record_id,
    source_record_id: record.source_record_id,
    metric_name: record.metric_name,
    period: record.period,
    top_matches: matches
  };
});

const output = {
  version: "replay-similarity-results-v0.1",
  generated_at: new Date().toISOString(),
  replay_output_source: absoluteReplayPath,
  historical_case_registry: historicalCasePath,
  replay_record_count: replayRecords.length,
  historical_case_count: historicalCases.length,
  results
};

const outputPath = path.join(
  outputDir,
  `replay-similarity-results-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  similarity_engine: output.version,
  replay_record_count: output.replay_record_count,
  historical_case_count: output.historical_case_count,
  output: outputPath
});
