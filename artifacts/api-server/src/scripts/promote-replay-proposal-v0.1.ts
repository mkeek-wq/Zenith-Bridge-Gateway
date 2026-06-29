import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const auditPath = path.join(
  ROOT,
  "data/replay/replay-audit-report-v0.1.json"
);

const promotionPath = path.join(
  ROOT,
  "data/replay/replay-production-promotion-report-v0.1.json"
);

const proposalId = process.argv[2];

if (!proposalId) {
  console.error("Missing proposal_id.");
  console.error("Usage: pnpm replay:promote <proposal_id>");
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

const proposal = (registry.proposals ?? []).find(
  (p: any) => p.proposal_id === proposalId
);

if (!proposal) {
  console.error(`Proposal not found: ${proposalId}`);
  process.exit(1);
}

const auditEntry = (audit.audits ?? []).find(
  (a: any) => a.proposal_id === proposalId
);

if (!auditEntry) {
  console.error(`No audit found for proposal: ${proposalId}`);
  process.exit(1);
}

if (proposal.approval_status !== "approved") {
  console.error(`Proposal is not approved: ${proposalId}`);
  process.exit(1);
}

if (
  auditEntry.status !== "passed" ||
  auditEntry.production_promotion_allowed !== true
) {
  console.error(`Audit does not allow production promotion: ${proposalId}`);
  process.exit(1);
}

proposal.production_status = "promoted";
proposal.promoted_at = new Date().toISOString();
proposal.promoted_by = "Papa";
proposal.audit_status = "passed";
proposal.implementation_status = "shadow_validated";

registry.updated_at = new Date().toISOString();

const promotionReport = {
  report_version: "replay-production-promotion-report-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Promotion records governance status only. It does not yet mutate historical case content.",
  promotion: {
    proposal_id: proposal.proposal_id,
    target_case_id: proposal.target_case_id ?? null,
    approval_status: proposal.approval_status,
    audit_status: proposal.audit_status,
    implementation_status: proposal.implementation_status,
    production_status: proposal.production_status,
    promoted_by: proposal.promoted_by,
    promoted_at: proposal.promoted_at,
  },
};

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
fs.writeFileSync(promotionPath, JSON.stringify(promotionReport, null, 2));

console.log(promotionReport.promotion);
