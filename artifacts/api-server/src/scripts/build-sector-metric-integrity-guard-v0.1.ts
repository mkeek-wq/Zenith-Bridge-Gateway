import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const inputPath = path.join(root, "inputs/article-generator/sector-performance-input-v0.1.json");
const input = readJson(inputPath);

const metrics = input.metrics ?? [];

const placeholderValues = new Set(["REAL_VALUE_HERE", "TO_BE_RETRIEVED", "TBD", ""]);
const knownTestValues = new Set([111, 222, 333]);

const findings = metrics.map((m: any) => {
  const issues: string[] = [];
  const warnings: string[] = [];

  const verified = m.verification_status === "verified_manual_entry";
  const pending = m.verification_status === "awaiting_official_value";

  if (!m.sector) issues.push("missing_sector");
  if (!m.period) issues.push("missing_period");
  if (!m.metric) issues.push("missing_metric");
  if (!m.source_url && verified) issues.push("missing_source_url");
  if (!m.source_name && verified) issues.push("missing_source_name");

  if (m.value === null || m.value === undefined) {
    pending ? warnings.push("pending_value_not_yet_available") : issues.push("missing_value");
  }

  if (placeholderValues.has(String(m.value))) issues.push("placeholder_value");
  if (knownTestValues.has(Number(m.value))) issues.push("known_pipeline_test_value");

  if (verified && !Number.isFinite(Number(m.value))) {
    issues.push("verified_record_has_non_numeric_value");
  }

  if (verified && issues.length > 0) {
    issues.push("verified_record_has_integrity_issues");
  }

  return {
    sector: m.sector,
    metric: m.metric,
    period: m.period,
    value: m.value,
    verification_status: m.verification_status,
    issues,
    warnings,
    blocking: verified && issues.length > 0,
    integrity_passed: !(verified && issues.length > 0)
  };
});

const blockingFindings = findings.filter((f: any) => f.blocking);

const output = {
  guard_version: "sector-metric-integrity-guard-v0.1",
  generated_at: new Date().toISOString(),
  source_input: inputPath,
  total_metrics_checked: findings.length,
  integrity_passed: blockingFindings.length === 0,
  blocking_findings: blockingFindings.length,
  findings,
  governance_rules: [
    "Pending metrics may remain in the input file as data needs.",
    "Only verified records can become institutional blockers.",
    "Placeholder values may not be promoted.",
    "Known pipeline test values may not be used in publication.",
    "Verified records must have numeric value, sector, period, metric, source name, and source URL."
  ]
};

const outPath = path.join(root, "exports/article-generator/sector-metric-integrity-guard-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  guard_version: output.guard_version,
  total_metrics_checked: output.total_metrics_checked,
  integrity_passed: output.integrity_passed,
  blocking_findings: output.blocking_findings,
  output: outPath
});

if (!output.integrity_passed) {
  process.exitCode = 1;
}
