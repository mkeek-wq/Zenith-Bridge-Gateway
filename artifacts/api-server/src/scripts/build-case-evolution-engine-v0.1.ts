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

function latestExistingCaseSnapshot(): any | null {
  const dir = path.join(ROOT, "data/intelligence/case-snapshots");
  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (!files.length) return null;

  return readJsonSafe(path.join(dir, files[files.length - 1]));
}

function band(score: number): string {
  if (score >= 0.75) return "high";
  if (score >= 0.55) return "moderate";
  if (score >= 0.35) return "low";
  return "very_low";
}

const caseData =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-construction-engine-v0.1.json")) || {};

const contradictionData =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const discoveryData =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json")) || {};

const currentCase = caseData.cases?.[0] || null;
const previousSnapshot = latestExistingCaseSnapshot();

if (!currentCase) {
  throw new Error("No current case found in case-construction-engine-v0.1.json");
}

const currentSnapshot = {
  snapshot_id: `CASE_SNAPSHOT_${new Date().toISOString().replace(/[:.]/g, "-")}`,
  created_at: new Date().toISOString(),
  case_id: currentCase.case_id,
  case_title: currentCase.case_title,
  case_confidence_score: currentCase.case_confidence_score,
  case_confidence_band: currentCase.case_confidence_band,
  recommended_posture: currentCase.recommended_posture,
  attention_areas: currentCase.attention_areas || [],
  mechanisms: currentCase.mechanism_summary || [],
  contradictions_found: contradictionData.summary?.contradictions_found ?? 0,
  strong_contradictions: contradictionData.summary?.strong_contradictions ?? 0,
  candidate_discoveries: discoveryData.summary?.candidate_discoveries ?? 0,
};

function mechanismMap(snapshot: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const m of snapshot?.mechanisms || []) {
    out[m.mechanism_id] = m;
  }
  return out;
}

const changes: any[] = [];

if (previousSnapshot) {
  const confidenceDelta =
    Number(currentSnapshot.case_confidence_score ?? 0) -
    Number(previousSnapshot.case_confidence_score ?? 0);

  changes.push({
    change_type: "case_confidence_change",
    previous_value: previousSnapshot.case_confidence_score,
    current_value: currentSnapshot.case_confidence_score,
    delta: Number(confidenceDelta.toFixed(3)),
    interpretation:
      confidenceDelta > 0.03
        ? "Case confidence increased."
        : confidenceDelta < -0.03
          ? "Case confidence decreased."
          : "Case confidence broadly stable.",
  });

  if (previousSnapshot.recommended_posture !== currentSnapshot.recommended_posture) {
    changes.push({
      change_type: "recommended_posture_change",
      previous_value: previousSnapshot.recommended_posture,
      current_value: currentSnapshot.recommended_posture,
      interpretation: "Recommended monitoring posture changed.",
    });
  }

  const prevMechanisms = mechanismMap(previousSnapshot);
  const currMechanisms = mechanismMap(currentSnapshot);

  for (const [id, curr] of Object.entries(currMechanisms)) {
    const prev = prevMechanisms[id];

    if (!prev) {
      changes.push({
        change_type: "new_mechanism_in_case",
        mechanism_id: id,
        mechanism_name: curr.mechanism_name,
        interpretation: "Mechanism appeared in current case but not previous snapshot.",
      });
      continue;
    }

    const currScore = Number(curr.adjusted_confidence_score ?? 0);
    const prevScore = Number(prev.adjusted_confidence_score ?? 0);
    const delta = currScore - prevScore;

    changes.push({
      change_type: "mechanism_confidence_change",
      mechanism_id: id,
      mechanism_name: curr.mechanism_name,
      previous_value: prevScore,
      current_value: currScore,
      delta: Number(delta.toFixed(3)),
      interpretation:
        delta > 0.03
          ? "Mechanism strengthened."
          : delta < -0.03
            ? "Mechanism weakened."
            : "Mechanism broadly stable.",
    });
  }

  const contradictionDelta =
    Number(currentSnapshot.contradictions_found ?? 0) -
    Number(previousSnapshot.contradictions_found ?? 0);

  changes.push({
    change_type: "contradiction_count_change",
    previous_value: previousSnapshot.contradictions_found,
    current_value: currentSnapshot.contradictions_found,
    delta: contradictionDelta,
    interpretation:
      contradictionDelta > 0
        ? "More contradictions detected."
        : contradictionDelta < 0
          ? "Contradictions reduced."
          : "Contradiction count stable.",
  });
} else {
  changes.push({
    change_type: "first_case_snapshot",
    interpretation: "No prior case snapshot found. Current case becomes baseline.",
  });
}

const output = {
  registry_version: "case-evolution-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    case_evolution_tracks_change_not_truth: true,
    evidence_remains_primary: true,
    case_confidence_is_not_prediction: true,
  },
  previous_snapshot_found: Boolean(previousSnapshot),
  current_snapshot: currentSnapshot,
  changes,
  evolution_summary: {
    case_confidence_score: currentSnapshot.case_confidence_score,
    case_confidence_band: band(Number(currentSnapshot.case_confidence_score ?? 0)),
    recommended_posture: currentSnapshot.recommended_posture,
    changes_detected: changes.length,
  },
};

ensureDir(path.join(ROOT, "data/intelligence"));
ensureDir(path.join(ROOT, "data/intelligence/case-snapshots"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/case-evolution-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/case-snapshots", `${currentSnapshot.snapshot_id}.json`),
  JSON.stringify(currentSnapshot, null, 2)
);

console.log({
  engine_version: output.registry_version,
  previous_snapshot_found: output.previous_snapshot_found,
  changes_detected: output.evolution_summary.changes_detected,
  case_confidence_score: output.evolution_summary.case_confidence_score,
  output: "data/intelligence/case-evolution-engine-v0.1.json",
});

console.table(
  changes.map((c) => ({
    type: c.change_type,
    mechanism: c.mechanism_id || "",
    delta: c.delta ?? "",
    interpretation: c.interpretation,
  }))
);

