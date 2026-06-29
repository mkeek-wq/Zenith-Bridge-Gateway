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

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function scoreFreshness(period?: string): number {
  if (!period) return 0.35;

  const yearMatch = String(period).match(/\d{4}/);
  if (!yearMatch) return 0.4;

  const year = Number(yearMatch[0]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 1) return 1.0;
  if (age <= 3) return 0.8;
  if (age <= 5) return 0.65;
  if (age <= 10) return 0.45;
  return 0.25;
}

function scoreReliability(sourceTitle?: string): number {
  const s = String(sourceTitle || "").toLowerCase();

  if (
    s.includes("singstat") ||
    s.includes("department of statistics") ||
    s.includes("mas") ||
    s.includes("edb") ||
    s.includes("world bank") ||
    s.includes("imf") ||
    s.includes("oecd") ||
    s.includes("bis")
  ) {
    return 0.95;
  }

  if (
    s.includes("government") ||
    s.includes("ministry") ||
    s.includes("central bank") ||
    s.includes("official")
  ) {
    return 0.85;
  }

  if (
    s.includes("reuters") ||
    s.includes("bloomberg") ||
    s.includes("financial times") ||
    s.includes("nikkei")
  ) {
    return 0.75;
  }

  return 0.55;
}

function scoreRelevance(metricName?: string, evidenceWindow?: string): number {
  const combined = `${metricName || ""} ${evidenceWindow || ""}`.toLowerCase();

  const highSignalTerms = [
    "pmi",
    "exports",
    "industrial production",
    "manufacturing",
    "semiconductor",
    "electronics",
    "inflation",
    "cpi",
    "employment",
    "wages",
    "gdp",
    "investment",
    "policy",
    "interest rate",
    "inventory",
    "demand",
  ];

  let hits = 0;
  for (const term of highSignalTerms) {
    if (combined.includes(term)) hits++;
  }

  return clamp(0.35 + hits * 0.12);
}

function scoreSignalStrength(value: any): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0.45;

  const abs = Math.abs(num);

  if (abs >= 20) return 1.0;
  if (abs >= 10) return 0.85;
  if (abs >= 5) return 0.7;
  if (abs >= 2) return 0.55;
  if (abs > 0) return 0.4;
  return 0.25;
}

function scoreNovelty(metricName?: string, allEvidence: any[] = []): number {
  if (!metricName) return 0.45;

  const count = allEvidence.filter(
    (e) => String(e.metric_name || e.metric || "").toLowerCase() === String(metricName).toLowerCase()
  ).length;

  if (count <= 1) return 0.85;
  if (count <= 3) return 0.65;
  if (count <= 10) return 0.5;
  return 0.35;
}

function inferConflictLevel(evidence: any): number {
  const text = `${evidence.evidence_window || ""} ${evidence.source_title || ""}`.toLowerCase();

  if (
    text.includes("fell") ||
    text.includes("declined") ||
    text.includes("contracted") ||
    text.includes("slowed") ||
    text.includes("weakened")
  ) {
    return 0.45;
  }

  if (
    text.includes("rose") ||
    text.includes("increased") ||
    text.includes("expanded") ||
    text.includes("recovered") ||
    text.includes("improved")
  ) {
    return 0.15;
  }

  return 0.25;
}

const inputCandidates = [
  "data/evidence-v5/latest.json",
  "data/intelligence/evidence-registry-v0.1.json",
  "data/historical-replay/latest.json",
];

let sourceData: any | null = null;
let sourcePath = "";

for (const candidate of inputCandidates) {
  const full = path.join(ROOT, candidate);
  const data = readJsonSafe(full);
  if (data) {
    sourceData = data;
    sourcePath = candidate;
    break;
  }
}

const evidenceArray: any[] =
  sourceData?.evidence ||
  sourceData?.items ||
  sourceData?.records ||
  sourceData?.evidence_items ||
  [];

const assessed = evidenceArray.map((e, index) => {
  const metricName = e.metric_name || e.metric || e.indicator || "unknown_metric";
  const period = e.period || e.date || e.year || null;
  const sourceTitle = e.source_title || e.source || e.publisher || "";
  const evidenceWindow = e.evidence_window || e.summary || e.text || "";

  const reliability = scoreReliability(sourceTitle);
  const freshness = scoreFreshness(period);
  const relevance = scoreRelevance(metricName, evidenceWindow);
  const novelty = scoreNovelty(metricName, evidenceArray);
  const signal_strength = scoreSignalStrength(e.value);
  const conflict_level = inferConflictLevel(e);

  const evidence_score = clamp(
    reliability * 0.25 +
      freshness * 0.15 +
      relevance * 0.25 +
      novelty * 0.1 +
      signal_strength * 0.15 +
      (1 - conflict_level) * 0.1
  );

  return {
    evidence_id: e.id || e.evidence_id || `EVIDENCE_${String(index + 1).padStart(5, "0")}`,
    metric_name: metricName,
    period,
    value: e.value ?? null,
    source_title: sourceTitle,
    evidence_window: evidenceWindow,
    scores: {
      reliability: Number(reliability.toFixed(3)),
      freshness: Number(freshness.toFixed(3)),
      relevance: Number(relevance.toFixed(3)),
      novelty: Number(novelty.toFixed(3)),
      signal_strength: Number(signal_strength.toFixed(3)),
      conflict_level: Number(conflict_level.toFixed(3)),
      evidence_score: Number(evidence_score.toFixed(3)),
    },
    assessment: {
      status:
        evidence_score >= 0.8
          ? "strong_evidence"
          : evidence_score >= 0.6
            ? "useful_evidence"
            : evidence_score >= 0.4
              ? "weak_evidence"
              : "low_value_evidence",
      evidence_remains_primary: true,
      historical_similarity_can_adjust_confidence: true,
      historical_similarity_can_override_evidence: false,
    },
  };
});

const output = {
  registry_version: "evidence-assessment-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    evidence_remains_primary: true,
    past_results_do_not_guarantee_future_outcomes: true,
    historical_similarity_may_influence_confidence: true,
    historical_similarity_must_never_override_evidence: true,
  },
  input_source: sourcePath || "none_found",
  evidence_items_processed: evidenceArray.length,
  assessed_items: assessed.length,
  assessed_evidence: assessed,
};

const outputDir = path.join(ROOT, "data/intelligence");
ensureDir(outputDir);

const outputPath = path.join(outputDir, "evidence-assessment-engine-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.registry_version,
  input_source: output.input_source,
  evidence_items_processed: output.evidence_items_processed,
  assessed_items: output.assessed_items,
  output: "data/intelligence/evidence-assessment-engine-v0.1.json",
});

console.table(
  assessed.slice(0, 12).map((x) => ({
    evidence_id: x.evidence_id,
    metric: x.metric_name,
    period: x.period,
    score: x.scores.evidence_score,
    status: x.assessment.status,
  }))
);
