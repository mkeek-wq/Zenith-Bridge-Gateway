import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadMetricRegistry } from "./load-metric-registry.js";
import { matchMetricFromRegistry } from "./match-metric-from-registry.js";

const EVIDENCE_VERSION = "evidence-extraction-v0.3";

const projectRoot = process.cwd();
const registryPath = path.join(projectRoot, "data", "document-registry", "latest.json");
const evidenceDir = path.join(projectRoot, "data", "evidence-v3");
const latestEvidencePath = path.join(evidenceDir, "latest.json");

type RegistryDocument = {
  document_id: string;
  institution_id: string;
  feed_id: string;
  slug: string;
  url: string;
  title: string;
  publication_date: string | null;
  resource_type: string | null;
  summary: string | null;
};

type RegistryFile = {
  documents_total: number;
  documents: RegistryDocument[];
};

type MetricForMatching = {
  metric_code: string;
  metric_label: string;
  keywords: string[];
};

type EvidenceRecord = {
  evidence_version: string;
  evidence_id: string;
  evidence_sequence: number;
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
  metric_match_score: number;
  matched_keywords: string[];

  value: number;
  unit: "%";
  direction: string;
  comparison_basis: string;
  period: string | null;

  evidence_text: string;
  evidence_window: string;
  confidence: "high" | "medium" | "low";
};

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function normalizePeriod(document: RegistryDocument): string | null {
  const text = `${document.title} ${document.summary ?? ""}`;

  const quarterMatch = text.match(/\b([1-4])Q\s*(20\d{2})\b/i);
  if (quarterMatch) return `${quarterMatch[2]}-Q${quarterMatch[1]}`;

  const monthMatch = text.match(
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

function getWindow(text: string, index: number): string {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + 140);

  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function classifyDirection(window: string): string {
  const lower = window.toLowerCase();

  if (lower.includes("decreased")) return "decreased";
  if (lower.includes("fell")) return "fell";
  if (lower.includes("declined")) return "declined";
  if (lower.includes("contracted")) return "contracted";
  if (lower.includes("increased")) return "increased";
  if (lower.includes("rose")) return "rose";
  if (lower.includes("grew")) return "grew";
  if (lower.includes("expanded")) return "expanded";

  return "unknown";
}

function classifyComparisonBasis(window: string): string {
  const lower = window.toLowerCase();

  if (
    lower.includes("year-on-year") ||
    lower.includes("year on year") ||
    lower.includes("compared to") ||
    lower.includes("from a year earlier")
  ) {
    return "year_on_year";
  }

  if (
    lower.includes("month-on-month") ||
    lower.includes("month on month") ||
    lower.includes("previous month")
  ) {
    return "month_on_month";
  }

  if (
    lower.includes("quarter-on-quarter") ||
    lower.includes("quarter on quarter") ||
    lower.includes("previous quarter")
  ) {
    return "quarter_on_quarter";
  }

  return "unknown";
}

function inferMetricFromRegistry(text: string, metrics: MetricForMatching[]) {
  const match = matchMetricFromRegistry(text, metrics);

  if (!match) {
    return {
      metric_name: "UNCLASSIFIED_PERCENTAGE",
      metric_label: "Unclassified percentage",
      metric_match_score: 0,
      matched_keywords: [] as string[],
    };
  }

  return {
    metric_name: match.metric_code,
    metric_label: match.metric_label,
    metric_match_score: match.score,
    matched_keywords: match.matched_keywords,
  };
}

function extractEvidence(
  document: RegistryDocument,
  extractedAt: string,
  metrics: MetricForMatching[],
): EvidenceRecord[] {
  if (!document.summary) return [];

  const summary = document.summary;
  const period = normalizePeriod(document);
  const matches = [...summary.matchAll(/(-?\d+(?:\.\d+)?)\s*%/g)];

  return matches
    .map((match, index) => {
      const value = Number(match[1]);
      if (!Number.isFinite(value)) return null;

      const evidenceWindow = getWindow(summary, match.index ?? 0);
      const comparisonBasis = classifyComparisonBasis(evidenceWindow);
      const direction = classifyDirection(evidenceWindow);

      const metric = inferMetricFromRegistry(`${document.title} ${evidenceWindow}`, metrics);

      const confidence =
        metric.metric_name === "UNCLASSIFIED_PERCENTAGE"
          ? "low"
          : metric.metric_match_score >= 2
            ? "high"
            : "medium";

      return {
        evidence_version: EVIDENCE_VERSION,
        evidence_id: `${document.document_id}_${String(index + 1).padStart(3, "0")}_${metric.metric_name}_${period ?? "unknown-period"}`,
        evidence_sequence: index + 1,
        extracted_at: extractedAt,

        document_id: document.document_id,
        institution_id: document.institution_id,
        feed_id: document.feed_id,
        source_url: document.url,
        source_title: document.title,
        source_publication_date: document.publication_date,
        source_type: "summary" as const,

        metric_name: metric.metric_name,
        metric_label: metric.metric_label,
        metric_match_score: metric.metric_match_score,
        matched_keywords: metric.matched_keywords,

        value,
        unit: "%" as const,
        direction,
        comparison_basis: comparisonBasis,
        period,

        evidence_text: summary,
        evidence_window: evidenceWindow,
        confidence,
      };
    })
    .filter((record): record is EvidenceRecord => record !== null);
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });

  const extractedAtDate = new Date();
  const extractedAt = extractedAtDate.toISOString();
  const timestamp = safeTimestamp(extractedAtDate);

  const registryRaw = await readFile(registryPath, "utf8");
  const registry = JSON.parse(registryRaw) as RegistryFile;

  const metricRegistry = await loadMetricRegistry();

  const evidence = registry.documents.flatMap((document) =>
    extractEvidence(document, extractedAt, metricRegistry.metrics),
  );

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
    source_metric_registry: metricRegistry.registry_version,
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
        source_metric_registry: metricRegistry.registry_version,
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
  console.error("Evidence extraction v3 failed:", error);
  process.exit(1);
});
