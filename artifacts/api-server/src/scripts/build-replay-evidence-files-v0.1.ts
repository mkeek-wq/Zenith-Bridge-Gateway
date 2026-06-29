import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-wave-1-readiness-gate-v0.1.json";

const WAVE_PACK =
  "data/replay/replay-wave-1-pack-v0.1.json";

const OUTPUT_DIR =
  "data/replay/wave-1/evidence-files";

const INDEX_OUTPUT =
  "data/replay/wave-1/replay-evidence-file-index-v0.1.json";

function main() {
  const gate = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const pack = JSON.parse(
    fs.readFileSync(path.join(ROOT, WAVE_PACK), "utf8")
  );

  const readyIds = new Set(
    (gate.gated_items ?? [])
      .filter((g: any) => g.readiness_status === "ready_for_replay_evidence_file")
      .map((g: any) => g.case_id)
  );

  const readyItems = (pack.wave_items ?? []).filter((item: any) =>
    readyIds.has(item.case_id)
  );

  fs.mkdirSync(path.join(ROOT, OUTPUT_DIR), { recursive: true });

  const files = readyItems.map((item: any) => {
    const evidenceFile = {
      evidence_file_version: "replay-evidence-file-v0.1",
      generated_at: new Date().toISOString(),
      case_id: item.case_id,
      wave_id: item.wave_id,
      domain: item.domain,
      period: item.period,
      priority: item.priority,
      evidence_status: "skeleton_created_needs_evidence_population",
      replay_execution_status: "not_ready_for_execution",
      no_future_leakage_guard: {
        enabled: true,
        rule:
          "Only use evidence published at or before the replay decision date or replay period cutoff.",
        publication_date_required: true,
        future_dated_records_block_execution: true,
      },
      candidate_mechanisms: item.candidate_mechanisms,
      required_signals: item.expected_signals.map((signal: string) => ({
        signal,
        source_status: "not_mapped",
        evidence_records: [],
      })),
      required_manual_fields_before_execution: [
        "source_name",
        "source_url_or_reference",
        "publication_date",
        "observed_period",
        "value_or_qualitative_finding",
        "lineage_note",
      ],
      governance_note:
        "This file is a replay evidence skeleton only. It is not evidence until populated, sourced, date-checked, and lineage-reviewed.",
    };

    const fileName = `${item.case_id}-replay-evidence-v0.1.json`;
    const relativePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(
      path.join(ROOT, relativePath),
      JSON.stringify(evidenceFile, null, 2)
    );

    return {
      case_id: item.case_id,
      domain: item.domain,
      period: item.period,
      evidence_file: relativePath,
      evidence_status: evidenceFile.evidence_status,
      replay_execution_status: evidenceFile.replay_execution_status,
    };
  });

  const index = {
    index_version: "replay-evidence-file-index-v0.1",
    generated_at: new Date().toISOString(),
    source_gate: INPUT,
    source_pack: WAVE_PACK,
    files_created: files.length,
    output_dir: OUTPUT_DIR,
    files,
  };

  fs.writeFileSync(
    path.join(ROOT, INDEX_OUTPUT),
    JSON.stringify(index, null, 2)
  );

  console.log({
    index_version: index.index_version,
    files_created: index.files_created,
    output_dir: OUTPUT_DIR,
    index_output: INDEX_OUTPUT,
  });

  for (const file of files) {
    console.log(`${file.case_id} | ${file.evidence_file}`);
  }
}

main();
