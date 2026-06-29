import fs from "fs";
import path from "path";

type MacroCase = {
  case_id?: string;
  domain?: string;
  macro_attribution_score?: number;
  attribution_band?: string;
  relevant_macro_drivers?: string[];
  macro_drivers?: string[];
  drivers?: string[];
};

type DriverConcentrationItem = {
  driver_id: string;
  cases_explained: number;
  case_share: number;
  domains_touched: string[];
  domain_count: number;
  concentration_band: "low" | "moderate" | "high" | "dominant";
  warning: string | null;
};

const ROOT = process.cwd();

const INPUT_CANDIDATES = [
  "data/intelligence/macro-attribution-engine-v0.2.json",
  "data/intelligence/macro-attribution-engine-v0.1.json",
  "data/intelligence/macro-attribution-report-v0.2.json",
  "data/intelligence/macro-attribution-report-v0.1.json",
];

const OUTPUT_PATH =
  "data/intelligence/macro-driver-concentration-engine-v0.1.json";

function readFirstExistingJson(paths: string[]): any {
  for (const rel of paths) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      return {
        source_path: rel,
        data: JSON.parse(fs.readFileSync(abs, "utf8")),
      };
    }
  }

  throw new Error(
    `No macro attribution input found. Checked:\n${paths.join("\n")}`
  );
}

function extractCases(raw: any): MacroCase[] {
  if (Array.isArray(raw)) return raw;

  const possibleKeys = [
    "cases",
    "case_macro_attribution",
    "case_macro_attributions",
    "macro_attributions",
    "macro_attribution_results",
    "attribution_results",
    "results",
    "case_results",
    "items",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(raw[key])) return raw[key];
  }

  // Fallback: find first array of objects that looks case-like
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const first = value[0] as any;
    if (!first || typeof first !== "object") continue;

    const keys = Object.keys(first);
    const looksCaseLike =
      keys.includes("case_id") ||
      keys.includes("domain") ||
      keys.includes("macro_attribution_score") ||
      keys.includes("attribution_band") ||
      keys.includes("macro_drivers") ||
      keys.includes("relevant_macro_drivers");

    if (looksCaseLike) {
      console.log(`Using detected case array: ${key}`);
      return value as MacroCase[];
    }
  }

  throw new Error(
    `Could not locate macro attribution case array in input file. Top-level keys: ${Object.keys(raw).join(", ")}`
  );
}

function getDrivers(item: MacroCase): string[] {
  const directDrivers = [
    ...(item.relevant_macro_drivers ?? []),
    ...(item.macro_drivers ?? []),
    ...(item.drivers ?? []),
  ];

  const nestedDrivers =
    Array.isArray((item as any).top_macro_drivers)
      ? (item as any).top_macro_drivers
          .map((d: any) => d.macro_key)
          .filter(Boolean)
      : [];

  return Array.from(new Set([...directDrivers, ...nestedDrivers]));
}

function concentrationBand(caseShare: number): DriverConcentrationItem["concentration_band"] {
  if (caseShare >= 0.8) return "dominant";
  if (caseShare >= 0.6) return "high";
  if (caseShare >= 0.35) return "moderate";
  return "low";
}

function warningFor(driverId: string, caseShare: number): string | null {
  if (caseShare >= 0.8) {
    return `${driverId} appears in nearly all cases. Review for 'explains everything' risk.`;
  }

  if (caseShare >= 0.6) {
    return `${driverId} has high replay concentration. Check whether it is too generic.`;
  }

  return null;
}

function main() {
  const input = readFirstExistingJson(INPUT_CANDIDATES);
  const cases = extractCases(input.data);

  const totalCases = cases.length;
  const driverMap = new Map<
    string,
    { cases: Set<string>; domains: Set<string> }
  >();

  for (const c of cases) {
    const caseId = c.case_id ?? "UNKNOWN_CASE";
    const domain = c.domain ?? "unknown_domain";

    for (const driver of getDrivers(c)) {
      if (!driverMap.has(driver)) {
        driverMap.set(driver, {
          cases: new Set(),
          domains: new Set(),
        });
      }

      driverMap.get(driver)!.cases.add(caseId);
      driverMap.get(driver)!.domains.add(domain);
    }
  }

  const concentration: DriverConcentrationItem[] = [...driverMap.entries()]
    .map(([driver_id, value]) => {
      const casesExplained = value.cases.size;
      const caseShare = totalCases === 0 ? 0 : casesExplained / totalCases;

      return {
        driver_id,
        cases_explained: casesExplained,
        case_share: Number(caseShare.toFixed(3)),
        domains_touched: [...value.domains].sort(),
        domain_count: value.domains.size,
        concentration_band: concentrationBand(caseShare),
        warning: warningFor(driver_id, caseShare),
      };
    })
    .sort((a, b) => b.case_share - a.case_share || b.domain_count - a.domain_count);

  const dominantDrivers = concentration.filter(
    (d) => d.concentration_band === "dominant"
  );

  const highDrivers = concentration.filter(
    (d) => d.concentration_band === "high"
  );

  const output = {
    engine_version: "macro-driver-concentration-engine-v0.1",
    generated_at: new Date().toISOString(),
    source_path: input.source_path,
    cases_assessed: totalCases,
    drivers_assessed: concentration.length,
    dominant_driver_count: dominantDrivers.length,
    high_concentration_driver_count: highDrivers.length,
    governance_note:
      "High concentration does not invalidate a macro driver. It flags drivers that may be too generic or over-attributed across replay cases.",
    concentration,
  };

  const absOut = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, JSON.stringify(output, null, 2));

  console.log({
    engine_version: output.engine_version,
    cases_assessed: output.cases_assessed,
    drivers_assessed: output.drivers_assessed,
    dominant_driver_count: output.dominant_driver_count,
    high_concentration_driver_count: output.high_concentration_driver_count,
    output: OUTPUT_PATH,
  });

  for (const item of concentration.slice(0, 10)) {
    console.log(
      `${item.concentration_band} | ${item.driver_id} | cases=${item.cases_explained}/${totalCases} | share=${item.case_share}`
    );
  }
}

main();
