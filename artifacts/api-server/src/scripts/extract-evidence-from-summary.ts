import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const EVIDENCE_VERSION = "evidence-extraction-v0.1";

const projectRoot = process.cwd();
const registryPath = path.join(projectRoot, "data", "document-registry", "latest.json");
const evidenceDir = path.join(projectRoot, "data", "evidence");
const latestEvidencePath = path.join(evidenceDir, "latest.json");

type RegistryDocument = {
  registry_version: string;
  document_id: string;
  institution_id: string;
  feed_id: string;
  slug: string;
  url: string;
  title: string;
  publication_date: string | null;
  resource_type: string | null;
  summary: string | null;
  first_discovered_at: string;
  last_seen_at: string;
  status: "active";
};

type RegistryFile = {
  registry_version: string;
  generated_at: string;
  source_candidates_file: string;
  documents_total: number;
  documents: RegistryDocument[];
};

type EvidenceRecord = {
  evidence_version: string;
  evidence_id: string;
  extracted_at: string;

  document_id: string;
  institution_id: string;
  feed_id: string;
  source_url: string;
  source_title: string;
  source_publication_date: string | null;
  source_type: "summary";

  metric_name: string;
  metric_label: string;
  value: number;
  unit: "%";
  direction: "increased" | "decreased" | "rose" | "fell" | "grew" | "expanded" | "unknown";
  comparison_basis: "year_on_year" | "month_on_month" | "quarter_on_quarter" | "unknown";
  period: string | null;

  evidence_text: string;
  confidence: "high" | "medium" | "low";
};

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function normalizePeriod(document: RegistryDocument): string | null {
  const titleAndSummary = `${document.title} ${document.summary ?? ""}`;

  const quarterMatch = titleAndSummary.match(/\b([1-4])Q\s*(20\d{2})\b/i);
  if (quarterMatch) {
    return `${quarterMatch[2]}-Q${quarterMatch[1]}`;
  }

  const monthMatch = titleAndSummary.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s*(20\d{2})\b/i,
  );

  if (monthMatch) {
    const monthMap: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      sept: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };

    return `${monthMatch[2]}-${monthMap[monthMatch[1].toLowerCase()]}`;
  }

  return document.publication_date;
}

function classifyDirection(text: string): EvidenceRecord["direction"] {
  const lower = text.toLowerCase();

  if (lower.includes("increased")) return "increased";
  if (lower.includes("decreased")) return "decreased";
  if (lower.includes("rose")) return "rose";
  if (lower.includes("fell")) return "fell";
  if (lower.includes("grew")) return "grew";
  if (lower.includes("expanded")) return "expanded";

  return "unknown";
}

function classifyComparisonBasis(text: string): EvidenceRecord["comparison_basis"] {
  const lower = text.toLowerCase();

  if (lower.includes("year-on-year") || lower.includes("from a year earlier")) {
    return "year_on_year";
  }

  if (
    lower.includes("month-on-month") ||
    lower.includes("from the previous month") ||
    lower.includes("from previous month")
  ) {
    return "month_on_month";
  }

  if (
    lower.includes("quarter-on-quarter") ||
    lower.includes("from the previous quarter") ||
    lower.includes("from previous quarter")
  ) {
    return "quarter_on_quarter";
  }

  return "unknown";
}

function inferMetricName(document: RegistryDocument, comparisonBasis: EvidenceRecord["comparison_basis"]): {
  metric_name: string;
  metric_label: string;
} {
  const title = document.title.toLowerCase();

  if (title.includes("business receipts")) {
    return {
      metric_name: `business_receipts_growth_${comparisonBasis}`,
      metric_label: "Business receipts growth",
    };
  }

  if (title.includes("consumer price") || title.includes("cpi")) {
    return {
      metric_name: `consumer_price_index_growth_${comparisonBasis}`,
      metric_label: "Consumer Price Index growth",
    };
  }

  if (title.includes("manufacturing")) {
    return {
      metric_name: `manufacturing_output_growth_${comparisonBasis}`,
      metric_label: "Manufacturing output growth",
    };
  }

  if (title.includes("household")) {
    return {
      metric_name: `household_indicator_growth_${comparisonBasis}`,
      metric_label: "Household indicator growth",
    };
  }

  return {
    metric_name: `generic_percentage_change_${comparisonBasis}`,
    metric_label: "Generic percentage change",
  };
}

function extractFirstPercentageEvidence(document: RegistryDocument, extractedAt: string): EvidenceRecord | null {
  if (!document.summary) return null;

  const summary = document.summary;
  const percentMatch = summary.match(/(-?\d+(?:\.\d+)?)\s*%/);

  if (!percentMatch) return null;

  const value = Number(percentMatch[1]);

  if (!Number.isFinite(value)) return null;

  const direction = classifyDirection(summary);
  const comparisonBasis = classifyComparisonBasis(summary);
  const metric = inferMetricName(document, comparisonBasis);
  const period = normalizePeriod(document);

  return {
    evidence_version: EVIDENCE_VERSION,
    evidence_id: `${document.document_id}_${metric.metric_name}_${period ?? "unknown-period"}`,
    extracted_at: extractedAt,

    document_id: document.document_id,
    institution_id: document.institution_id,
    feed_id: document.feed_id,
    source_url: document.url,
    source_title: document.title,
    source_publication_date: document.publication_date,
    source_type: "summary",

    metric_name: metric.metric_name,
    metric_label: metric.metric_label,
    value,
    unit: "%",
    direction,
    comparison_basis: comparisonBasis,
    period,

    evidence_text: summary,
    confidence: comparisonBasis === "unknown" ? "medium" : "high",
  };
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });

  const extractedAtDate = new Date();
  const extractedAt = extractedAtDate.toISOString();
  const timestamp = safeTimestamp(extractedAtDate);

  const registryRaw = await readFile(registryPath, "utf8");
  const registry = JSON.parse(registryRaw) as RegistryFile;

  const evidence: EvidenceRecord[] = [];

  for (const document of registry.documents) {
    const record = extractFirstPercentageEvidence(document, extractedAt);

    if (record) {
      evidence.push(record);
    }
  }

  evidence.sort((a, b) => {
    const dateA = a.source_publication_date ?? "";
    const dateB = b.source_publication_date ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.evidence_id.localeCompare(b.evidence_id);
  });

  const output = {
    evidence_version: EVIDENCE_VERSION,
    generated_at: extractedAt,
    source_registry_file: registryPath,
    source_type: "document_registry_summary",
    documents_scanned: registry.documents.length,
    evidence_records_total: evidence.length,
    evidence,
  };

  const timestampPath = path.join(evidenceDir, `${timestamp}.json`);

  await writeFile(latestEvidencePath, JSON.stringify(output, null, 2), "utf8");
  await writeFile(timestampPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        evidence_version: EVIDENCE_VERSION,
        latest_evidence_file: latestEvidencePath,
        timestamp_evidence_file: timestampPath,
        documents_scanned: output.documents_scanned,
        evidence_records_total: output.evidence_records_total,
        first_evidence: evidence[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Evidence extraction failed:", error);
  process.exit(1);
});
