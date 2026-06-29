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

const dedup =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json")) || {};

const quality =
  readJsonSafe(path.join(ROOT, "data/intelligence/brief-quality-review-engine-v0.1.json")) || {};

const triggerData =
  readJsonSafe(path.join(ROOT, "data/intelligence/monitoring-trigger-engine-v0.1.json")) || {};

const contradictionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const discoveryData =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json")) || {};

const evolutionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-evolution-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || {};
const groupedSignals: any[] = dedup.deduped_signals || [];
const triggers: any[] = triggerData.monitoring_triggers || [];
const contradictions: any[] = contradictionData.contradictions || [];
const discoveries: any[] = discoveryData.discovery_candidates || [];
const mechanisms: any[] = currentCase.mechanism_summary || [];

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

briefLines.push(`# SMURF Intelligence Brief v0.2`);
briefLines.push("");
briefLines.push(`Generated: ${new Date().toISOString()}`);
briefLines.push("");
briefLines.push(`## Executive Summary`);
briefLines.push("");
briefLines.push(currentCase.summary_assessment || "No current case assessment available.");
briefLines.push("");
briefLines.push(`Current posture: **${currentCase.recommended_posture ?? "unknown"}**.`);
briefLines.push(`Case confidence: **${currentCase.case_confidence_score ?? "n/a"} (${currentCase.case_confidence_band ?? "unknown"})**.`);
briefLines.push("");

briefLines.push(`## Leading Mechanism`);
briefLines.push("");

if (leadingMechanism) {
  briefLines.push(`The leading monitored mechanism is **${leadingMechanism.mechanism_name}**.`);
  briefLines.push("");
  briefLines.push(`- Confidence: ${leadingMechanism.adjusted_confidence_score}`);
  briefLines.push(`- Replay support: ${leadingMechanism.replay_support_score}`);
  briefLines.push(`- Promotion status: ${leadingMechanism.promotion_status}`);
  briefLines.push(`- Lifecycle status: ${leadingMechanism.lifecycle_status}`);
  briefLines.push("");
  briefLines.push(
    `Interpretation: ${leadingMechanism.interpretation || "Mechanism supports monitoring but should not drive conclusions."}`
  );
} else {
  briefLines.push("No leading mechanism available.");
}

briefLines.push("");

briefLines.push(`## Grouped Evidence Signals`);
briefLines.push("");

for (const s of groupedSignals.slice(0, 8)) {
  briefLines.push(
    `- **${s.metric_name}**: ${s.signal_band}, ${s.evidence_items} evidence items, dominant direction ${s.direction_summary?.dominant_direction}, signal score ${s.scores?.signal_strength_score}`
  );
}

briefLines.push("");

briefLines.push(`## Contradiction Watch`);
briefLines.push("");

briefLines.push(`Total contradictions detected: ${contradictionData.summary?.contradictions_found ?? 0}.`);
briefLines.push(`Strong contradictions: ${contradictionData.summary?.strong_contradictions ?? 0}.`);

if (topContradiction) {
  briefLines.push("");
  briefLines.push(
    `Highest contradiction: **${topContradiction.evidence_bucket}** with strength ${topContradiction.contradiction_strength} (${topContradiction.contradiction_band}).`
  );
  briefLines.push(
    "Interpretation: contradictory evidence should reduce certainty and increase monitoring discipline."
  );
}

briefLines.push("");

briefLines.push(`## Candidate Discoveries`);
briefLines.push("");

if (candidateDiscoveries.length) {
  for (const d of candidateDiscoveries) {
    briefLines.push(
      `- **${d.suggested_mechanism_name}**: discovery score ${d.discovery_score}, matched evidence ${d.evidence_items_matched}.`
    );
  }
} else {
  briefLines.push("No candidate discoveries detected.");
}

briefLines.push("");

briefLines.push(`## Priority Monitoring Triggers`);
briefLines.push("");

for (const t of triggers.slice(0, 10)) {
  briefLines.push(
    `- **${t.metric_name}** — ${t.trigger_type}, ${t.trigger_band}, ${t.monitoring_frequency}.`
  );
}

briefLines.push("");

briefLines.push(`## Case Evolution`);
briefLines.push("");

briefLines.push(
  evolutionData.previous_snapshot_found
    ? `Previous snapshot found. Changes detected: ${evolutionData.evolution_summary?.changes_detected ?? 0}.`
    : "No previous snapshot found. Current case is the baseline."
);

briefLines.push("");

briefLines.push(`## Brief Quality`);
briefLines.push("");

briefLines.push(
  `Previous brief quality review: ${quality.brief_metrics?.quality_band ?? "unknown"} with score ${quality.brief_metrics?.quality_score ?? "n/a"}.`
);
briefLines.push("v0.2 uses grouped evidence signals to reduce repeated metric rows.");

briefLines.push("");

briefLines.push(`## Governance Note`);
briefLines.push("");
briefLines.push(
  "This brief is a monitoring assessment. It is not a prediction, not investment advice, not an automated validation decision, and not a lifecycle mutation instruction. Evidence remains primary; mechanisms remain challengeable."
);

const markdown = briefLines.join("\n");

const output = {
  registry_version: "intelligence-brief-generator-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    brief_is_monitoring_assessment_not_prediction: true,
    grouped_signals_reduce_repetition: true,
    evidence_remains_primary: true,
    mechanisms_are_challengeable: true,
    human_review_required_for_action: true,
  },
  inputs: {
    case_available: Boolean(currentCase.case_id),
    grouped_signals: groupedSignals.length,
    triggers: triggers.length,
    contradictions: contradictions.length,
    discoveries: discoveries.length,
    mechanisms: mechanisms.length,
  },
  brief: {
    title: "SMURF Intelligence Brief v0.2",
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
  path.join(ROOT, "data/intelligence/intelligence-brief-generator-v0.2.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/intelligence-briefs/smurf-intelligence-brief-v0.2.md"),
  markdown
);

console.log({
  engine_version: output.registry_version,
  case_id: output.brief.case_id,
  recommended_posture: output.brief.recommended_posture,
  leading_mechanism: output.brief.leading_mechanism,
  grouped_signals: groupedSignals.length,
  output_json: "data/intelligence/intelligence-brief-generator-v0.2.json",
  output_markdown: "exports/intelligence-briefs/smurf-intelligence-brief-v0.2.md",
});

console.log("\n--- Brief Preview ---\n");
console.log(markdown.split("\n").slice(0, 80).join("\n"));
