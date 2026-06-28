import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const auditPath = path.join(
  apiRoot,
  "data/replay/audit/replay-case-audit-v0.1.json"
);

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

const topWarnings = new Map<string, number>();

for (const item of audit.audits ?? []) {
  for (const warning of item.warnings ?? []) {
    topWarnings.set(warning, (topWarnings.get(warning) ?? 0) + 1);
  }
}

const warning_summary = [...topWarnings.entries()]
  .map(([warning, count]) => ({ warning, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

const output = {
  version: "replay-audit-summary-v0.1",
  generated_at: new Date().toISOString(),
  case_count: audit.case_count,
  pass_count: audit.pass_count,
  pass_with_warnings_count: audit.pass_with_warnings_count,
  blocked_count: audit.blocked_count,
  average_audit_score: audit.average_audit_score,
  warning_summary,
  recommendation:
    audit.blocked_count > 0
      ? "Resolve blockers before promotion."
      : audit.pass_with_warnings_count > 0
        ? "Proceed only with human review; prioritize depth enrichment and source attachment."
        : "Audit clean."
};

const outputPath = path.join(
  apiRoot,
  "data/replay/audit/replay-audit-summary-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
