import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-wave-1-pack-v0.1.json";

const OUTPUT =
  "data/replay/replay-wave-1-readiness-gate-v0.1.json";

function main() {
  const pack = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const gatedItems = (pack.wave_items ?? []).map((item: any) => {
    const hasSignals =
      Array.isArray(item.expected_signals) && item.expected_signals.length >= 3;

    const hasMechanisms =
      Array.isArray(item.candidate_mechanisms) &&
      item.candidate_mechanisms.length >= 1;

    const hasPeriod = Boolean(item.period);
    const hasDomain = Boolean(item.domain);

    const passed =
      hasSignals && hasMechanisms && hasPeriod && hasDomain;

    return {
      case_id: item.case_id,
      domain: item.domain,
      period: item.period,
      priority: item.priority,
      checks: {
        has_domain: hasDomain,
        has_period: hasPeriod,
        has_expected_signals: hasSignals,
        has_candidate_mechanisms: hasMechanisms,
      },
      readiness_status: passed
        ? "ready_for_replay_evidence_file"
        : "blocked_needs_definition_repair",
      next_action: passed
        ? "create_replay_evidence_file"
        : "repair_case_definition",
    };
  });

  const readyCount = gatedItems.filter(
    (i: any) => i.readiness_status === "ready_for_replay_evidence_file"
  ).length;

  const blockedCount = gatedItems.length - readyCount;

  const output = {
    gate_version: "replay-wave-1-readiness-gate-v0.1",
    generated_at: new Date().toISOString(),
    source_pack: INPUT,
    wave_id: pack.wave_id,
    cases_checked: gatedItems.length,
    ready_for_replay_evidence_file: readyCount,
    blocked: blockedCount,
    governance_status:
      blockedCount === 0
        ? "GO_FOR_REPLAY_EVIDENCE_FILE_CREATION"
        : "BLOCKED_CASE_DEFINITION_REPAIR_REQUIRED",
    gated_items: gatedItems,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    gate_version: output.gate_version,
    wave_id: output.wave_id,
    cases_checked: output.cases_checked,
    ready_for_replay_evidence_file: output.ready_for_replay_evidence_file,
    blocked: output.blocked,
    governance_status: output.governance_status,
    output: OUTPUT,
  });

  for (const item of gatedItems) {
    console.log(`${item.readiness_status} | ${item.case_id}`);
  }
}

main();
