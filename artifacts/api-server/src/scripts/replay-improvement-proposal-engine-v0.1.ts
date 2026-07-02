import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const completenessPath = path.join(
  ROOT,
  "data/replay/case-completeness-report-v0.1.json"
);

const outputPath = path.join(
  ROOT,
  "data/replay/replay-improvement-proposals-v0.1.json"
);

const completeness = JSON.parse(
  fs.readFileSync(completenessPath, "utf8")
);

const proposals: any[] = [];

for (const c of completeness.cases ?? []) {
  if (c.completeness_score < 0.8) {
    proposals.push({
      proposal_id: `REPLAY_PROP_CASE_${c.case_id}`,
      type: "case_enrichment",
      priority: c.completeness_score < 0.5 ? "high" : "medium",
      target_case_id: c.case_id,
      title: c.title,
      recommended_action:
        `Enrich case ${c.case_id} by adding: ${c.missing_fields.join(", ")}.`,
      status: "awaiting_papa_approval",
      rationale: {
        completeness_score: c.completeness_score,
        missing_fields: c.missing_fields,
      },
    });
  }
}

const output = {
  proposal_package_version: "replay-improvement-proposals-v0.1",
  generated_at: new Date().toISOString(),
  proposal_count: proposals.length,
  doctrine:
    "Proposals require Papa approval before implementation.",
  proposals,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  output: outputPath,
  proposal_count: output.proposal_count,
});
