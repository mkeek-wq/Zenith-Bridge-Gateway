import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const registryPath = path.join(
  root,
  "data/intelligence/verified-dataset-registry-v0.1.json"
);

const outputPath = path.join(
  root,
  "data/intelligence/dataset-audit-report-v0.1.json"
);

function readJsonIfExists(filePath: string, fallback: any) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function existsIfPresent(filePath: string | null | undefined) {
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

function pctChange(previous: number, current: number) {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function auditDataset(dataset: any) {
  const warnings: string[] = [];
  const blockers: string[] = [];
  const observations: string[] = [];

  const values = Array.isArray(dataset.values) ? dataset.values : [];

  if (!dataset.dataset_id) blockers.push("missing_dataset_id");
  if (!dataset.name) warnings.push("missing_dataset_name");
  if (!dataset.source_url) warnings.push("missing_source_url");
  if (!dataset.source_metadata) warnings.push("missing_source_metadata");
  if (!dataset.coverage_start || !dataset.coverage_end) warnings.push("missing_coverage");
  if (values.length === 0) blockers.push("no_values");

  const numericValues = values.filter(
    (item: any) => typeof item.value === "number" && Number.isFinite(item.value)
  );

  if (numericValues.length !== values.length) {
    warnings.push("non_numeric_or_missing_values_present");
  }

  if (numericValues.length < 3) {
    warnings.push("too_few_values_for_outlier_check");
  }

  const negativeValues = numericValues.filter((item: any) => item.value < 0);
  if (negativeValues.length > 0) {
    warnings.push("negative_values_present");
  }

  const largeJumps = [];
  for (let i = 1; i < numericValues.length; i += 1) {
    const previous = numericValues[i - 1];
    const current = numericValues[i];
    const change = pctChange(previous.value, current.value);

    if (change !== null && Math.abs(change) >= 0.35) {
      largeJumps.push({
        from_period: previous.period,
        to_period: current.period,
        previous_value: previous.value,
        current_value: current.value,
        pct_change: Number(change.toFixed(4))
      });
    }
  }

  if (largeJumps.length > 0) {
    warnings.push("large_period_to_period_jumps_detected");
  }

  if (dataset.local_file && !existsIfPresent(dataset.local_file)) {
    warnings.push("local_file_missing");
  }

  if (dataset.raw_file && !existsIfPresent(dataset.raw_file)) {
    warnings.push("raw_file_missing");
  }

  if (dataset.verification_status === "loaded_pending_review") {
    observations.push("dataset_loaded_but_not_papa_reviewed");
  }

  const audit_status =
    blockers.length > 0
      ? "FAIL"
      : warnings.length > 0
        ? "QUESTIONABLE"
        : "PASS";

  const papa_gate =
    audit_status === "PASS"
      ? "eligible_for_papa_review"
      : audit_status === "QUESTIONABLE"
        ? "requires_papa_attention"
        : "quarantine_recommended";

  return {
    dataset_id: dataset.dataset_id,
    name: dataset.name,
    data_source: dataset.preferred_sources?.[0] || null,
    content_source: dataset.source_metadata?.datasource || null,
    verification_status: dataset.verification_status,
    coverage_start: dataset.coverage_start,
    coverage_end: dataset.coverage_end,
    values_count: dataset.values_count,
    numeric_value_count: numericValues.length,
    audit_status,
    papa_gate,
    blockers,
    warnings,
    observations,
    large_jumps: largeJumps,
    znbw_truth_claim:
      "ZNBW does not certify source truth. ZNBW records source attribution and audits ingestion quality, structure, metadata, and abnormality flags.",
    production_write_allowed: false
  };
}

const registry = readJsonIfExists(registryPath, {
  version: "verified-dataset-registry-v0.1",
  datasets: []
});

const datasets = Array.isArray(registry.datasets) ? registry.datasets : [];
const audits = datasets.map(auditDataset);

const output = {
  version: "dataset-audit-report-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Dataset audit checks ingestion quality and abnormality flags. It does not certify that source-published data is objectively true.",
  safety_mode: "GOVERNANCE_GATE",
  production_write_allowed: false,
  source_files: {
    verified_dataset_registry: "data/intelligence/verified-dataset-registry-v0.1.json"
  },
  dataset_count: datasets.length,
  pass_count: audits.filter((a: any) => a.audit_status === "PASS").length,
  questionable_count: audits.filter((a: any) => a.audit_status === "QUESTIONABLE").length,
  fail_count: audits.filter((a: any) => a.audit_status === "FAIL").length,
  audits
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

console.log({
  output: outputPath,
  dataset_count: output.dataset_count,
  pass_count: output.pass_count,
  questionable_count: output.questionable_count,
  fail_count: output.fail_count
});
