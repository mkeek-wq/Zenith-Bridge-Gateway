import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readTextSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

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

const briefText = readTextSafe(
  path.join(ROOT, "exports/intelligence-briefs/smurf-intelligence-brief-v0.1.md")
);

const dedup =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-deduplication-engine-v0.1.json")) || {};

const contradiction =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-contradiction-engine-v0.1.json")) || {};

const trigger =
  readJsonSafe(path.join(ROOT, "data/intelligence/monitoring-trigger-engine-v0.1.json")) || {};

const words = briefText.split(/\s+/).filter(Boolean);
const lines = briefText.split("\n");

const repeatedMetricMatches = briefText.match(/[A-Z_]{4,}/g) || [];
const metricCounts = new Map<string, number>();

for (const m of repeatedMetricMatches) {
  metricCounts.set(m, (metricCounts.get(m) || 0) + 1);
}

const repeatedMetrics = Array.from(metricCounts.entries())
  .filter(([_, count]) => count > 2)
  .map(([metric, count]) => ({ metric, count }));

const findings: any[] = [];

if (words.length < 250) {
  findings.push({
    severity: "medium",
    issue: "brief_too_short",
    finding: "Brief is concise but may not provide enough context for an executive reader.",
    recommendation: "Add signal interpretation and monitoring rationale.",
  });
}

if (repeatedMetrics.length > 0) {
  findings.push({
    severity: "medium",
    issue: "repeated_metrics",
    finding: "Some metric names appear repeatedly.",
    repeated_metrics: repeatedMetrics.slice(0, 10),
    recommendation: "Use deduplicated grouped signals instead of listing repeated evidence rows.",
  });
}

if (!briefText.includes("Governance Note")) {
  findings.push({
    severity: "high",
    issue: "missing_governance_note",
    finding: "Brief lacks explicit governance note.",
    recommendation: "Include non-prediction and non-validation language.",
  });
}

if (!briefText.includes("Contradictions")) {
  findings.push({
    severity: "medium",
    issue: "missing_contradiction_section",
    finding: "Brief lacks contradiction section.",
    recommendation: "Include contradiction summary to prevent false certainty.",
  });
}

if (!briefText.includes("Candidate Discoveries")) {
  findings.push({
    severity: "medium",
    issue: "missing_discovery_section",
    finding: "Brief lacks discovery section.",
    recommendation: "Include candidate discoveries where available.",
  });
}

if ((dedup.summary?.grouped_signals_created ?? 0) > 0) {
  findings.push({
    severity: "low",
    issue: "dedup_available",
    finding: "Deduplicated evidence signals are available for v0.2 brief generation.",
    recommendation: "Use top grouped signals in the next brief.",
  });
}

const qualityScore = Math.max(
  0,
  1 -
    findings.filter((f) => f.severity === "high").length * 0.25 -
    findings.filter((f) => f.severity === "medium").length * 0.12 -
    findings.filter((f) => f.severity === "low").length * 0.04
);

const output = {
  registry_version: "brief-quality-review-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    quality_review_improves_readability_not_truth: true,
    brief_must_remain_governed: true,
    evidence_remains_primary: true,
  },
  inputs: {
    brief_found: briefText.length > 0,
    grouped_signals_available: dedup.summary?.grouped_signals_created ?? 0,
    contradictions_available: contradiction.summary?.contradictions_found ?? 0,
    monitoring_triggers_available: trigger.summary?.triggers_created ?? 0,
  },
  brief_metrics: {
    word_count: words.length,
    line_count: lines.length,
    repeated_metric_count: repeatedMetrics.length,
    quality_score: Number(qualityScore.toFixed(3)),
    quality_band:
      qualityScore >= 0.85
        ? "strong"
        : qualityScore >= 0.65
          ? "acceptable"
          : qualityScore >= 0.45
            ? "needs_revision"
            : "poor",
  },
  findings,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/brief-quality-review-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  brief_metrics: output.brief_metrics,
  findings: output.findings.length,
  output: "data/intelligence/brief-quality-review-engine-v0.1.json",
});

console.table(
  findings.map((f) => ({
    severity: f.severity,
    issue: f.issue,
    recommendation: f.recommendation,
  }))
);
