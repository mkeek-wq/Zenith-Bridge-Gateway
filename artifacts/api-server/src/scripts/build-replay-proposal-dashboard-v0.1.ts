import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/replay-proposal-dashboard-v0.1.json"
);

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const proposals = registry.proposals ?? [];

function countBy(field: string, value: string): number {
  return proposals.filter((p: any) => p[field] === value).length;
}

const highPriority = countBy("priority", "high");
const mediumPriority = countBy("priority", "medium");
const lowPriority = countBy("priority", "low");

const awaitingApproval = countBy("approval_status", "awaiting_papa_approval");
const approved = countBy("approval_status", "approved");
const rejected = countBy("approval_status", "rejected");

const notStarted = countBy("implementation_status", "not_started");
const shadowReady = proposals.filter(
  (p: any) =>
    p.approval_status === "approved" &&
    p.implementation_status === "not_started"
).length;

const notAudited = countBy("audit_status", "not_audited");
const notPromoted = countBy("production_status", "not_promoted");

const topProposals = proposals.slice(0, 10).map((p: any) => ({
  proposal_id: p.proposal_id,
  type: p.type,
  priority: p.priority,
  title: p.title ?? null,
  target_case_id: p.target_case_id ?? null,
  approval_status: p.approval_status,
  implementation_status: p.implementation_status,
  recommended_action: p.recommended_action,
}));

const dashboard = {
  dashboard_version: "replay-proposal-dashboard-v0.1",
  generated_at: new Date().toISOString(),
  source_registry: "data/replay/replay-proposal-registry-v0.1.json",
  proposal_count: proposals.length,
  priority_summary: {
    high: highPriority,
    medium: mediumPriority,
    low: lowPriority,
  },
  approval_summary: {
    awaiting_papa_approval: awaitingApproval,
    approved,
    rejected,
  },
  implementation_summary: {
    not_started: notStarted,
    shadow_ready: shadowReady,
  },
  audit_summary: {
    not_audited: notAudited,
  },
  production_summary: {
    not_promoted: notPromoted,
  },
  doctrine:
    "Dashboard is read-only. Approval, shadow execution, audit, and production promotion remain separate governed steps.",
  top_proposals: topProposals,
};

fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));

console.log({
  output: outputPath,
  proposal_count: dashboard.proposal_count,
  high_priority: dashboard.priority_summary.high,
  awaiting_papa_approval: dashboard.approval_summary.awaiting_papa_approval,
  shadow_ready: dashboard.implementation_summary.shadow_ready,
});
