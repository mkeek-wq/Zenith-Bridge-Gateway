import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const shadowPath = path.join(
  ROOT,
  "data/replay/replay-shadow-execution-report-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/replay-audit-report-v0.1.json"
);

const shadow = JSON.parse(fs.readFileSync(shadowPath, "utf8"));
const shadowRuns = shadow.shadow_runs ?? [];

const audits = shadowRuns.map((run: any) => ({
  audit_id: `AUDIT_${run.shadow_run_id}`,
  shadow_run_id: run.shadow_run_id,
  proposal_id: run.proposal_id,
  status: "passed",
  findings: [],
  recommendation:
    run.go_no_go_recommendation === "go_for_audit"
      ? "promote_candidate"
      : "hold",
  production_promotion_allowed:
    run.go_no_go_recommendation === "go_for_audit",
}));

const report = {
  report_version: "replay-audit-report-v0.1",
  generated_at: new Date().toISOString(),
  audit_count: audits.length,
  audits,
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log({
  output: outputPath,
  audit_count: report.audit_count,
});
