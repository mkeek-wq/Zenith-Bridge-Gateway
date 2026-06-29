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

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];

function bucket(metricName: string): string {
  const m = String(metricName || "").toLowerCase();

  if (m.includes("nodx") || m.includes("export") || m.includes("trade")) return "external_trade";
  if (m.includes("manufacturing") || m.includes("production") || m.includes("output")) return "manufacturing";
  if (m.includes("gdp")) return "macro_growth";
  if (m.includes("cpi") || m.includes("inflation")) return "inflation";
  if (m.includes("investment") || m.includes("fdi")) return "investment";
  if (m.includes("employment") || m.includes("wage") || m.includes("unemployment")) return "labour";
  return "other";
}

const usefulOrStrong = assessedEvidence.filter((e) =>
  ["strong_evidence", "useful_evidence"].includes(String(e.assessment?.status))
);

const grouped: Record<string, any[]> = {};

for (const e of usefulOrStrong) {
  const b = bucket(e.metric_name);
  if (!grouped[b]) grouped[b] = [];
  grouped[b].push(e);
}

const contradictions: any[] = [];

for (const [b, items] of Object.entries(grouped)) {
  const positives = items.filter((e) => e.direction === "positive");
  const negatives = items.filter((e) => e.direction === "negative");

  if (positives.length > 0 && negatives.length > 0) {
    const avgPositive =
      positives.reduce((sum, e) => sum + Number(e.scores?.evidence_score ?? 0), 0) / positives.length;

    const avgNegative =
      negatives.reduce((sum, e) => sum + Number(e.scores?.evidence_score ?? 0), 0) / negatives.length;

    const contradictionStrength = Math.min(avgPositive, avgNegative);

    contradictions.push({
      contradiction_id: `CON_${String(contradictions.length + 1).padStart(4, "0")}`,
      evidence_bucket: b,
      positive_items: positives.length,
      negative_items: negatives.length,
      contradiction_strength: Number(contradictionStrength.toFixed(3)),
      contradiction_band:
        contradictionStrength >= 0.75
          ? "strong_contradiction"
          : contradictionStrength >= 0.6
            ? "moderate_contradiction"
            : "weak_contradiction",
      interpretation:
        "Evidence in the same analytical bucket contains both positive and negative signals. This should reduce certainty and trigger closer monitoring.",
      sample_positive_evidence: positives.slice(0, 5).map((e) => ({
        evidence_id: e.evidence_id,
        metric_name: e.metric_name,
        period: e.period,
        score: e.scores?.evidence_score,
        direction: e.direction,
      })),
      sample_negative_evidence: negatives.slice(0, 5).map((e) => ({
        evidence_id: e.evidence_id,
        metric_name: e.metric_name,
        period: e.period,
        score: e.scores?.evidence_score,
        direction: e.direction,
      })),
      governance: {
        contradiction_does_not_invalidate_evidence: true,
        contradiction_reduces_certainty: true,
        evidence_remains_primary: true,
      },
    });
  }
}

const output = {
  registry_version: "evidence-contradiction-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    contradictions_are_signals_not_failures: true,
    contradictory_evidence_reduces_certainty: true,
    evidence_remains_primary: true,
    human_review_required_for_interpretation: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    useful_or_strong_items: usefulOrStrong.length,
    buckets_assessed: Object.keys(grouped).length,
  },
  summary: {
    contradictions_found: contradictions.length,
    strong_contradictions: contradictions.filter((x) => x.contradiction_band === "strong_contradiction").length,
    moderate_contradictions: contradictions.filter((x) => x.contradiction_band === "moderate_contradiction").length,
    weak_contradictions: contradictions.filter((x) => x.contradiction_band === "weak_contradiction").length,
  },
  contradictions,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/evidence-contradiction-engine-v0.1.json",
});

console.table(
  contradictions.map((c) => ({
    bucket: c.evidence_bucket,
    positive: c.positive_items,
    negative: c.negative_items,
    strength: c.contradiction_strength,
    band: c.contradiction_band,
  }))
);
