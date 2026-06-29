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

const replay =
  readJsonSafe(path.join(ROOT, "data/replay/output/replay-executor-dry-run-v0.1.json")) || {};

const readiness =
  readJsonSafe(path.join(ROOT, "data/replay/replay-readiness-check-v0.1.json")) || {};

const records: any[] = replay.replayed_records || [];

const recordsWithMechanisms = records.filter((r) => r.inferred_mechanisms?.length > 0).length;
const mechanismCoverage = records.length > 0 ? recordsWithMechanisms / records.length : 0;

const governanceScore =
  replay.execution_status === "replay_dry_run_completed" &&
  readiness.replay_readiness_status === "ready_for_replay_dry_run" &&
  replay.summary?.production_records_written === 0
    ? 1
    : 0;

const replayQualityScore =
  records.length === 0
    ? 0
    : Number((mechanismCoverage * 0.6 + governanceScore * 0.4).toFixed(3));

const recommendation =
  replay.execution_status !== "replay_dry_run_completed"
    ? "NO_GO_REPLAY_BLOCKED"
    : replayQualityScore >= 0.75
      ? "REPLAY_DRY_RUN_SUCCESSFUL"
      : "REPLAY_DRY_RUN_COMPLETED_WITH_LIMITED_SIGNAL";

const lines: string[] = [];

lines.push("# Replay Evaluation Report v0.1");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## Recommendation");
lines.push("");
lines.push(`**${recommendation}**`);
lines.push("");
lines.push("## Replay Summary");
lines.push("");
lines.push(`- Replay run ID: ${replay.replay_run_id || "unknown"}`);
lines.push(`- Execution status: ${replay.execution_status || "unknown"}`);
lines.push(`- Records supplied: ${replay.inputs?.records_supplied ?? 0}`);
lines.push(`- Records replayed: ${replay.summary?.records_replayed ?? 0}`);
lines.push(`- Records with mechanisms: ${recordsWithMechanisms}`);
lines.push(`- Unique mechanisms detected: ${replay.summary?.unique_mechanisms_detected ?? 0}`);
lines.push(`- Production records written: ${replay.summary?.production_records_written ?? 0}`);
lines.push("");
lines.push("## Scores");
lines.push("");
lines.push(`- Mechanism coverage: ${Number(mechanismCoverage.toFixed(3))}`);
lines.push(`- Governance score: ${governanceScore}`);
lines.push(`- Replay quality score: ${replayQualityScore}`);
lines.push("");
lines.push("## Mechanism Counts");
lines.push("");

const mechanismCounts = replay.summary?.mechanism_counts || {};
if (Object.keys(mechanismCounts).length) {
  for (const [mechanism, count] of Object.entries(mechanismCounts)) {
    lines.push(`- ${mechanism}: ${count}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("## Governance Note");
lines.push("");
lines.push(
  "This replay was dry-run only. It did not write production evidence, did not mutate lifecycle state, and did not validate mechanisms."
);

const markdown = lines.join("\n");

const output = {
  registry_version: "replay-evaluation-report-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_evaluation_does_not_validate_mechanisms: true,
    dry_run_outputs_are_not_production: true,
    governance_score_must_remain_high_before_scale: true
  },
  replay_run_id: replay.replay_run_id || null,
  recommendation,
  scores: {
    mechanism_coverage: Number(mechanismCoverage.toFixed(3)),
    governance_score: governanceScore,
    replay_quality_score: replayQualityScore
  },
  summary: {
    records_replayed: replay.summary?.records_replayed ?? 0,
    records_with_mechanisms: recordsWithMechanisms,
    unique_mechanisms_detected: replay.summary?.unique_mechanisms_detected ?? 0,
    production_records_written: replay.summary?.production_records_written ?? null
  },
  markdown
};

ensureDir(path.join(ROOT, "data/replay/evaluations"));
ensureDir(path.join(ROOT, "exports/replay-reports"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/evaluations/replay-evaluation-report-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/replay-reports/replay-evaluation-report-v0.1.md"),
  markdown
);

console.log({
  engine_version: output.registry_version,
  replay_run_id: output.replay_run_id,
  recommendation: output.recommendation,
  scores: output.scores,
  output_json: "data/replay/evaluations/replay-evaluation-report-v0.1.json",
  output_markdown: "exports/replay-reports/replay-evaluation-report-v0.1.md"
});

console.log("\n--- Replay Evaluation Preview ---\n");
console.log(markdown);
