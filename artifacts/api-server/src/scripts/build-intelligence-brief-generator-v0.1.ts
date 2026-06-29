import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const caseData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const evolutionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-evolution-engine-v0.1.json")) || {};

const triggerData =
  readJsonSafe(path.join(ROOT, "data/intelligence/monitoring-trigger-engine-v0.1.json")) || {};

const contradictionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const discoveryData =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || {};
const triggers: any[] = triggerData.monitoring_triggers || [];
const contradictions: any[] = contradictionData.contradictions || [];
const discoveries: any[] = discoveryData.discovery_candidates || [];
const mechanisms: any[] = currentCase.mechanism_summary || [];
const topEvidence: any[] = currentCase.evidence_summary?.top_evidence || [];

const leadingMechanism =
  mechanisms
    .slice()
    .sort((a, b) => Number(b.promotion_score ?? 0) - Number(a.promotion_score ?? 0))[0] || null;

const topContradiction =
  contradictions
    .slice()
    .sort((a, b) => Number(b.contradiction_strength ?? 0) - Number(a.contradiction_strength ?? 0))[0] || null;

const candidateDiscoveries = discoveries.filter((d) => d.discovery_status === "candidate_discovery");

const briefLines: string[] = [];

briefLines.push(`# SMURF Intelligence Brief v0.1`);
briefLines.push("");
briefLines.push(`Generated: ${new Date().toISOString()}`);
briefLines.push("");
briefLines.push(`## Current Assessment`);
briefLines.push("");
briefLines.push(currentCase.summary_assessment || "No current case assessment available.");
briefLines.push("");
briefLines.push(`- Case confidence: ${currentCase.case_confidence_score ?? "n/a"} (${currentCase.case_confidence_band ?? "unknown"})`);
briefLines.push(`- Recommended posture: ${currentCase.recommended_posture ?? "unknown"}`);
briefLines.push(`- Case status: ${currentCase.case_status ?? "unknown"}`);
briefLines.push("");

briefLines.push(`## Leading Mechanism`);
briefLines.push("");

if (leadingMechanism) {
  briefLines.push(`- ${leadingMechanism.mechanism_name}`);
  briefLines.push(`- Confidence: ${leadingMechanism.adjusted_confidence_score}`);
  briefLines.push(`- Replay support: ${leadingMechanism.replay_support_score}`);
  briefLines.push(`- Promotion status: ${leadingMechanism.promotion_status}`);
  briefLines.push(`- Lifecycle status: ${leadingMechanism.lifecycle_status}`);
} else {
  briefLines.push("- No leading mechanism available.");
}

briefLines.push("");

briefLines.push(`## Top Evidence Signals`);
briefLines.push("");

for (const e of topEvidence.slice(0, 8)) {
  briefLines.push(
    `- ${e.metric_name} (${e.period}): ${e.direction}, score ${e.evidence_score}, status ${e.status}`
  );
}

briefLines.push("");

briefLines.push(`## Contradictions`);
briefLines.push("");

briefLines.push(`- Total contradictions found: ${contradictionData.summary?.contradictions_found ?? 0}`);
briefLines.push(`- Strong contradictions: ${contradictionData.summary?.strong_contradictions ?? 0}`);

if (topContradiction) {
  briefLines.push(
    `- Highest contradiction: ${topContradiction.evidence_bucket}, strength ${topContradiction.contradiction_strength}, band ${topContradiction.contradiction_band}`
  );
}

briefLines.push("");

briefLines.push(`## Candidate Discoveries`);
briefLines.push("");

if (candidateDiscoveries.length) {
  for (const d of candidateDiscoveries) {
    briefLines.push(
      `- ${d.suggested_mechanism_name}: discovery score ${d.discovery_score}, matched evidence ${d.evidence_items_matched}`
    );
  }
} else {
  briefLines.push("- No candidate discoveries.");
}

briefLines.push("");

briefLines.push(`## Priority Monitoring Triggers`);
briefLines.push("");

for (const t of triggers.slice(0, 10)) {
  briefLines.push(
    `- ${t.metric_name} | ${t.trigger_type} | ${t.trigger_band} | ${t.monitoring_frequency}`
  );
}

briefLines.push("");

briefLines.push(`## Case Evolution`);
briefLines.push("");

briefLines.push(
  evolutionData.previous_snapshot_found
    ? `- Previous snapshot found. Changes detected: ${evolutionData.evolution_summary?.changes_detected ?? 0}`
    : "- No previous snapshot found. Current case is baseline."
);

briefLines.push("");

briefLines.push(`## Governance Note`);
briefLines.push("");
briefLines.push(
  "This brief is a monitoring assessment. It is not a prediction, not investment advice, not an automated validation decision, and not a lifecycle mutation instruction. Evidence remains primary; mechanisms remain challengeable."
);

const markdown = briefLines.join("\n");

const output = {
  registry_version: "intelligence-brief-generator-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    brief_is_monitoring_assessment_not_prediction: true,
    evidence_remains_primary: true,
    mechanisms_are_challengeable: true,
    human_review_required_for_action: true,
  },
  inputs: {
    case_available: Boolean(currentCase.case_id),
    triggers: triggers.length,
    contradictions: contradictions.length,
    discoveries: discoveries.length,
    mechanisms: mechanisms.length,
    top_evidence: topEvidence.length,
  },
  brief: {
    title: "SMURF Intelligence Brief v0.1",
    case_id: currentCase.case_id || null,
    generated_at: new Date().toISOString(),
    case_confidence_score: currentCase.case_confidence_score ?? null,
    recommended_posture: currentCase.recommended_posture ?? null,
    leading_mechanism: leadingMechanism?.mechanism_name || null,
    top_contradiction: topContradiction?.evidence_bucket || null,
    candidate_discoveries: candidateDiscoveries.map((d) => d.suggested_mechanism_name),
    markdown,
  },
};

ensureDir(path.join(ROOT, "data/intelligence"));
ensureDir(path.join(ROOT, "exports/intelligence-briefs"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/intelligence-brief-generator-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/intelligence-briefs/smurf-intelligence-brief-v0.1.md"),
  markdown
);

console.log({
  engine_version: output.registry_version,
  case_id: output.brief.case_id,
  recommended_posture: output.brief.recommended_posture,
  leading_mechanism: output.brief.leading_mechanism,
  output_json: "data/intelligence/intelligence-brief-generator-v0.1.json",
  output_markdown: "exports/intelligence-briefs/smurf-intelligence-brief-v0.1.md",
});

console.log("\n--- Brief Preview ---\n");
console.log(markdown.split("\n").slice(0, 60).join("\n"));
