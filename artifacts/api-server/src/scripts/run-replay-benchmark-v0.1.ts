import fs from "fs";
import path from "path";

type BenchmarkCase = {
  benchmark_id: string;
  title: string;
  expected_mechanisms: string[];
  expected_analogues: string[];
  minimum_confidence: number;
  maximum_confidence: number;
};

type ReplayRecord = {
  benchmark_id?: string;
  title?: string;
  mechanisms?: string[];
  analogues?: string[];
  confidence?: number;
};

const apiRoot = process.cwd();
const repoRoot = path.resolve(apiRoot, "../..");

const benchmarkPath = path.join(
  apiRoot,
  "data/benchmarks/replay-benchmark-cases-v0.1.json"
);

const replayOutputPath = process.argv[2];

if (!replayOutputPath) {
  console.error("Usage: pnpm tsx src/scripts/run-replay-benchmark-v0.1.ts <replay-output-json>");
  process.exit(1);
}

const absoluteReplayPath = path.isAbsolute(replayOutputPath)
  ? replayOutputPath
  : path.join(apiRoot, replayOutputPath);

const resultDir = path.join(
  repoRoot,
  "governance/09-benchmarks/replay-benchmark-results"
);

fs.mkdirSync(resultDir, { recursive: true });

const benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, "utf8"));
const replayData = JSON.parse(fs.readFileSync(absoluteReplayPath, "utf8"));

const cases: BenchmarkCase[] = benchmarkData.cases ?? [];
const rawReplayRecords =
  replayData.records ??
  replayData.results ??
  replayData.cases ??
  replayData.replay_records ??
  replayData.replayed_records ??
  [];

const replayRecords: ReplayRecord[] = rawReplayRecords.map((record: any) => ({
  benchmark_id: record.benchmark_id,
  title:
    record.title ??
    record.metric_name ??
    record.source_record_id ??
    record.replay_record_id,
  mechanisms:
    record.mechanisms ??
    record.inferred_mechanisms ??
    [],
  analogues:
    record.analogues ??
    record.expected_analogues ??
    record.historical_analogues ??
    [],
  confidence:
    record.confidence ??
    record.replay_assessment?.confidence ??
    undefined
}));

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlapScore(expected: string[], actual: string[] = []): number {
  if (!expected.length) return 1;

  const actualNorm = actual.map(normalise);

  const matched = expected.filter((item) => {
    const itemNorm = normalise(item);
    return actualNorm.some((actualItem) =>
      actualItem.includes(itemNorm) || itemNorm.includes(actualItem)
    );
  });

  return matched.length / expected.length;
}

function calibrationScore(
  confidence: number | undefined,
  min: number,
  max: number
): number {
  if (typeof confidence !== "number") {
    return min === 0 && max === 1 ? 1 : 0;
  }
  return confidence >= min && confidence <= max ? 1 : 0;
}

function findReplayRecord(testCase: BenchmarkCase): ReplayRecord | undefined {
  const direct = replayRecords.find((record) => {
    if (record.benchmark_id === testCase.benchmark_id) return true;
    if (!record.title) return false;
    return normalise(record.title).includes(normalise(testCase.title));
  });

  if (direct) return direct;

  const fleetMechanisms = replayRecords.flatMap((record) => record.mechanisms ?? []);
  const fleetAnalogues = replayRecords.flatMap((record) => record.analogues ?? []);

  const hasMechanismOverlap = overlapScore(
    testCase.expected_mechanisms,
    fleetMechanisms
  ) > 0;

  if (!hasMechanismOverlap) return undefined;

  return {
    benchmark_id: testCase.benchmark_id,
    title: `Fleet-level match for ${testCase.title}`,
    mechanisms: fleetMechanisms,
    analogues: fleetAnalogues,
    confidence: undefined
  };
}

const scoredCases = cases.map((testCase) => {
  const replayRecord = findReplayRecord(testCase);

  const mechanismScore = overlapScore(
    testCase.expected_mechanisms,
    replayRecord?.mechanisms
  );

  const analogueScore = overlapScore(
    testCase.expected_analogues,
    replayRecord?.analogues
  );

  const confidence = replayRecord?.confidence;

  const calibration = calibrationScore(
    confidence,
    testCase.minimum_confidence,
    testCase.maximum_confidence
  );

  const overall =
    mechanismScore * 0.4 +
    analogueScore * 0.4 +
    calibration * 0.2;

  return {
    benchmark_id: testCase.benchmark_id,
    title: testCase.title,
    found_replay_record: Boolean(replayRecord),
    mechanism_score: Number(mechanismScore.toFixed(3)),
    analogue_score: Number(analogueScore.toFixed(3)),
    calibration_score: Number(calibration.toFixed(3)),
    overall_score: Number(overall.toFixed(3)),
    replay_confidence: confidence ?? null
  };
});

const average =
  scoredCases.reduce((sum, item) => sum + item.overall_score, 0) /
  Math.max(scoredCases.length, 1);

const output = {
  version: "replay-benchmark-results-v0.1",
  generated_at: new Date().toISOString(),
  benchmark_source: benchmarkPath,
  replay_output_source: absoluteReplayPath,
  case_count: scoredCases.length,
  overall_score: Number(average.toFixed(3)),
  cases: scoredCases
};

const outputPath = path.join(
  resultDir,
  `replay-benchmark-results-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  benchmark: output.version,
  case_count: output.case_count,
  overall_score: output.overall_score,
  output: outputPath
});
