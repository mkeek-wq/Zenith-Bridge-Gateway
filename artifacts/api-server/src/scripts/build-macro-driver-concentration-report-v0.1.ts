import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/macro-driver-concentration-engine-v0.1.json";

const OUTPUT_PATH =
  "exports/macro-reports/macro-driver-concentration-report-v0.1.md";

function main() {
  const inputAbs = path.join(ROOT, INPUT_PATH);

  if (!fs.existsSync(inputAbs)) {
    throw new Error(`Missing input: ${INPUT_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(inputAbs, "utf8"));

  const lines: string[] = [];

  lines.push("# SMURF Macro Driver Concentration Report v0.1");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- Cases assessed: ${data.cases_assessed}`);
  lines.push(`- Macro drivers assessed: ${data.drivers_assessed}`);
  lines.push(`- Dominant drivers: ${data.dominant_driver_count}`);
  lines.push(`- High-concentration drivers: ${data.high_concentration_driver_count}`);
  lines.push("");
  lines.push("## Governance Interpretation");
  lines.push("");
  lines.push(
    "High driver concentration does not invalidate a macro driver. It indicates that the driver may be too broad, too generic, or too easily selected across replay cases."
  );
  lines.push("");
  lines.push(
    "Dominant drivers should remain available as macro context, but should not be allowed to overpower sector-specific, mechanism-specific, or case-specific evidence."
  );
  lines.push("");
  lines.push("## Concentration Findings");
  lines.push("");

  for (const item of data.concentration) {
    lines.push(`### ${item.driver_id}`);
    lines.push("");
    lines.push(`- Cases explained: ${item.cases_explained}/${data.cases_assessed}`);
    lines.push(`- Case share: ${item.case_share}`);
    lines.push(`- Domains touched: ${item.domains_touched.join(", ")}`);
    lines.push(`- Domain count: ${item.domain_count}`);
    lines.push(`- Concentration band: ${item.concentration_band}`);
    lines.push(`- Warning: ${item.warning ?? "None"}`);
    lines.push("");
  }

  lines.push("## Recommended Next Control");
  lines.push("");
  lines.push("Build a Driver Diversity Engine v0.1 to test whether each case is explained by a balanced set of macro, sector, policy, and mechanism-specific drivers.");
  lines.push("");
  lines.push("This prevents broad indicators such as GLOBAL_PMI or SINGAPORE_NODX from becoming universal explanations.");
  lines.push("");

  const outputAbs = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, lines.join("\n"));

  console.log({
    report_version: "macro-driver-concentration-report-v0.1",
    input: INPUT_PATH,
    output: OUTPUT_PATH,
  });
}

main();
