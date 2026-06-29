import fs from "node:fs";
import path from "node:path";

const sourcePath = "data/dataset-pilots/m355381-all-series.json";
const outputDir = "data/historical-replay/m355381";
const casesDir = path.join(outputDir, "candidate-cases");
const outputPath = path.join(outputDir, "historical-case-candidates-v0.1.json");

const START_YEAR = 2020;
const END_YEAR = 2022;

const MIN_ABS_YOY_CHANGE_PCT = 20;
const MIN_ABS_MOM_CHANGE_PCT = 15;

type Column = {
  key: string;
  value: string;
};

type Row = {
  seriesNo: string;
  rowText: string;
  uoM: string;
  columns: Column[];
};

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseValue(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseYear(period: string): number | null {
  const match = period.match(/^(\d{4})\s/);
  return match ? Number(match[1]) : null;
}

function safeSeriesNo(seriesNo: string) {
  return seriesNo.replace(/\./g, "_");
}

function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function priorityFromChange(yoy: number | null, mom: number | null) {
  const absYoy = Math.abs(yoy ?? 0);
  const absMom = Math.abs(mom ?? 0);

  if (absYoy >= 50 || absMom >= 30) return "critical";
  if (absYoy >= 30 || absMom >= 20) return "high";
  return "medium";
}

function directionFromChange(yoy: number | null, mom: number | null) {
  const main = yoy ?? mom ?? 0;
  if (main > 0) return "increase";
  if (main < 0) return "decrease";
  return "flat";
}

fs.mkdirSync(casesDir, { recursive: true });

const source = readJson(sourcePath);
const rows: Row[] = source?.Data?.row ?? [];

const candidates: any[] = [];

for (const row of rows) {
  const observations = row.columns
    .map((column) => ({
      period: column.key,
      year: parseYear(column.key),
      value: parseValue(column.value),
    }))
    .filter((x) => x.year !== null && x.value !== null);

  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    if (!obs.year || obs.year < START_YEAR || obs.year > END_YEAR || obs.value === null) {
      continue;
    }

    const prevMonth = observations[i - 1];
    const prevYear = observations[i - 12];

    const mom = prevMonth?.value !== null && prevMonth?.value !== undefined
      ? pctChange(obs.value, prevMonth.value)
      : null;

    const yoy = prevYear?.value !== null && prevYear?.value !== undefined
      ? pctChange(obs.value, prevYear.value)
      : null;

    const isCandidate =
      Math.abs(yoy ?? 0) >= MIN_ABS_YOY_CHANGE_PCT ||
      Math.abs(mom ?? 0) >= MIN_ABS_MOM_CHANGE_PCT;

    if (!isCandidate) continue;

    const caseId = `SG-M355381-${safeSeriesNo(row.seriesNo)}-${obs.period.toLowerCase().replace(/\s+/g, "-")}`;

    const candidate = {
      case_version: "historical-case-candidate-v0.1",
      case_id: caseId,
      country: "Singapore",
      institution: "Economic Development Board",
      source_system: "SingStat TableBuilder",
      table_id: "M355381",
      period: obs.period,
      series_no: row.seriesNo,
      series_name: row.rowText,
      case_status: "candidate",
      conclusion_status: "not_started",
      priority: priorityFromChange(yoy, mom),
      direction: directionFromChange(yoy, mom),
      observation: {
        latest_value: obs.value,
        month_on_month_change_pct: mom,
        year_on_year_change_pct: yoy,
      },
      candidate_reason: {
        rule: "large_movement_detection_v0.1",
        min_abs_yoy_change_pct: MIN_ABS_YOY_CHANGE_PCT,
        min_abs_mom_change_pct: MIN_ABS_MOM_CHANGE_PCT,
        explanation:
          "Candidate generated because monthly or year-on-year movement exceeded historical replay threshold.",
      },
      evidence_status: {
        internal_evidence_count: 0,
        relevant_evidence_count: 0,
        evidence_quality: "unknown",
        external_search_required: true,
        relevant_evidence: [],
      },
      attribution: {
        market_effect: { score: 0, evidence: [] },
        portfolio_effect: { score: 0, evidence: [] },
        operational_effect: { score: 0, evidence: [] },
        policy_effect: { score: 0, evidence: [] },
        unknown_effect: { score: 10, evidence: [] },
      },
      outcome: {
        primary_driver: null,
        primary_driver_name: null,
        confidence: null,
        closed_at: null,
      },
      replay_policy: {
        sandbox_only: true,
        production_mutation_allowed: false,
      },
    };

    candidates.push(candidate);
  }
}

candidates.sort((a, b) => {
  const pa = String(a.period);
  const pb = String(b.period);
  return pa.localeCompare(pb);
});

for (const candidate of candidates) {
  const filePath = path.join(casesDir, `${candidate.case_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(candidate, null, 2));
}

const summary = {
  source_table: "M355381",
  source_path: sourcePath,
  period_filter: {
    start_year: START_YEAR,
    end_year: END_YEAR,
  },
  thresholds: {
    min_abs_yoy_change_pct: MIN_ABS_YOY_CHANGE_PCT,
    min_abs_mom_change_pct: MIN_ABS_MOM_CHANGE_PCT,
  },
  rows_scanned: rows.length,
  candidate_cases: candidates.length,
  by_priority: candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.priority] = (acc[c.priority] ?? 0) + 1;
    return acc;
  }, {}),
  by_direction: candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.direction] = (acc[c.direction] ?? 0) + 1;
    return acc;
  }, {}),
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      historical_case_candidates_version: "historical-case-candidates-v0.1",
      generated_at: new Date().toISOString(),
      policy: {
        principle:
          "Historical case candidates are sandbox-only and must not mutate production cases.",
        production_mutation_allowed: false,
      },
      summary,
      candidates,
    },
    null,
    2
  )
);

console.log({
  historical_case_candidates_version: "historical-case-candidates-v0.1",
  ...summary,
  output: outputPath,
  candidate_cases_dir: casesDir,
});
