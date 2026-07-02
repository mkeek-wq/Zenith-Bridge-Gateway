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
  if (!period) return 0.4;

  const yearMatch = String(period).match(/\d{4}/);
  if (!yearMatch) return 0.45;

  const year = Number(yearMatch[0]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 1) return 1.0;
  if (age <= 2) return 0.9;
  if (age <= 3) return 0.75;
  if (age <= 5) return 0.6;
  return 0.4;
}

function scoreReliability(sourceTitle?: string): number {
  const s = String(sourceTitle || "").toLowerCase();

  if (
    s.includes("singstat") ||
    s.includes("department of statistics") ||
    s.includes("mas") ||
    s.includes("edb")
  ) return 1.0;

  if (
    s.includes("world bank") ||
    s.includes("imf") ||
    s.includes("oecd") ||
    s.includes("bis")
  ) return 0.95;

  if (
    s.includes("government") ||
    s.includes("ministry") ||
    s.includes("central bank") ||
    s.includes("official")
  ) return 0.9;

  if (
    s.includes("reuters") ||
    s.includes("bloomberg") ||
    s.includes("financial times") ||
    s.includes("nikkei")
  ) return 0.78;

  return 0.6;
}

function scoreMetricImportance(metricName?: string): number {
  const m = String(metricName || "").toLowerCase();

  const critical = [
    "gdp",
    "nodx",
    "manufacturing_output",
    "industrial_production",
    "pmi",
    "cpi",
    "employment",
    "unemployment",
    "investment",
    "direct_investment",
    "exports",
  ];

  const useful = [
    "wages",
    "business_receipts",
    "household",
    "saving",
    "services",
    "trade",
    "productivity",
  ];

  if (critical.some((x) => m.includes(x))) return 0.95;
  if (useful.some((x) => m.includes(x))) return 0.75;

  return 0.5;
}

function scoreSignalStrength(value: any): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0.5;

  const abs = Math.abs(num);

  if (abs >= 20) return 1.0;
  if (abs >= 10) return 0.9;
  if (abs >= 5) return 0.75;
  if (abs >= 2) return 0.6;
  if (abs > 0) return 0.45;
  return 0.3;
}

function scoreTextRelevance(metricName?: string, evidenceWindow?: string): number {
  const text = `${metricName || ""} ${evidenceWindow || ""}`.toLowerCase();

  const terms = [
    "manufacturing",
    "exports",
    "nodx",
    "semiconductor",
    "electronics",
    "gdp",
    "inflation",
    "cpi",
    "investment",
    "demand",
    "orders",
    "policy",
    "inventory",
    "employment",
    "production",
    "services",
    "trade",
  ];

  const hits = terms.filter((t) => text.includes(t)).length;

  return clamp(0.45 + hits * 0.08);
}

function scoreNovelty(metricName?: string, allEvidence: any[] = []): number {
  if (!metricName) return 0.5;

  const count = allEvidence.filter(
    (e) => String(e.metric_name || e.metric || "").toLowerCase() === String(metricName).toLowerCase()
  ).length;

  if (count <= 1) return 0.9;
  if (count <= 3) return 0.75;
  if (count <= 10) return 0.6;
  return 0.45;
}

function inferDirection(evidence: any): "positive" | "negative" | "mixed_or_neutral" {
  const text = `${evidence.evidence_window || ""}`.toLowerCase();

  if (
    text.includes("rose") ||
    text.includes("increased") ||
    text.includes("expanded") ||
    text.includes("improved") ||
    text.includes("recovered") ||
    text.includes("grew")
  ) return "positive";

  if (
    text.includes("fell") ||
    text.includes("declined") ||
    text.includes("contracted") ||
    text.includes("slowed") ||
    text.includes("weakened") ||
    text.includes("decreased")
  ) return "negative";

  return "mixed_or_neutral";
}

const inputCandidates = [
  "data/evidence-v5/latest.json",
  "data/intelligence/evidence-registry-v0.1.json",
];

