import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const registry =
  readJsonSafe(path.join(ROOT, "data/replay/replay-case-registry-v0.1.json")) || {};

const latestReplay =
  readJsonSafe(path.join(ROOT, "data/replay/output/replay-executor-dry-run-v0.1.json")) || {};

const latestEvaluation =
  readJsonSafe(path.join(ROOT, "data/replay/evaluations/replay-evaluation-report-v0.1.json")) || {};

const replayCases: any[] = registry.replay_cases || [];

const scoreboardItems = replayCases.map((c) => {
  const isLatestManufacturing =
    c.case_id === "SG-MANUFACTURING-2020" &&
    latestReplay.execution_status === "replay_dry_run_completed";

  const detectedMechanisms = isLatestManufacturing
    ? Object.keys(latestReplay.summary?.mechanism_counts || {})
    : [];

  const expectedMechanisms = c.expected_mechanisms || [];

  const matchedExpected = expectedMechanisms.filter((m: string) =>
    detectedMechanisms.includes(m)
  );

  const missingExpected = expectedMechanisms.filter((m: string) =>
    !detectedMechanisms.includes(m)
  );

  const unexpectedMechanisms = detectedMechanisms.filter((m: string) =>
    !expectedMechanisms.includes(m)
  );

  return {
    case_id: c.case_id,
    case_label: c.case_label,
    country: c.country,
    domain: c.domain,
    period_start: c.period_start,
    period_end: c.period_end,
    replay_status: isLatestManufacturing ? "completed" : "not_yet_replayed",
    input_exists: c.input_exists,
    expected_mechanisms: expectedMechanisms,
    detected_mechanisms: detectedMechanisms,
    matched_expected_mechanisms: matchedExpected,
    missing_expected_mechanisms: missingExpected,
    unexpected_mechanisms: unexpectedMechanisms,
    mechanism_match_ratio:
      expectedMechanisms.length > 0
        ? Number((matchedExpected.length / expectedMechanisms.length).toFixed(3))
        : 0,
    replay_quality_score: isLatestManufacturing
      ? latestEvaluation.scores?.replay_quality_score ?? null
      : null,
    governance_score: isLatestManufacturing
      ? latestEvaluation.scores?.governance_score ?? null
      : null,
    production_records_written: isLatestManufacturing
      ? latestReplay.summary?.production_records_written ?? null
      : null,
    scoreboard_status:
      isLatestManufacturing
        ? "score_available"
        : c.input_exists
          ? "awaiting_replay"
          : "awaiting_input"
  };
});

const output = {
  registry_version: "replay-case-scoreboard-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    scoreboard_tracks_replay_performance_not_truth: true,
    expected_mechanisms_are_calibration_targets: true,
    replay_scores_do_not_validate_mechanisms: true
  },
  summary: {
    cases_scored: scoreboardItems.length,
    completed_cases: scoreboardItems.filter((x) => x.replay_status === "completed").length,
    awaiting_replay: scoreboardItems.filter((x) => x.scoreboard_status === "awaiting_replay").length,
    awaiting_input: scoreboardItems.filter((x) => x.scoreboard_status === "awaiting_input").length
  },
  scoreboard_items: scoreboardItems
};

ensureDir(path.join(ROOT, "data/replay"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/replay-case-scoreboard-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/replay/replay-case-scoreboard-v0.1.json"
});

console.table(
  scoreboardItems.map((s) => ({
    case_id: s.case_id,
    status: s.scoreboard_status,
    match_ratio: s.mechanism_match_ratio,
    quality: s.replay_quality_score,
    production_written: s.production_records_written
  }))
);
