import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const AUDIT_VERSION = "evidence-quality-audit-v0.1";

const projectRoot = process.cwd();
const evidencePath = path.join(projectRoot, "data", "evidence", "latest.json");
const outputDir = path.join(projectRoot, "data", "evidence-quality");
const latestOutputPath = path.join(outputDir, "latest.json");

type EvidenceRecord = {
  evidence_id: string;
  document_id: string;
  source_title: string;
  source_publication_date: string | null;
  metric_name: string;
  metric_label: string;
  value: number;
  unit: string;
  direction: string;
  comparison_basis: string;
  period: string | null;
  evidence_text: string;
  confidence: "high" | "medium" | "low";
};

type EvidenceFile = {
  evidence_version: string;
  generated_at: string;
  documents_scanned: number;
  evidence_records_total: number;
  evidence: EvidenceRecord[];
};

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function countPercentages(text: string): number {
  return [...text.matchAll(/-?\d+(?:\.\d+)?\s*%/g)].length;
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const auditedAtDate = new Date();
  const auditedAt = auditedAtDate.toISOString();
  const timestamp = safeTimestamp(auditedAtDate);

  const raw = await readFile(evidencePath, "utf8");
  const evidenceFile = JSON.parse(raw) as EvidenceFile;

  const confidenceCounts: Record<string, number> = {};
  const metricCounts: Record<string, number> = {};
  const comparisonCounts: Record<string, number> = {};
  const directionCounts: Record<string, number> = {};

  const genericMetricRecords: EvidenceRecord[] = [];
  const unknownComparisonRecords: EvidenceRecord[] = [];
  const multiplePercentageRecords: Array<EvidenceRecord & { percentage_count: number }> = [];

  for (const record of evidenceFile.evidence) {
    increment(confidenceCounts, record.confidence);
    increment(metricCounts, record.metric_name);
    increment(comparisonCounts, record.comparison_basis);
    increment(directionCounts, record.direction);

    if (record.metric_name.includes("generic")) {
      genericMetricRecords.push(record);
    }

    if (record.comparison_basis === "unknown") {
      unknownComparisonRecords.push(record);
    }

    const percentageCount = countPercentages(record.evidence_text);
    if (percentageCount > 1) {
      multiplePercentageRecords.push({
        ...record,
        percentage_count: percentageCount,
      });
    }
  }

  const output = {
    audit_version: AUDIT_VERSION,
    audited_at: auditedAt,
    source_evidence_file: evidencePath,

    documents_scanned: evidenceFile.documents_scanned,
    evidence_records_total: evidenceFile.evidence_records_total,

    confidence_counts: confidenceCounts,
    comparison_counts: comparisonCounts,
    direction_counts: directionCounts,

    metric_counts: Object.fromEntries(
      Object.entries(metricCounts).sort((a, b) => b[1] - a[1]),
    ),

    quality_flags: {
      generic_metric_records: genericMetricRecords.length,
      unknown_comparison_records: unknownComparisonRecords.length,
      multiple_percentage_records: multiplePercentageRecords.length,
    },

    samples: {
      generic_metric_records: genericMetricRecords.slice(0, 10),
      unknown_comparison_records: unknownComparisonRecords.slice(0, 10),
      multiple_percentage_records: multiplePercentageRecords.slice(0, 10),
    },
  };

  const timestampPath = path.join(outputDir, `${timestamp}.json`);

  await writeFile(latestOutputPath, JSON.stringify(output, null, 2), "utf8");
  await writeFile(timestampPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        audit_version: AUDIT_VERSION,
        latest_output_file: latestOutputPath,
        timestamp_output_file: timestampPath,
        documents_scanned: output.documents_scanned,
        evidence_records_total: output.evidence_records_total,
        confidence_counts: output.confidence_counts,
        quality_flags: output.quality_flags,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Evidence quality audit failed:", error);
  process.exit(1);
});