let sourceData: any | null = null;
let sourcePath = "";

for (const candidate of inputCandidates) {
  const data = readJsonSafe(path.join(ROOT, candidate));
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
  [];

const assessed = evidenceArray.map((e, index) => {
  const metricName = e.metric_name || e.metric || e.indicator || "unknown_metric";
  const period = e.period || e.date || e.year || null;
  const sourceTitle = e.source_title || e.source || e.publisher || "";
  const evidenceWindow = e.evidence_window || e.summary || e.text || "";

  const reliability = scoreReliability(sourceTitle);
  const freshness = scoreFreshness(period);
  const metric_importance = scoreMetricImportance(metricName);
  const signal_strength = scoreSignalStrength(e.value);
  const text_relevance = scoreTextRelevance(metricName, evidenceWindow);
  const novelty = scoreNovelty(metricName, evidenceArray);

  const evidence_score = clamp(
    reliability * 0.25 +
      freshness * 0.15 +
      metric_importance * 0.25 +
      signal_strength * 0.15 +
      text_relevance * 0.15 +
      novelty * 0.05
  );

  return {
    evidence_id: e.id || e.evidence_id || `EVIDENCE_${String(index + 1).padStart(5, "0")}`,
    metric_name: metricName,
    period,
    value: e.value ?? null,
    source_title: sourceTitle,
    evidence_window: evidenceWindow,
    direction: inferDirection(e),
    scores: {
      reliability: Number(reliability.toFixed(3)),
      freshness: Number(freshness.toFixed(3)),
      metric_importance: Number(metric_importance.toFixed(3)),
      signal_strength: Number(signal_strength.toFixed(3)),
      text_relevance: Number(text_relevance.toFixed(3)),
      novelty: Number(novelty.toFixed(3)),
      evidence_score: Number(evidence_score.toFixed(3)),
    },
    assessment: {
      status:
        evidence_score >= 0.75
          ? "strong_evidence"
          : evidence_score >= 0.6
            ? "useful_evidence"
            : evidence_score >= 0.45
              ? "weak_evidence"
              : "low_value_evidence",
      evidence_remains_primary: true,
      historical_similarity_can_adjust_confidence: true,
      historical_similarity_can_override_evidence: false,
    },
  };
});

const output = {
  registry_version: "evidence-assessment-engine-v0.2",
  created_at: new Date().toISOString(),
  input_source: sourcePath || "none_found",
  doctrine: {
    evidence_remains_primary: true,
    past_results_do_not_guarantee_future_outcomes: true,
    historical_similarity_may_influence_confidence: true,
    historical_similarity_must_never_override_evidence: true,
  },
  scoring_changes_from_v0_1: [
    "Added metric importance score",
    "Rebalanced strong evidence threshold from 0.80 to 0.75",
    "Reduced compression by giving official core macro metrics stronger weight",
    "Added evidence direction inference",
  ],
  evidence_items_processed: evidenceArray.length,
  summary: {
    strong_evidence_items: assessed.filter((e) => e.assessment.status === "strong_evidence").length,
    useful_evidence_items: assessed.filter((e) => e.assessment.status === "useful_evidence").length,
    weak_evidence_items: assessed.filter((e) => e.assessment.status === "weak_evidence").length,
    low_value_evidence_items: assessed.filter((e) => e.assessment.status === "low_value_evidence").length,
  },
  assessed_evidence: assessed,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  input_source: output.input_source,
  evidence_items_processed: output.evidence_items_processed,
  summary: output.summary,
  output: "data/intelligence/evidence-assessment-engine-v0.2.json",
});

console.table(
  assessed
    .slice()
    .sort((a, b) => b.scores.evidence_score - a.scores.evidence_score)
    .slice(0, 12)
    .map((x) => ({
      metric: x.metric_name,
      period: x.period,
      score: x.scores.evidence_score,
      status: x.assessment.status,
      direction: x.direction,
    }))
);
