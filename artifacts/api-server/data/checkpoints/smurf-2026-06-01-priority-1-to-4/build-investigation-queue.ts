import { readFile, writeFile } from "node:fs/promises";

const INPUT = "data/cases/case-index-v0.1.json";
const OUTPUT = "data/cases/investigation-queue-v0.1.json";

const PRIORITY_BUCKETS = ["critical", "high", "medium", "low"] as const;

type Priority = typeof PRIORITY_BUCKETS[number];

type CaseIndexItem = {
  case_id: string;
  file: string;
  country: string;
  table_id: string;
  period: string;
  series_no: string;
  series_name: string;
  case_status: string;
  priority: string;
  confidence: string;
  evidence_quality: string;
  next_action: string;
  publication_status: string;
  opened_at: string;
  last_updated_at: string;
};

function isOpenCase(item: CaseIndexItem): boolean {
  return item.case_status !== "closed";
}

function normalizePriority(value: string): Priority {
  if (PRIORITY_BUCKETS.includes(value as Priority)) {
    return value as Priority;
  }

  return "low";
}

function evidenceRank(value: string): number {
  if (value === "poor") return 1;
  if (value === "limited") return 2;
  if (value === "good") return 3;
  return 4;
}

function confidenceRank(value: string): number {
  if (value === "unknown") return 1;
  if (value === "low") return 2;
  if (value === "medium") return 3;
  if (value === "high") return 4;
  return 5;
}

function sortCases(a: CaseIndexItem, b: CaseIndexItem): number {
  const evidenceDiff =
    evidenceRank(a.evidence_quality) - evidenceRank(b.evidence_quality);

  if (evidenceDiff !== 0) return evidenceDiff;

  const confidenceDiff =
    confidenceRank(a.confidence) - confidenceRank(b.confidence);

  if (confidenceDiff !== 0) return confidenceDiff;

  return (
    new Date(b.last_updated_at).getTime() -
    new Date(a.last_updated_at).getTime()
  );
}

function toQueueItem(item: CaseIndexItem, index: number) {
  return {
    queue_position: index + 1,
    case_id: item.case_id,
    file: item.file,
    country: item.country,
    table_id: item.table_id,
    period: item.period,
    series_no: item.series_no,
    series_name: item.series_name,
    case_status: item.case_status,
    priority: item.priority,
    confidence: item.confidence,
    evidence_quality: item.evidence_quality,
    next_action: item.next_action,
    publication_status: item.publication_status,
    opened_at: item.opened_at,
    last_updated_at: item.last_updated_at,
  };
}

async function main() {
  const input = JSON.parse(await readFile(INPUT, "utf8"));

  const queue: Record<Priority, ReturnType<typeof toQueueItem>[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  const openCases: CaseIndexItem[] = input.cases.filter(isOpenCase);

  for (const item of openCases) {
    const bucket = normalizePriority(item.priority);
    queue[bucket].push(item as any);
  }

  for (const bucket of PRIORITY_BUCKETS) {
    queue[bucket] = (queue[bucket] as any[])
      .sort(sortCases)
      .map(toQueueItem);
  }

  const output = {
    queue_version: "investigation-queue-v0.1",
    generated_at: new Date().toISOString(),
    source_file: INPUT,
    summary: {
      total_open_cases: openCases.length,
      critical: queue.critical.length,
      high: queue.high.length,
      medium: queue.medium.length,
      low: queue.low.length,
    },
    critical: queue.critical,
    high: queue.high,
    medium: queue.medium,
    low: queue.low,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log(`Investigation queue written to ${OUTPUT}`);
  console.log(output.summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
