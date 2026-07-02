import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const dashboardPath = path.join(
  ROOT,
  "data/replay/replay-proposal-dashboard-v0.1.json"
);

const shadowPath = path.join(
  ROOT,
  "data/replay/replay-shadow-execution-report-v0.1.json"
);

const auditPath = path.join(
  ROOT,
  "data/replay/replay-audit-report-v0.1.json"
);

const promotionPath = path.join(
  ROOT,
  "data/replay/replay-production-promotion-report-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/replay-governance-history-v0.1.json"
);

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJsonIfExists(registryPath);
const dashboard = readJsonIfExists(dashboardPath);
const shadow = readJsonIfExists(shadowPath);
const audit = readJsonIfExists(auditPath);
const promotion = readJsonIfExists(promotionPath);

const proposals = registry?.proposals ?? [];

const events: any[] = [];

for (const p of proposals) {
  events.push({
    event_type: "proposal_registered",
    proposal_id: p.proposal_id,
    target_case_id: p.target_case_id ?? null,
    timestamp: p.created_at ?? registry?.created_at ?? null,
    status: p.registry_status ?? null,
  });

  if (p.approved_at) {
    events.push({
      event_type: "proposal_approved",
      proposal_id: p.proposal_id,
      timestamp: p.approved_at,
      actor: p.approved_by ?? "unknown",
    });
  }

  if (p.rejected_at) {
    events.push({
      event_type: "proposal_rejected",
      proposal_id: p.proposal_id,
      timestamp: p.rejected_at,
      actor: p.rejected_by ?? "unknown",
      reason: p.rejection_reason ?? null,
    });
  }

  if (p.promoted_at) {
    events.push({
      event_type: "proposal_promoted",
      proposal_id: p.proposal_id,
      timestamp: p.promoted_at,
      actor: p.promoted_by ?? "unknown",
      production_status: p.production_status,
    });
  }
}

for (const run of shadow?.shadow_runs ?? []) {
  events.push({
    event_type: "shadow_run",
    proposal_id: run.proposal_id,
    shadow_run_id: run.shadow_run_id,
    timestamp: shadow.generated_at,
    status: run.status,
    production_write: run.production_write,
  });
}

for (const a of audit?.audits ?? []) {
  events.push({
    event_type: "audit_completed",
    proposal_id: a.proposal_id,
    audit_id: a.audit_id,
    timestamp: audit.generated_at,
    status: a.status,
    recommendation: a.recommendation,
    production_promotion_allowed: a.production_promotion_allowed,
  });
}

events.sort((a, b) =>
  String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""))
);

const history = {
  history_version: "replay-governance-history-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Governance history records proposal, approval, rejection, shadow, audit, and promotion events.",
  source_files: {
    registry: "data/replay/replay-proposal-registry-v0.1.json",
    dashboard: fs.existsSync(dashboardPath)
      ? "data/replay/replay-proposal-dashboard-v0.1.json"
      : null,
    shadow: fs.existsSync(shadowPath)
      ? "data/replay/replay-shadow-execution-report-v0.1.json"
      : null,
    audit: fs.existsSync(auditPath)
      ? "data/replay/replay-audit-report-v0.1.json"
      : null,
    promotion: fs.existsSync(promotionPath)
      ? "data/replay/replay-production-promotion-report-v0.1.json"
      : null,
  },
  summary: {
    proposal_count: dashboard?.proposal_count ?? proposals.length,
    awaiting_papa_approval:
      dashboard?.approval_summary?.awaiting_papa_approval ?? null,
    approved: dashboard?.approval_summary?.approved ?? null,
    rejected: dashboard?.approval_summary?.rejected ?? null,
    promoted: dashboard?.production_summary?.promoted ?? null,
    shadow_runs: shadow?.shadow_run_count ?? 0,
    audits: audit?.audit_count ?? 0,
  },
  event_count: events.length,
  events,
};

fs.writeFileSync(outputPath, JSON.stringify(history, null, 2));

console.log({
  output: outputPath,
  event_count: history.event_count,
  summary: history.summary,
});
