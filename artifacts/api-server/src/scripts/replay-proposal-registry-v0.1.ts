import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const proposalsPath = path.join(
  ROOT,
  "data/replay/replay-improvement-proposals-v0.1.json"
);

const registryPath = path.join(
  ROOT,
  "data/replay/replay-proposal-registry-v0.1.json"
);

const proposals = JSON.parse(fs.readFileSync(proposalsPath, "utf8"));

let existing: any = {
  registry_version: "replay-proposal-registry-v0.1",
  created_at: new Date().toISOString(),
  proposals: [],
};

if (fs.existsSync(registryPath)) {
  existing = JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

const knownIds = new Set(
  existing.proposals.map((p: any) => p.proposal_id)
);

for (const proposal of proposals.proposals ?? []) {
  if (!knownIds.has(proposal.proposal_id)) {
    existing.proposals.push({
      ...proposal,
      registry_status: "new",
      created_at: proposals.generated_at,
      approval_status: "awaiting_papa_approval",
      implementation_status: "not_started",
      audit_status: "not_audited",
      production_status: "not_promoted",
    });
  }
}

existing.updated_at = new Date().toISOString();
existing.proposal_count = existing.proposals.length;

fs.writeFileSync(registryPath, JSON.stringify(existing, null, 2));

console.log({
  output: registryPath,
  proposal_count: existing.proposal_count,
});
