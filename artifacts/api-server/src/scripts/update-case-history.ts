import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";
const HISTORY_DIR = "data/case-history";

const CASE_FILE_PREFIX = "case-SG-";
const CASE_FILE_SUFFIX = ".json";

type TimelineEvent = {
  timestamp: string;
  event_type: string;
  case_status: string;
  conclusion_status: string;
  confidence: string;
  confidence_reason?: any;
  outcome?: any;
  evidence_quality: string;
  next_action: string;
  publication_status: string;
  observation?: {
    latest_value?: number;
    month_on_month_change_pct?: number;
    year_on_year_change_pct?: number;
  };
  attribution_snapshot?: {
    market_effect: number;
    portfolio_effect: number;
    operational_effect: number;
    policy_effect: number;
    unknown_effect: number;
  };
  note: string;
};

function historyPath(caseId: string): string {
  return path.join(HISTORY_DIR, `${caseId}.json`);
}

function attributionSnapshot(caseFile: any) {
  return {
    market_effect: caseFile.attribution?.market_effect?.score ?? 0,
    portfolio_effect: caseFile.attribution?.portfolio_effect?.score ?? 0,
    operational_effect: caseFile.attribution?.operational_effect?.score ?? 0,
    policy_effect: caseFile.attribution?.policy_effect?.score ?? 0,
    unknown_effect: caseFile.attribution?.unknown_effect?.score ?? 10,
  };
}

function eventFromCase(caseFile: any): TimelineEvent {
  return {
    timestamp: new Date().toISOString(),
    event_type: "case_snapshot",
    case_status: caseFile.case_status,
    conclusion_status:
      caseFile.conclusion_status ?? "no_conclusion_yet",
    confidence: caseFile.confidence ?? "unknown",
    confidence_reason: caseFile.confidence_reason,
    outcome: caseFile.outcome,
    evidence_quality: 
      caseFile.evidence_status?.evidence_quality ?? "unknown",
    next_action:
      caseFile.workflow?.next_action ?? "unknown",
    publication_status:
      caseFile.workflow?.publication_status ?? "not_published",
    observation: caseFile.observation,
    attribution_snapshot: attributionSnapshot(caseFile),
    note: "Case history snapshot recorded from current persistent case file.",
  };
}

function isDuplicateLatestEvent(history: any, event: TimelineEvent): boolean {
  const latest = history.timeline?.[history.timeline.length - 1];

  if (!latest) return false;

  return (
    latest.case_status === event.case_status &&
    latest.conclusion_status === event.conclusion_status &&
    latest.confidence === event.confidence &&
    JSON.stringify(latest.confidence_reason) ===
      JSON.stringify(event.confidence_reason) &&
    JSON.stringify(latest.outcome) ===
      JSON.stringify(event.outcome) &&
    latest.evidence_quality === event.evidence_quality &&
    latest.next_action === event.next_action &&
    latest.publication_status === event.publication_status &&
    JSON.stringify(latest.observation) === JSON.stringify(event.observation) &&
    JSON.stringify(latest.attribution_snapshot) ===
      JSON.stringify(event.attribution_snapshot)
  );
}

async function readExistingHistory(caseFile: any) {
  const filePath = historyPath(caseFile.case_id);

  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return {
      case_history_version: "case-history-v0.1",
      case_id: caseFile.case_id,
      country: caseFile.country,
      table_id: caseFile.table_id,
      period: caseFile.period,
      series_no: caseFile.series_no,
      series_name: caseFile.series_name,
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      timeline: [],
    };
  }
}

async function main() {
  await mkdir(HISTORY_DIR, { recursive: true });

  const files = await readdir(CASE_DIR);

  const caseFiles = files
    .filter((file) => file.startsWith(CASE_FILE_PREFIX))
    .filter((file) => file.endsWith(CASE_FILE_SUFFIX))
    .sort();

  const results = [];

  for (const file of caseFiles) {
    const casePath = path.join(CASE_DIR, file);
    const caseFile = JSON.parse(await readFile(casePath, "utf8"));

    const history = await readExistingHistory(caseFile);
    const event = eventFromCase(caseFile);

    let event_written = false;

    if (!isDuplicateLatestEvent(history, event)) {
      history.timeline.push(event);
      history.last_updated_at = event.timestamp;
      event_written = true;
    }

    await writeFile(
      historyPath(caseFile.case_id),
      JSON.stringify(history, null, 2),
      "utf8",
    );

    results.push({
      case_id: caseFile.case_id,
      history_file: historyPath(caseFile.case_id),
      event_written,
      timeline_events: history.timeline.length,
    });
  }

  console.log({
    case_history_engine_version: "case-history-v0.1",
    cases_processed: results.length,
    events_written: results.filter((item) => item.event_written).length,
    results,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
