import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const FILES = [
  "data/replay/wave-1/evidence-files/SG-GOODS-EXPORTS-2020-replay-evidence-v0.1.json",
  "data/replay/wave-1/evidence-files/SG-LABOUR-MARKET-2020-replay-evidence-v0.1.json",
  "data/replay/wave-1/evidence-files/SG-FINANCE-2020-replay-evidence-v0.1.json",
];

const OUTPUT =
  "data/replay/wave-1/wave-1-batch-evidence-validation-v0.1.json";

function validDate(value: string): boolean {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function validateFile(filePath: string) {
  const file = JSON.parse(fs.readFileSync(path.join(ROOT, filePath), "utf8"));
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
      validation_status: passed ? "passed" : "failed",
      has_source: hasSource,
      has_publication_date: hasPublicationDate,
      has_observed_period: hasObservedPeriod,
      has_lineage: hasLineage,
      publication_before_decision_date: publicationBeforeDecision,
    };
  });

  const failed = checks.filter((c: any) => c.validation_status === "failed");

  return {
    case_id: file.case_id,
    evidence_file: filePath,
    replay_decision_date: decisionDate,
    records_checked: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    governance_status:
      failed.length === 0
        ? "READY_FOR_SINGLE_CASE_REPLAY"
        : "BLOCKED_EVIDENCE_VALIDATION_FAILED",
    checks,
  };
}

function main() {
  const validations = FILES.map(validateFile);

  const output = {
    validation_version: "wave-1-batch-evidence-validation-v0.1",
    generated_at: new Date().toISOString(),
    cases_checked: validations.length,
    ready_for_replay: validations.filter(
      (v) => v.governance_status === "READY_FOR_SINGLE_CASE_REPLAY"
    ).length,
    blocked: validations.filter(
      (v) => v.governance_status !== "READY_FOR_SINGLE_CASE_REPLAY"
    ).length,
    validations,
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    validation_version: output.validation_version,
    cases_checked: output.cases_checked,
    ready_for_replay: output.ready_for_replay,
    blocked: output.blocked,
    output: OUTPUT,
  });

  for (const v of validations) {
    console.log(`${v.case_id} | ${v.governance_status}`);
  }
}

main();
