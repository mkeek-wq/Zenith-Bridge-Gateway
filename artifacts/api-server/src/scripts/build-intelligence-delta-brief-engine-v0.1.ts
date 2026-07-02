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

const timeline =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-timeline-engine-v0.1.json")) || {};

const trends =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-trend-engine-v0.1.json")) || {};

const evolution =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-evolution-engine-v0.1.json")) || {};

const timelineItems: any[] = timeline.timeline_items || [];
const mechanismTrends: any[] = trends.mechanism_trends || [];
const changes: any[] = evolution.changes || [];

const latest = timelineItems[timelineItems.length - 1] || null;
const previous = timelineItems.length >= 2 ? timelineItems[timelineItems.length - 2] : null;

const lines: string[] = [];

lines.push(`# SMURF Intelligence Delta Brief v0.1`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");

if (!latest) {
  lines.push("No case timeline available.");
} else {
  lines.push(`## Current Case State`);
  lines.push("");
  lines.push(`- Latest case: ${latest.case_id}`);
  lines.push(`- Confidence: ${latest.case_confidence_score} (${latest.case_confidence_band})`);
  lines.push(`- Recommended posture: ${latest.recommended_posture}`);
  lines.push(`- Contradictions: ${latest.contradictions_found}`);
  lines.push(`- Candidate discoveries: ${latest.candidate_discoveries}`);
  lines.push("");

  lines.push(`## Change Since Previous Snapshot`);
  lines.push("");

  if (!previous) {
    lines.push("No previous snapshot available. Current case remains the baseline.");
  } else {
    const confidenceDelta = Number(
      (Number(latest.case_confidence_score ?? 0) - Number(previous.case_confidence_score ?? 0)).toFixed(3)
    );

    lines.push(`- Confidence delta: ${confidenceDelta}`);
    lines.push(`- Previous posture: ${previous.recommended_posture}`);
    lines.push(`- Current posture: ${latest.recommended_posture}`);
    lines.push(`- Previous contradictions: ${previous.contradictions_found}`);
    lines.push(`- Current contradictions: ${latest.contradictions_found}`);
  }

  lines.push("");

  lines.push(`## Mechanism Trends`);
  lines.push("");

  if (mechanismTrends.length) {
    for (const m of mechanismTrends) {
      lines.push(
        `- **${m.mechanism_name}**: ${m.trend_status}; latest confidence ${m.latest_confidence_score}; promotion ${m.latest_promotion_score}; status ${m.latest_promotion_status}.`
      );
    }
  } else {
    lines.push("No mechanism trend data available.");
  }

  lines.push("");

  lines.push(`## Evolution Notes`);
  lines.push("");

  if (changes.length) {
    for (const c of changes.slice(0, 10)) {
      lines.push(`- ${c.change_type}: ${c.interpretation}`);
    }
  } else {
    lines.push("No evolution changes recorded.");
  }

  lines.push("");

  lines.push(`## Governance Note`);
  lines.push("");
  lines.push(
    "This delta brief tracks change across SMURF case snapshots. It does not validate mechanisms, predict outcomes, or trigger lifecycle mutation. Human review remains required."
  );
}

const markdown = lines.join("\n");

const output = {
  registry_version: "intelligence-delta-brief-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    delta_brief_tracks_change_not_truth: true,
    case_memory_is_not_prediction: true,
    evidence_remains_primary: true,
    human_review_required_for_action: true,
  },
  inputs: {
    timeline_items: timelineItems.length,
    mechanism_trends: mechanismTrends.length,
    evolution_changes: changes.length,
  },
  brief: {
    title: "SMURF Intelligence Delta Brief v0.1",
    latest_case_id: latest?.case_id || null,
    previous_snapshot_available: Boolean(previous),
    markdown,
  },
};

ensureDir(path.join(ROOT, "data/intelligence"));
ensureDir(path.join(ROOT, "exports/intelligence-briefs"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/intelligence-delta-brief-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/intelligence-briefs/smurf-intelligence-delta-brief-v0.1.md"),
  markdown
);

console.log({
  engine_version: output.registry_version,
  timeline_items: output.inputs.timeline_items,
  mechanism_trends: output.inputs.mechanism_trends,
  previous_snapshot_available: output.brief.previous_snapshot_available,
  output_json: "data/intelligence/intelligence-delta-brief-engine-v0.1.json",
  output_markdown: "exports/intelligence-briefs/smurf-intelligence-delta-brief-v0.1.md",
});

console.log("\n--- Delta Brief Preview ---\n");
console.log(markdown);
