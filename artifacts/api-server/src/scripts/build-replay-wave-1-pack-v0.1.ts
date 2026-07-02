import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-evidence-mapping-queue-v0.1.json";

const OUTPUT =
  "data/replay/replay-wave-1-pack-v0.1.json";

function main() {
  const queueData = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const readyCases = (queueData.queue ?? []).filter(
    (q: any) => q.mapping_status === "ready_for_evidence_mapping"
  );

  const waveItems = readyCases.map((q: any, index: number) => ({
    wave_id: "replay-wave-1",
    sequence: index + 1,
    case_id: q.case_id,
    domain: q.domain,
    period: q.period,
    priority: q.priority,
    candidate_mechanisms: q.candidate_mechanisms,
    expected_signals: q.expected_signals,
    replay_pack_status: "ready_for_evidence_mapping",
    execution_status: "not_started",
    governance_note:
      "Wave 1 includes only cases classified as ready_for_evidence_mapping. Execution still requires evidence file creation and publication-date checks.",
  }));

  const output = {
    pack_version: "replay-wave-1-pack-v0.1",
    generated_at: new Date().toISOString(),
    source_queue: INPUT,
    wave_id: "replay-wave-1",
    wave_size: waveItems.length,
    included_status: "ready_for_evidence_mapping",
    excluded_cases: (queueData.queue ?? []).length - waveItems.length,
    wave_items: waveItems,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    pack_version: output.pack_version,
    wave_id: output.wave_id,
    wave_size: output.wave_size,
    excluded_cases: output.excluded_cases,
    output: OUTPUT,
  });

  for (const item of waveItems) {
    console.log(`${item.sequence} | ${item.case_id} | ${item.domain}`);
  }
}

main();
