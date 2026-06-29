import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/driver-diversity-engine-v0.1.json";

const OUTPUT_PATH =
  "exports/macro-reports/driver-diversity-report-v0.1.md";

function main() {
  const inputAbs = path.join(ROOT, INPUT_PATH);

  if (!fs.existsSync(inputAbs)) {
    throw new Error(`Missing input: ${INPUT_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(inputAbs, "utf8"));

  const lines: string[] = [];

  lines.push("# SMURF Driver Diversity Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- Cases assessed: ${data.cases_assessed}`);
  lines.push(`- Strong diversity: ${data.strong_diversity}`);
  lines.push(`- Adequate diversity: ${data.adequate_diversity}`);
  lines.push(`- Thin diversity: ${data.thin_diversity}`);
  lines.push(`- Over-concentrated: ${data.over_concentrated}`);
  lines.push("");
  lines.push("## Governance Interpretation");
  lines.push("");
  lines.push(
    "Driver diversity is a diagnostic control. It does not validate or invalidate macro attribution."
  );
  lines.push("");
  lines.push(
    "A case can have a high macro attribution score and still be weakly diversified if its explanation depends too heavily on broad indicators such as GLOBAL_PMI, SINGAPORE_NODX, or GLOBAL_TRADE_VOLUME."
  );
  lines.push("");
  lines.push(
    "Low diversity means the next replay expansion should add more sector-specific, policy-specific, and mechanism-specific macro drivers before drawing strong conclusions from repeated macro attribution."
  );
  lines.push("");
  lines.push("## Case Diversity Findings");
  lines.push("");

  for (const c of data.case_diversity) {
    lines.push(`### ${c.case_id}`);
    lines.push("");
    lines.push(`- Label: ${c.case_label ?? "N/A"}`);
    lines.push(`- Domain: ${c.domain}`);
    lines.push(`- Macro driver count: ${c.macro_driver_count}`);
    lines.push(`- Unique macro driver count: ${c.unique_macro_driver_count}`);
    lines.push(`- Driver categories: ${c.driver_categories.join(", ")}`);
    lines.push(`- Detected mechanism count: ${c.detected_mechanism_count}`);
    lines.push(`- Dominant/high driver count: ${c.dominant_or_high_driver_count}`);
    lines.push(`- Dominant/high driver share: ${c.dominant_or_high_driver_share}`);
    lines.push(`- Sector-specific driver count: ${c.sector_specific_driver_count}`);
    lines.push(`- Diversity score: ${c.diversity_score}`);
    lines.push(`- Diversity band: ${c.diversity_band}`);
    lines.push(`- Interpretation: ${c.interpretation}`);
    lines.push("");
  }

  lines.push("## Recommended Next Step");
  lines.push("");
  lines.push(
    "Build a Macro Specificity Hardening Queue v0.1. This queue should identify which replay cases need additional sector-specific, policy-specific, or mechanism-specific macro drivers before being used for stronger experience learning."
  );
  lines.push("");
  lines.push("Priority additions suggested by current findings:");
  lines.push("");
  lines.push("- Manufacturing: sector output, electronics exports, inventory cycle indicators");
  lines.push("- Petroleum: oil price, refining margins, energy demand, petrochemical spreads");
  lines.push("- Semiconductors: semiconductor sales, chip cycle, electronics exports, wafer demand");
  lines.push("- Biomedical: pharmaceutical output, biomedical exports, healthcare demand, funding/rates context");
  lines.push("");

  const outputAbs = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, lines.join("\n"));

  console.log({
    report_version: "driver-diversity-report-v0.1",
    input: INPUT_PATH,
    output: OUTPUT_PATH,
  });
}

main();
