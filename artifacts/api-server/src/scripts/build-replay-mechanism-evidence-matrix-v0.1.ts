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

const outcomes =
  readJsonSafe(path.join(ROOT, "data/intelligence/historical-outcomes-v0.2.json")) ||
  readJsonSafe(path.join(ROOT, "data/intelligence/historical-outcomes-v0.1.json")) ||
  {};

const linker =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json")) || {};

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const outcomeItems: any[] =
  outcomes.historical_outcomes ||
  outcomes.outcomes ||
  outcomes.items ||
  [];

const mechanismLinks: any[] = linker.links || [];

const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

function textOf(x: any): string {
  return JSON.stringify(x || {}).toLowerCase();
}

function mechanismTerms(mechanismId: string): string[] {
  if (mechanismId === "MKT_002") return ["inventory", "restocking", "manufacturing", "production", "output", "electronics", "semiconductor"];
  if (mechanismId === "MKT_006") return ["policy", "regulatory", "government", "incentive", "investment", "inflation", "rate", "gdp"];
  if (mechanismId === "MKT_010") return ["demand", "exports", "export", "nodx", "trade", "orders", "pmi", "downturn"];
  return [];
}

function getMechanismId(x: any): string {
  return String(x.driver_id || x.mechanism_id || x.id || "UNKNOWN");
}

function getMechanismName(x: any): string {
  return String(x.driver_name || x.mechanism_name || x.name || "Unknown Mechanism");
}

function inferOutcomeDirection(outcome: any): "supports" | "contradicts" | "neutral" {
  const text = textOf(outcome);

  if (
    text.includes("recovered") ||
    text.includes("improved") ||
    text.includes("expanded") ||
    text.includes("rose") ||
    text.includes("increased") ||
    text.includes("growth")
  ) return "supports";

  if (
    text.includes("failed") ||
    text.includes("declined") ||
    text.includes("contracted") ||
    text.includes("weakened") ||
    text.includes("downturn")
  ) return "contradicts";

  return "neutral";
}

function scoreOutcomeMechanismFit(outcome: any, mechanismId: string): number {
  const text = textOf(outcome);
  const terms = mechanismTerms(mechanismId);
  const hits = terms.filter((t) => text.includes(t)).length;

  if (!hits) return 0;

  return clamp(hits / Math.max(terms.length, 1));
}

const matrixRows: any[] = [];

for (const mechanism of lifecycleItems) {
  const mechanismId = getMechanismId(mechanism);
  const mechanismName = getMechanismName(mechanism);

  for (const outcome of outcomeItems) {
    const fitScore = scoreOutcomeMechanismFit(outcome, mechanismId);
    if (fitScore <= 0) continue;

    const direction = inferOutcomeDirection(outcome);

    const relatedCurrentLinks = mechanismLinks.filter((l) => l.mechanism_id === mechanismId);
    const avgCurrentLinkStrength =
      relatedCurrentLinks.length > 0
        ? relatedCurrentLinks.reduce((sum, l) => sum + Number(l.link_strength ?? 0), 0) / relatedCurrentLinks.length
        : 0;

    const replay_support_score = clamp(
      fitScore * 0.55 +
        avgCurrentLinkStrength * 0.25 +
        (direction === "supports" ? 0.2 : direction === "neutral" ? 0.1 : 0)
    );

    matrixRows.push({
      matrix_id: `RME_${String(matrixRows.length + 1).padStart(5, "0")}`,
      mechanism_id: mechanismId,
      mechanism_name: mechanismName,
      lifecycle_status: mechanism.lifecycle_status || "unknown",
      historical_outcome_id: outcome.outcome_id || outcome.id || `OUTCOME_${String(matrixRows.length + 1).padStart(5, "0")}`,
      historical_period: outcome.period || outcome.year || outcome.date || null,
      historical_case: outcome.case_id || outcome.replay_id || outcome.name || outcome.title || "unknown_case",
      outcome_direction: direction,
      outcome_mechanism_fit_score: Number(fitScore.toFixed(3)),
      current_average_link_strength: Number(avgCurrentLinkStrength.toFixed(3)),
      replay_support_score: Number(replay_support_score.toFixed(3)),
      governance: {
        replay_support_is_not_validation: true,
        historical_similarity_must_never_override_current_evidence: true,
        past_results_do_not_guarantee_future_outcomes: true,
      },
    });
  }
}

const mechanismSummaries = lifecycleItems.map((mechanism) => {
  const mechanismId = getMechanismId(mechanism);
  const rows = matrixRows.filter((r) => r.mechanism_id === mechanismId);

  const supporting = rows.filter((r) => r.outcome_direction === "supports");
  const contradicting = rows.filter((r) => r.outcome_direction === "contradicts");
  const neutral = rows.filter((r) => r.outcome_direction === "neutral");

  const avgSupport =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + Number(r.replay_support_score), 0) / rows.length
      : 0;

  const supportRatio =
    rows.length > 0
      ? supporting.length / rows.length
      : 0;

  return {
    mechanism_id: mechanismId,
    mechanism_name: getMechanismName(mechanism),
    lifecycle_status: mechanism.lifecycle_status || "unknown",
    historical_rows: rows.length,
    supporting_cases: supporting.length,
    contradicting_cases: contradicting.length,
    neutral_cases: neutral.length,
    support_ratio: Number(supportRatio.toFixed(3)),
    average_replay_support_score: Number(avgSupport.toFixed(3)),
    top_replay_rows: rows
      .slice()
      .sort((a, b) => b.replay_support_score - a.replay_support_score)
      .slice(0, 8),
  };
});

const output = {
  registry_version: "replay-mechanism-evidence-matrix-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    replay_matrix_is_evidence_mapping_not_validation: true,
    historical_similarity_must_never_override_current_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    historical_outcome_items: outcomeItems.length,
    mechanism_links: mechanismLinks.length,
    lifecycle_items: lifecycleItems.length,
  },
  summary: {
    matrix_rows: matrixRows.length,
    mechanisms_processed: mechanismSummaries.length,
  },
  mechanism_summaries: mechanismSummaries,
  matrix_rows: matrixRows,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/replay-mechanism-evidence-matrix-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/replay-mechanism-evidence-matrix-v0.1.json",
});

console.table(
  mechanismSummaries.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism: m.mechanism_name,
    rows: m.historical_rows,
    support: m.supporting_cases,
    contradict: m.contradicting_cases,
    ratio: m.support_ratio,
    avg: m.average_replay_support_score,
  }))
);

