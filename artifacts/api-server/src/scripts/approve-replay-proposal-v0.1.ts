import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const proposalId = process.argv[2];

if (!proposalId) {
  console.error("Missing proposal_id.");
  console.error("Usage: pnpm replay:approve <proposal_id>");
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const proposals = registry.proposals ?? [];

const proposal = proposals.find((p: any) => p.proposal_id === proposalId);

if (!proposal) {
  console.error(`Proposal not found: ${proposalId}`);
  process.exit(1);
}

proposal.approval_status = "approved";
proposal.approved_by = "Papa";
proposal.approved_at = new Date().toISOString();
proposal.registry_status = "approved";
proposal.implementation_status = "not_started";
proposal.audit_status = "not_audited";
proposal.production_status = "not_promoted";

registry.updated_at = new Date().toISOString();

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log({
  proposal_id: proposal.proposal_id,
  approval_status: proposal.approval_status,
  approved_by: proposal.approved_by,
  implementation_status: proposal.implementation_status,
});
