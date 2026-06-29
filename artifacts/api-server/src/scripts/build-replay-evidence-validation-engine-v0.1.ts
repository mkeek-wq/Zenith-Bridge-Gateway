import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/evidence-files/SG-NODX-2023-replay-evidence-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/SG-NODX-2023-evidence-validation-v0.1.json";

function validDate(value: string): boolean {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function main() {
  const file = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const decisionDate = file.replay_decision_date;

  const checks = (file.evidence_records ?? []).map((record: any) => {
    const hasSource = Boolean(record.source_name);
    const hasPublicationDate = validDate(record.publication_date);
    const hasObservedPeriod = Boolean(record.observed_period);
    const hasLineage = Boolean(record.lineage_note);
    const publicationBeforeDecision =
      hasPublicationDate && validDate(decisionDate)
        ? new Date(record.publication_date) <= new Date(decisionDate)
        : false;

    const passed =
      hasSource &&
      hasPublicationDate &&
      hasObservedPeriod &&
      hasLineage &&
      publicationBeforeDecision;

    return {
      evidence_id: record.evidence_id,
      metric: record.metric,
      has_source: hasSource,
      has_publication_date: hasPublicationDate,
      has_observed_period: hasObservedPeriod,
      has_lineage: hasLineage,
      publication_before_decision_date: publicationBeforeDecision,
      validation_status: passed ? "passed" : "failed"
    };
  });

  const failed = checks.filter((c: any) => c.validation_status === "failed");

  const output = {
    validation_version: "replay-evidence-validation-engine-v0.1",
    generated_at: new Date().toISOString(),
    case_id: file.case_id,
    replay_decision_date: decisionDate,
    records_checked: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    governance_status:
      failed.length === 0
        ? "READY_FOR_SINGLE_CASE_REPLAY"
        : "BLOCKED_EVIDENCE_VALIDATION_FAILED",
    checks
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    validation_version: output.validation_version,
    case_id: output.case_id,
    records_checked: output.records_checked,
    passed: output.passed,
    failed: output.failed,
    governance_status: output.governance_status,
    output: OUTPUT
  });
}

main();
