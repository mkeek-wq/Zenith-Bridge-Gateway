import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/macro-attribution-engine-v0.2.json";

const CONCENTRATION_PATH =
  "data/intelligence/macro-driver-concentration-engine-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/driver-diversity-engine-v0.1.json";

type MacroDriver = {
  macro_key: string;
  macro_name?: string;
  macro_category?: string;
  mechanism_id?: string;
  mechanism_name?: string;
  macro_attribution_score?: number;
};

type CaseAttribution = {
  case_id: string;
  case_label?: string;
  domain?: string;
  detected_mechanisms?: string[];
  top_macro_drivers?: MacroDriver[];
};

type DiversityBand =
  | "strong_diversity"
  | "adequate_diversity"
  | "thin_diversity"
  | "over_concentrated";

function readJson(relPath: string): any {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing input: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function classifyDriver(driver: MacroDriver): string {
  const key = driver.macro_key ?? "";
  const category = driver.macro_category ?? "";

  if (category.includes("global")) return "global_macro";
  if (category.includes("national")) return "national_macro";
  if (category.includes("sector")) return "sector_specific";

  if (
    key.includes("GLOBAL") ||
    key.includes("FED") ||
    key.includes("CHINA") ||
    key.includes("BRENT")
  ) {
    return "global_macro";
  }

  if (key.includes("SINGAPORE")) return "national_macro";

  return "other_macro";
}

function diversityBand(score: number, dominantShare: number): DiversityBand {
  if (dominantShare >= 0.75) return "over_concentrated";
  if (score >= 0.75) return "strong_diversity";
  if (score >= 0.5) return "adequate_diversity";
  return "thin_diversity";
}

function main() {
  const macro = readJson(INPUT_PATH);
  const concentration = readJson(CONCENTRATION_PATH);

  const concentrationMap = new Map<string, string>();
  for (const item of concentration.concentration ?? []) {
    concentrationMap.set(item.driver_id, item.concentration_band);
  }

  const cases: CaseAttribution[] = macro.case_macro_attributions ?? [];

  const caseDiversity = cases.map((c) => {
    const drivers = c.top_macro_drivers ?? [];
    const uniqueDrivers = Array.from(
      new Map(drivers.map((d) => [d.macro_key, d])).values()
    );

    const categories = uniqueDrivers.map(classifyDriver);
    const uniqueCategories = Array.from(new Set(categories));

    const dominantOrHighDrivers = uniqueDrivers.filter((d) => {
      const band = concentrationMap.get(d.macro_key);
      return band === "dominant" || band === "high";
    });

    const dominantShare =
      uniqueDrivers.length === 0
        ? 0
        : dominantOrHighDrivers.length / uniqueDrivers.length;

    const sectorSpecificDrivers = uniqueDrivers.filter(
      (d) => classifyDriver(d) === "sector_specific"
    );

    const mechanismCount = new Set(
      drivers.map((d) => d.mechanism_id).filter(Boolean)
    ).size;

    const categoryScore = Math.min(uniqueCategories.length / 4, 1);
    const sectorScore = sectorSpecificDrivers.length > 0 ? 1 : 0;
    const mechanismScore = Math.min(mechanismCount / 2, 1);
    const concentrationPenalty = dominantShare * 0.35;

    const diversityScore = Math.max(
      0,
      Math.min(
        1,
        categoryScore * 0.4 +
          sectorScore * 0.25 +
          mechanismScore * 0.35 -
          concentrationPenalty
      )
    );

    const band = diversityBand(diversityScore, dominantShare);

    return {
      case_id: c.case_id,
      case_label: c.case_label ?? null,
      domain: c.domain ?? "unknown_domain",
      macro_driver_count: drivers.length,
      unique_macro_driver_count: uniqueDrivers.length,
      driver_categories: uniqueCategories.sort(),
      detected_mechanism_count: mechanismCount,
      dominant_or_high_driver_count: dominantOrHighDrivers.length,
      dominant_or_high_driver_share: Number(dominantShare.toFixed(3)),
      sector_specific_driver_count: sectorSpecificDrivers.length,
      diversity_score: Number(diversityScore.toFixed(3)),
      diversity_band: band,
      interpretation:
        band === "over_concentrated"
          ? "Case explanation is heavily dependent on dominant or high-concentration macro drivers."
          : band === "thin_diversity"
          ? "Case explanation has limited driver variety and should be strengthened with more specific evidence."
          : band === "adequate_diversity"
          ? "Case explanation has acceptable driver variety for current replay stage."
          : "Case explanation has strong macro/mechanism diversity.",
    };
  });

  const output = {
    engine_version: "driver-diversity-engine-v0.1",
    generated_at: new Date().toISOString(),
    inputs: {
      macro_attribution: INPUT_PATH,
      concentration_engine: CONCENTRATION_PATH,
    },
    cases_assessed: caseDiversity.length,
    strong_diversity: caseDiversity.filter(
      (c) => c.diversity_band === "strong_diversity"
    ).length,
    adequate_diversity: caseDiversity.filter(
      (c) => c.diversity_band === "adequate_diversity"
    ).length,
    thin_diversity: caseDiversity.filter(
      (c) => c.diversity_band === "thin_diversity"
    ).length,
    over_concentrated: caseDiversity.filter(
      (c) => c.diversity_band === "over_concentrated"
    ).length,
    governance_note:
      "Driver diversity is a diagnostic control. It does not validate or invalidate case explanations; it flags over-reliance on broad macro indicators.",
    case_diversity: caseDiversity,
  };

  const outAbs = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(output, null, 2));

  console.log({
    engine_version: output.engine_version,
    cases_assessed: output.cases_assessed,
    strong_diversity: output.strong_diversity,
    adequate_diversity: output.adequate_diversity,
    thin_diversity: output.thin_diversity,
    over_concentrated: output.over_concentrated,
    output: OUTPUT_PATH,
  });

  for (const c of caseDiversity) {
    console.log(
      `${c.diversity_band} | ${c.case_id} | score=${c.diversity_score} | dominant_share=${c.dominant_or_high_driver_share}`
    );
  }
}

main();
