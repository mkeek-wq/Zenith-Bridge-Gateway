import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const evidencePath = path.join(
  projectRoot,
  "data",
  "evidence-v5",
  "latest.json",
);

async function main() {
  const raw = await readFile(evidencePath, "utf8");
  const data = JSON.parse(raw);

  const evidence = data.evidence ?? [];

  const metricCounts: Record<string, number> = {};
  const confidenceCounts: Record<string, number> = {};

  let classified = 0;
  let unclassified = 0;

  for (const record of evidence) {
    const metric = record.metric_name;
    const confidence = record.confidence ?? "unknown";

    metricCounts[metric] = (metricCounts[metric] ?? 0) + 1;
    confidenceCounts[confidence] =
      (confidenceCounts[confidence] ?? 0) + 1;

    if (metric === "UNCLASSIFIED_PERCENTAGE") {
      unclassified += 1;
    } else {
      classified += 1;
    }
  }

  const topMetrics = Object.entries(metricCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([metric, count]) => ({
      metric,
      count,
    }));

  const classificationRate =
    evidence.length === 0
      ? 0
      : Number(
          ((classified / evidence.length) * 100).toFixed(2),
        );

  const lowConfidenceExamples = evidence
    .filter((e: any) => e.confidence === "low")
    .slice(0, 20)
    .map((e: any) => ({
      metric: e.metric_name,
      value: e.value,
      source_title: e.source_title,
      evidence_window: e.evidence_window,
    }));

  const report = {
    audit_version: "evidence-audit-v2",
    generated_at: new Date().toISOString(),

    evidence_records_total: evidence.length,

    classified,
    unclassified,

    classification_rate_percent: classificationRate,

    confidence_distribution: confidenceCounts,

    top_metrics: topMetrics,

    low_confidence_examples: lowConfidenceExamples,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
