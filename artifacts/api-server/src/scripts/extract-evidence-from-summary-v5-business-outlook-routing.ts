import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadMetricRegistry } from "./load-metric-registry.js";
import { matchMetricFromRegistry } from "./match-metric-from-registry.js";

const EVIDENCE_VERSION = "evidence-extraction-v0.5";

const projectRoot = process.cwd();
const registryPath = path.join(projectRoot, "data", "document-registry", "latest.json");
const evidenceDir = path.join(projectRoot, "data", "evidence-v5");
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
  context_strategy: string;
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

function isBoundary(text: string, index: number): boolean {
  const char = text[index];
  const prev = text[index - 1] ?? "";
  const next = text[index + 1] ?? "";

  if (![".", ";", ":"].includes(char)) return false;

  if (/\d/.test(prev) && /\d/.test(next)) return false;

  return true;
}

function findPreviousBoundary(text: string, index: number): number {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (isBoundary(text, i)) return i;
  }

  return -1;
}

function findNextBoundary(text: string, index: number): number {
  for (let i = index; i < text.length; i += 1) {
    if (isBoundary(text, i)) return i;
  }

  return text.length;
}

function cleanContext(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getSmartContext(text: string, index: number): {
  window: string;
  strategy: string;
} {
  const previousBoundary = findPreviousBoundary(text, index);
  const nextBoundary = findNextBoundary(text, index);

  const localStart = previousBoundary >= 0 ? previousBoundary + 1 : 0;
  const localEnd = nextBoundary < text.length ? nextBoundary + 1 : text.length;
  const local = cleanContext(text.slice(localStart, localEnd));

  const localBeforePercent = cleanContext(text.slice(localStart, index)).toLowerCase();

  const startsLikeDependentComparison =
    localBeforePercent === "" ||
    localBeforePercent.endsWith("from") ||
    localBeforePercent.includes(" from ") ||
    localBeforePercent.includes("compared with") ||
    localBeforePercent.includes("compared to") ||
    localBeforePercent.includes("previous quarter") ||
    localBeforePercent.includes("previous month");

  if (startsLikeDependentComparison && previousBoundary >= 0) {
    const previousPreviousBoundary = findPreviousBoundary(text, previousBoundary);
    const inheritedStart = previousPreviousBoundary >= 0 ? previousPreviousBoundary + 1 : 0;
    const inherited = cleanContext(text.slice(inheritedStart, localEnd));

    return {
      window: inherited,
      strategy: "sentence_with_previous_context_inheritance",
    };
  }

  return {
    window: local,
    strategy: "decimal_safe_sentence",
  };
}

function getValueLocalContext(text: string, index: number): string {
  const rawStart = Math.max(0, index - 80);
  const rawEnd = Math.min(text.length, index + 80);
  const raw = text.slice(rawStart, rawEnd);
  const relativeIndex = index - rawStart;

  const beforeValue = raw.slice(0, relativeIndex);
  const afterValue = raw.slice(relativeIndex);

  const lowerBefore = beforeValue.toLowerCase();
  const lowerAfter = afterValue.toLowerCase();

  const beforeBoundaries = [
    lowerBefore.lastIndexOf(" and "),
    lowerBefore.lastIndexOf(" while "),
    lowerBefore.lastIndexOf(", with "),
  ];

  const afterBoundaries = [
    lowerAfter.indexOf(" and "),
    lowerAfter.indexOf(" while "),
    lowerAfter.indexOf(", with "),
    lowerAfter.indexOf(", resulting in "),
  ].filter((value) => value >= 0);

  const lastBoundaryBeforeValue = Math.max(...beforeBoundaries);
  const nextBoundaryAfterValue =
    afterBoundaries.length > 0 ? Math.min(...afterBoundaries) : -1;

  const localStart =
    lastBoundaryBeforeValue >= 0 ? lastBoundaryBeforeValue + 1 : 0;

  const localEnd =
    nextBoundaryAfterValue >= 0 ? relativeIndex + nextBoundaryAfterValue : raw.length;

  return cleanContext(raw.slice(localStart, localEnd));
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
    lower.includes("from a year earlier") ||
    lower.includes("over previous year")
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

  if (lower.includes("compared to") || lower.includes("compared with")) {
    return "contextual";
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

function applyValueLocalMetricRouting(params: {
  metric: ReturnType<typeof inferMetricFromRegistry>;
  comparisonBasis: string;
  document: RegistryDocument;
  evidenceWindow: string;
}) {
  const { metric, comparisonBasis, document, evidenceWindow } = params;

  const cpiContext = `${document.title} ${evidenceWindow}`.toLowerCase();
  const isCpiContext =
    cpiContext.includes("consumer price index") ||
    cpiContext.includes("cpi");

  if (!isCpiContext) {
    return metric;
  }



  if (
    cpiContext.includes("full year") ||
    cpiContext.includes("for the year") ||
    cpiContext.includes("over 2024") ||
    cpiContext.includes("over 2025")
  ) {
    return {
      metric_name: "CPI_FULL_YEAR_YOY",
      metric_label: "Consumer Price Index growth, full-year year-on-year",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: full year"])],
    };
  }

  if (
    metric.metric_name !== "CPI_GROWTH_YOY" &&
    metric.metric_name !== "CPI_GROWTH_MOM"
  ) {
    return metric;
  }

  if (comparisonBasis === "month_on_month") {
    return {
      metric_name: "CPI_GROWTH_MOM",
      metric_label: "Consumer Price Index growth, month-on-month",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: previous month"])],
    };
  }

  if (comparisonBasis === "year_on_year") {
    return {
      metric_name: "CPI_GROWTH_YOY",
      metric_label: "Consumer Price Index growth, year-on-year",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: from a year earlier"])],
    };
  }

  return metric;
}

function applyBusinessOutlookValueRouting(params: {
  metric: ReturnType<typeof inferMetricFromRegistry>;
  valueLocalContext: string;
  evidenceWindow: string;
}) {
  const { metric, valueLocalContext, evidenceWindow } = params;

  const combined = `${valueLocalContext} ${evidenceWindow}`.toLowerCase();

  const isBusinessOutlookContext =
    combined.includes("business outlook") ||
    combined.includes("business conditions") ||
    combined.includes("net weighted balance");

  if (!isBusinessOutlookContext) {
    return metric;
  }

  if (
    metric.metric_name !== "BUSINESS_OUTLOOK_NET_BALANCE" &&
    metric.metric_name !== "BUSINESS_OUTLOOK_UPBEAT_SHARE" &&
    metric.metric_name !== "BUSINESS_OUTLOOK_PESSIMISTIC_SHARE"
  ) {
    return metric;
  }

  const local = valueLocalContext.toLowerCase();

  if (local.includes("net weighted balance")) {
    return {
      metric_name: "BUSINESS_OUTLOOK_NET_BALANCE",
      metric_label: "Business outlook net weighted balance",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: net weighted balance"])],
    };
  }

  if (local.includes("upbeat")) {
    return {
      metric_name: "BUSINESS_OUTLOOK_UPBEAT_SHARE",
      metric_label: "Business outlook upbeat share",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: upbeat"])],
    };
  }

  if (
    local.includes("pessimistic") ||
    local.includes("deteriorating")
  ) {
    return {
      metric_name: "BUSINESS_OUTLOOK_PESSIMISTIC_SHARE",
      metric_label: "Business outlook pessimistic share",
      metric_match_score: metric.metric_match_score,
      matched_keywords: [...new Set([...metric.matched_keywords, "value-local: pessimistic"])],
    };
  }

  return metric;
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

      const matchIndex = match.index ?? 0;

      const smartContext = getSmartContext(summary, matchIndex);
      const evidenceWindow = smartContext.window;
      const valueLocalContext = getValueLocalContext(summary, matchIndex);

      const localComparisonBasis = classifyComparisonBasis(valueLocalContext);
      const windowComparisonBasis = classifyComparisonBasis(evidenceWindow);
      const comparisonBasis =
        localComparisonBasis !== "unknown" ? localComparisonBasis : windowComparisonBasis;

      const localDirection = classifyDirection(valueLocalContext);
      const windowDirection = classifyDirection(evidenceWindow);
      const direction = localDirection !== "unknown" ? localDirection : windowDirection;

      const inferredMetric = inferMetricFromRegistry(`${document.title} ${evidenceWindow}`, metrics);

      let metric = applyValueLocalMetricRouting({
        metric: inferredMetric,
        comparisonBasis,
        document,
        evidenceWindow,
      });

      metric = applyBusinessOutlookValueRouting({
        metric,
        valueLocalContext,
        evidenceWindow,
      });

      if (metric.metric_name === "CORPORATE_SECTOR_TOTAL_ASSETS_CHANGE_YOY") {
        const local = valueLocalContext.toLowerCase();

        if (
          local.includes("accounting for") ||
          local.includes("share of") ||
          local.includes("constituting") ||
          local.includes("represented")
        ) {
          metric = {
            metric_name: "UNCLASSIFIED_PERCENTAGE",
            metric_label: "Unclassified percentage",
            metric_match_score: 0,
            matched_keywords: ["rejected: corporate asset share"],
          };
        }
      }

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
        context_strategy: smartContext.strategy,
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
  console.error("Evidence extraction v5 failed:", error);
  process.exit(1);
});
