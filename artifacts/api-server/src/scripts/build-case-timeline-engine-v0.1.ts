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

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const snapshotDir = path.join(ROOT, "data/intelligence/case-snapshots");

const snapshots = fs.existsSync(snapshotDir)
  ? fs
      .readdirSync(snapshotDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => readJsonSafe(path.join(snapshotDir, f)))
      .filter(Boolean)
  : [];

const timelineItems = snapshots.map((s: any, index: number) => ({
  timeline_index: index + 1,
  snapshot_id: s.snapshot_id,
  created_at: s.created_at,
  case_id: s.case_id,
  case_title: s.case_title,
  case_confidence_score: s.case_confidence_score,
  case_confidence_band: s.case_confidence_band,
  recommended_posture: s.recommended_posture,
  attention_areas: s.attention_areas || [],
  contradictions_found: s.contradictions_found ?? 0,
  strong_contradictions: s.strong_contradictions ?? 0,
  candidate_discoveries: s.candidate_discoveries ?? 0,
  mechanisms: s.mechanisms || [],
}));

const first = timelineItems[0] || null;
const latest = timelineItems[timelineItems.length - 1] || null;

const confidenceTrend =
  first && latest
    ? Number((Number(latest.case_confidence_score ?? 0) - Number(first.case_confidence_score ?? 0)).toFixed(3))
    : 0;

const output = {
  registry_version: "case-timeline-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    case_timeline_tracks_memory_not_truth: true,
    snapshots_are_historical_records: true,
    evidence_remains_primary: true,
  },
  inputs: {
    snapshots_found: snapshots.length,
  },
  summary: {
    timeline_items: timelineItems.length,
    first_snapshot_at: first?.created_at || null,
    latest_snapshot_at: latest?.created_at || null,
    latest_case_confidence_score: latest?.case_confidence_score ?? null,
    confidence_change_since_first_snapshot: confidenceTrend,
    average_case_confidence: Number(avg(timelineItems.map((x) => Number(x.case_confidence_score ?? 0))).toFixed(3)),
  },
  timeline_items: timelineItems,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/case-timeline-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  snapshots_found: output.inputs.snapshots_found,
  timeline_items: output.summary.timeline_items,
  latest_case_confidence_score: output.summary.latest_case_confidence_score,
  output: "data/intelligence/case-timeline-engine-v0.1.json",
});

console.table(
  timelineItems.map((x) => ({
    index: x.timeline_index,
    created: x.created_at,
    confidence: x.case_confidence_score,
    band: x.case_confidence_band,
    posture: x.recommended_posture,
    contradictions: x.contradictions_found,
    discoveries: x.candidate_discoveries,
  }))
);
