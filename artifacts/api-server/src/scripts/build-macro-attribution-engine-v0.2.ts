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

function clamp(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeMechanismId(id: string): string {
  if (id.includes("MKT_002")) return "MKT_002";
  if (id.includes("MKT_006")) return "MKT_006";
  if (id.includes("MKT_010")) return "MKT_010";
  return id;
}

const fleetRun =
  readJsonSafe(path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json")) || {};

const transmission =
  readJsonSafe(path.join(ROOT, "data/intelligence/macro-transmission-engine-v0.1.json")) || {};

const reputation =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-reputation-engine-v0.1.json")) || {};

const relevance =
  readJsonSafe(path.join(ROOT, "data/intelligence/macro-domain-relevance-engine-v0.1.json")) || {};

const caseOutputs: any[] = fleetRun.case_outputs || [];
const transmissionItems: any[] = transmission.transmission_items || [];
const reputationItems: any[] = reputation.reputation_items || [];
const relevanceRules: any[] = relevance.relevance_rules || [];

const reputationByMechanism = new Map(reputationItems.map((r) => [r.mechanism_id, r]));
const relevanceByDomain = new Map(relevanceRules.map((r) => [r.domain, r]));

function relevanceAdjustment(domain: string, macroKey: string): number {
  const rule = relevanceByDomain.get(String(domain || "").toLowerCase());
  if (!rule) return 0;

  if ((rule.preferred_macro_keys || []).includes(macroKey)) return 0.14;
  if ((rule.penalized_macro_keys || []).includes(macroKey)) return -0.22;

  return -0.04;
}

const caseAttributions = caseOutputs.map((caseOutput) => {
  const detectedMechanisms = Object.keys(caseOutput.mechanism_counts || {}).map(normalizeMechanismId);

  const candidateDrivers = transmissionItems
    .filter((t) => detectedMechanisms.includes(t.mechanism_id))
    .map((t) => {
      const rep = reputationByMechanism.get(t.mechanism_id);
      const reputationScore = Number(rep?.reputation_score ?? 0.35);
      const relevanceScore = relevanceAdjustment(caseOutput.domain || "", t.macro_key);

      const attributionScore = clamp(
        t.transmission_score * 0.52 +
          reputationScore * 0.24 +
          relevanceScore +
          0.06
      );

      return {
        macro_key: t.macro_key,
        macro_name: t.macro_name,
        macro_category: t.macro_category,
        mechanism_id: t.mechanism_id,
        mechanism_name: t.mechanism_name,
        channel: t.channel,
        transmission_score: t.transmission_score,
        mechanism_reputation_score: reputationScore,
        domain_relevance_adjustment: Number(relevanceScore.toFixed(3)),
        macro_attribution_score: Number(attributionScore.toFixed(3)),
        macro_attribution_band:
          attributionScore >= 0.75
            ? "strong_macro_context"
            : attributionScore >= 0.55
              ? "moderate_macro_context"
              : attributionScore >= 0.35
                ? "weak_macro_context"
                : "limited_macro_context",
      };
    })
    .filter((d) => d.macro_attribution_score >= 0.35)
    .sort((a, b) => b.macro_attribution_score - a.macro_attribution_score);

  const topDrivers = candidateDrivers.slice(0, 5);

  const total = topDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0);

  const globalCategories = [
    "global_growth",
    "external_demand",
    "sector_global_cycle",
    "commodity_cycle",
    "financial_conditions",
    "global_trade",
    "regional_trade_cycle",
  ];

  const nationalCategories = ["national_macro", "national_trade", "national_sector"];

  const globalShare =
    total > 0
      ? topDrivers
          .filter((d) => globalCategories.includes(d.macro_category))
          .reduce((sum, d) => sum + d.macro_attribution_score, 0) / total
      : 0;

  const nationalShare =
    total > 0
      ? topDrivers
          .filter((d) => nationalCategories.includes(d.macro_category))
          .reduce((sum, d) => sum + d.macro_attribution_score, 0) / total
      : 0;

  const sectorShare = clamp(1 - globalShare - nationalShare);

  const avgTopScore =
    topDrivers.length > 0
      ? topDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0) / topDrivers.length
      : 0;

  return {
    case_id: caseOutput.case_id,
    case_label: caseOutput.case_label,
    domain: caseOutput.domain,
    detected_mechanisms: detectedMechanisms,
    macro_attribution_score: Number(avgTopScore.toFixed(3)),
    macro_attribution_band:
      avgTopScore >= 0.75
        ? "strong_macro_explanation"
        : avgTopScore >= 0.55
          ? "moderate_macro_explanation"
          : avgTopScore >= 0.35
            ? "weak_macro_explanation"
            : "limited_macro_explanation",
    attribution_split: {
      global_macro_share: Number(globalShare.toFixed(3)),
      national_macro_share: Number(nationalShare.toFixed(3)),
      sector_or_idiosyncratic_share: Number(sectorShare.toFixed(3)),
    },
    top_macro_drivers: topDrivers,
    governance: {
      macro_attribution_is_explanatory_not_causal_proof: true,
      domain_relevance_filter_applied: true,
      macro_context_must_not_override_case_evidence: true,
      observed_macro_data_not_yet_loaded: true,
      synthetic_replay_context_only: true,
    },
  };
});

const output = {
  registry_version: "macro-attribution-engine-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_attribution_explains_environment_not_truth: true,
    domain_relevance_filter_reduces_noise: true,
    attribution_split_is_estimated_context: true,
    observed_macro_data_required_for_production_use: true,
    evidence_remains_primary: true,
  },
  inputs: {
    replay_cases: caseOutputs.length,
    macro_transmission_items: transmissionItems.length,
    mechanism_reputation_items: reputationItems.length,
    relevance_domains: relevanceRules.length,
  },
  summary: {
    cases_attributed: caseAttributions.length,
    strong_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "strong_macro_explanation").length,
    moderate_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "moderate_macro_explanation").length,
    weak_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "weak_macro_explanation").length,
    limited_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "limited_macro_explanation").length,
  },
  case_macro_attributions: caseAttributions,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-attribution-engine-v0.2.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/macro-attribution-engine-v0.2.json",
});

console.table(
  caseAttributions.map((c) => ({
    case_id: c.case_id,
    domain: c.domain,
    score: c.macro_attribution_score,
    band: c.macro_attribution_band,
    global: c.attribution_split.global_macro_share,
    national: c.attribution_split.national_macro_share,
    sector: c.attribution_split.sector_or_idiosyncratic_share,
  }))
);
