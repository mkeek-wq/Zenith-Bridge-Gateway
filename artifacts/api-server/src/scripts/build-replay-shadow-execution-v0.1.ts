import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/replay-shadow-execution-report-v0.1.json"
);

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const proposals = registry.proposals ?? [];

const shadowReady = proposals.filter(
  (p: any) =>
    p.approval_status === "approved" &&
    p.implementation_status === "not_started"
);

const shadowRuns = shadowReady.map((p: any, index: number) => ({
  shadow_run_id: `REPLAY_SHADOW_${String(index + 1).padStart(3, "0")}`,
  proposal_id: p.proposal_id,
  proposal_type: p.type,
  target_case_id: p.target_case_id ?? null,
  priority: p.priority,
  status: "shadow_completed",
  mode: "dry_run_only",
  production_write: false,
  recommended_action: p.recommended_action,
  simulated_actions: [
    `Would execute proposal ${p.proposal_id} in shadow mode.`,
    p.target_case_id
      ? `Would enrich case ${p.target_case_id}.`
      : "Would execute non-case proposal target.",
    "Would produce audit evidence before any production promotion.",
  ],
  go_no_go_recommendation: "go_for_audit",
  audit_required: true,
  production_promotion_allowed: false,
}));

const report = {
  report_version: "replay-shadow-execution-report-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Shadow execution is dry-run only. No production data is modified. Audit is required before promotion.",
  source_registry: "data/replay/replay-proposal-registry-v0.1.json",
  shadow_ready_count: shadowReady.length,
  shadow_run_count: shadowRuns.length,
  shadow_runs: shadowRuns,
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log({
  output: outputPath,
  shadow_ready_count: report.shadow_ready_count,
  shadow_run_count: report.shadow_run_count,
});
