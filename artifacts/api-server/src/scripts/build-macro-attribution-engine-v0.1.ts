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

function domainMacroBoost(domain: string, macroKey: string): number {
  const d = domain.toLowerCase();

  if (d.includes("semiconductor") || d.includes("electronics")) {
    if (macroKey === "GLOBAL_SEMICONDUCTOR_SALES") return 0.2;
    if (macroKey === "SINGAPORE_NODX") return 0.12;
  }

  if (d.includes("petroleum")) {
    if (macroKey === "BRENT_CRUDE") return 0.2;
    if (macroKey === "GLOBAL_TRADE_VOLUME") return 0.08;
  }

  if (d.includes("services")) {
    if (macroKey === "SINGAPORE_GDP") return 0.16;
    if (macroKey === "FED_FUNDS_RATE") return 0.06;
  }

  if (d.includes("manufacturing")) {
    if (macroKey === "SINGAPORE_MANUFACTURING") return 0.18;
    if (macroKey === "GLOBAL_PMI") return 0.12;
  }

  return 0;
}

const fleetRun =
  readJsonSafe(path.join(ROOT, "data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json")) || {};

const transmission =
  readJsonSafe(path.join(ROOT, "data/intelligence/macro-transmission-engine-v0.1.json")) || {};

const reputation =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-reputation-engine-v0.1.json")) || {};

const caseOutputs: any[] = fleetRun.case_outputs || [];
const transmissionItems: any[] = transmission.transmission_items || [];
const reputationItems: any[] = reputation.reputation_items || [];

const reputationByMechanism = new Map(reputationItems.map((r) => [r.mechanism_id, r]));

const caseAttributions = caseOutputs.map((caseOutput) => {
  const detectedMechanisms = Object.keys(
  caseOutput.mechanism_counts || {}
).map((m) => m.split("_").slice(0, 2).join("_"));

  const candidateDrivers = transmissionItems
    .filter((t) => detectedMechanisms.includes(t.mechanism_id))
    .map((t) => {
      const rep = reputationByMechanism.get(t.mechanism_id);
      const reputationScore = Number(rep?.reputation_score ?? 0.35);
      const domainBoost = domainMacroBoost(caseOutput.domain || "", t.macro_key);
      const attributionScore = clamp(
        t.transmission_score * 0.55 +
          reputationScore * 0.25 +
          domainBoost +
          0.05
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
        domain_boost: Number(domainBoost.toFixed(3)),
        macro_attribution_score: Number(attributionScore.toFixed(3)),
        macro_attribution_band:
          attributionScore >= 0.75
            ? "strong_macro_context"
            : attributionScore >= 0.55
              ? "moderate_macro_context"
              : attributionScore >= 0.35
                ? "weak_macro_context"
                : "limited_macro_context"
      };
    })
    .sort((a, b) => b.macro_attribution_score - a.macro_attribution_score);

  const topDrivers = candidateDrivers.slice(0, 5);

  const globalDrivers = topDrivers.filter((d) =>
    ["global_growth", "external_demand", "sector_global_cycle", "commodity_cycle", "financial_conditions", "global_trade", "regional_trade_cycle"].includes(d.macro_category)
  );

  const nationalDrivers = topDrivers.filter((d) =>
    ["national_macro", "national_trade", "national_sector"].includes(d.macro_category)
  );

  const avgTopScore =
    topDrivers.length > 0
      ? topDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0) / topDrivers.length
      : 0;

  const globalMacroShare =
    topDrivers.length > 0
      ? globalDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0) /
        topDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0)
      : 0;

  const nationalShare =
    topDrivers.length > 0
      ? nationalDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0) /
        topDrivers.reduce((sum, d) => sum + d.macro_attribution_score, 0)
      : 0;

  const sectorSpecificShare = clamp(1 - globalMacroShare - nationalShare);

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
      global_macro_share: Number(globalMacroShare.toFixed(3)),
      national_macro_share: Number(nationalShare.toFixed(3)),
      sector_or_idiosyncratic_share: Number(sectorSpecificShare.toFixed(3))
    },
    top_macro_drivers: topDrivers,
    governance: {
      macro_attribution_is_explanatory_not_causal_proof: true,
      macro_context_must_not_override_case_evidence: true,
      observed_macro_data_not_yet_loaded: true,
      synthetic_replay_context_only: true
    }
  };
});

const output = {
  registry_version: "macro-attribution-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_attribution_explains_environment_not_truth: true,
    attribution_split_is_estimated_context: true,
    observed_macro_data_required_for_production_use: true,
    evidence_remains_primary: true
  },
  inputs: {
    replay_cases: caseOutputs.length,
    macro_transmission_items: transmissionItems.length,
    mechanism_reputation_items: reputationItems.length
  },
  summary: {
    cases_attributed: caseAttributions.length,
    strong_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "strong_macro_explanation").length,
    moderate_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "moderate_macro_explanation").length,
    weak_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "weak_macro_explanation").length,
    limited_macro_explanation: caseAttributions.filter((x) => x.macro_attribution_band === "limited_macro_explanation").length
  },
  case_macro_attributions: caseAttributions
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-attribution-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/macro-attribution-engine-v0.1.json"
});

console.table(
  caseAttributions.map((c) => ({
    case_id: c.case_id,
    domain: c.domain,
    score: c.macro_attribution_score,
    band: c.macro_attribution_band,
    global: c.attribution_split.global_macro_share,
    national: c.attribution_split.national_macro_share,
    sector: c.attribution_split.sector_or_idiosyncratic_share
  }))
);
