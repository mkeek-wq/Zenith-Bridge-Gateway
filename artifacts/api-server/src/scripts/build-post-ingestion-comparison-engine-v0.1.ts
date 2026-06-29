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

function latestSnapshot(dirRelative: string): any | null {
  const dir = path.join(ROOT, dirRelative);
  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (!files.length) return null;
  return readJsonSafe(path.join(dir, files[files.length - 1]));
}

function countEvidence(data: any): number {
  return (data?.evidence || data?.items || data?.records || []).length;
}

const currentEvidence =
  readJsonSafe(path.join(ROOT, "data/evidence-v5/latest.json")) || {};

const currentDedup =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json")) || {};

const currentCase =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const currentExperience =
  readJsonSafe(path.join(ROOT, "data/intelligence/experience-confidence-engine-v0.1.json")) || {};

const preSnapshot = latestSnapshot("data/ingestion/pre-ingestion-snapshots");

const currentState = {
  captured_at: new Date().toISOString(),
  evidence_items: countEvidence(currentEvidence),
  grouped_signals: currentDedup.summary?.grouped_signals_created ?? null,
  very_strong_signals: currentDedup.summary?.very_strong_signals ?? null,
  strong_signals: currentDedup.summary?.strong_signals ?? null,
  case_confidence_score: currentCase.cases?.[0]?.case_confidence_score ?? null,
  recommended_posture: currentCase.cases?.[0]?.recommended_posture ?? null,
  experience_confidence_items: currentExperience.summary?.confidence_items_created ?? null,
  moderate_experience_confidence: currentExperience.summary?.moderate_experience_confidence ?? null,
  low_experience_confidence: currentExperience.summary?.low_experience_confidence ?? null,
};

const comparison = preSnapshot
  ? {
      pre_snapshot_found: true,
      evidence_items_delta: currentState.evidence_items - Number(preSnapshot.evidence_items ?? 0),
      grouped_signals_delta:
        currentState.grouped_signals !== null && preSnapshot.grouped_signals !== null
          ? currentState.grouped_signals - Number(preSnapshot.grouped_signals ?? 0)
          : null,
      case_confidence_delta:
        currentState.case_confidence_score !== null && preSnapshot.case_confidence_score !== null
          ? Number((currentState.case_confidence_score - Number(preSnapshot.case_confidence_score)).toFixed(3))
          : null,
      posture_changed: currentState.recommended_posture !== preSnapshot.recommended_posture,
      experience_confidence_items_delta:
        currentState.experience_confidence_items !== null && preSnapshot.experience_confidence_items !== null
          ? currentState.experience_confidence_items - Number(preSnapshot.experience_confidence_items ?? 0)
          : null,
    }
  : {
      pre_snapshot_found: false,
      note: "No pre-ingestion snapshot found. Current state recorded as comparison baseline only.",
    };

const output = {
  registry_version: "post-ingestion-comparison-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    comparison_measures_change_not_quality: true,
    bulk_ingestion_requires_human_review: true,
    no_automatic_acceptance: true,
    evidence_remains_primary: true,
  },
  pre_ingestion_snapshot: preSnapshot,
  current_state: currentState,
  comparison,
  recommendation: preSnapshot
    ? "Review deltas before accepting ingestion results."
    : "Create a pre-ingestion snapshot before future bulk runs.",
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/post-ingestion-comparison-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  pre_snapshot_found: comparison.pre_snapshot_found,
  current_evidence_items: currentState.evidence_items,
  output: "data/intelligence/post-ingestion-comparison-engine-v0.1.json",
});

console.log(comparison);
