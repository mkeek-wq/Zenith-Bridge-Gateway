import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const proposalId = process.argv[2];
const reason = process.argv.slice(3).join(" ") || "Rejected by Papa.";

if (!proposalId) {
  console.error("Missing proposal_id.");
  console.error("Usage: pnpm replay:reject <proposal_id> <reason>");
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const proposal = (registry.proposals ?? []).find(
  (p: any) => p.proposal_id === proposalId
);

if (!proposal) {
  console.error(`Proposal not found: ${proposalId}`);
  process.exit(1);
}

if (proposal.production_status === "promoted") {
  console.error(`Cannot reject already promoted proposal: ${proposalId}`);
  process.exit(1);
}

proposal.approval_status = "rejected";
proposal.rejected_by = "Papa";
proposal.rejected_at = new Date().toISOString();
proposal.rejection_reason = reason;
proposal.registry_status = "rejected";
proposal.implementation_status = "rejected";
proposal.audit_status = "not_required";
proposal.production_status = "not_promoted";

registry.updated_at = new Date().toISOString();

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log({
  proposal_id: proposal.proposal_id,
  approval_status: proposal.approval_status,
  rejected_by: proposal.rejected_by,
  rejection_reason: proposal.rejection_reason,
});
