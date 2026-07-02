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

const attribution =
  readJsonSafe(path.join(ROOT, "data/intelligence/macro-attribution-engine-v0.2.json")) || {};

const cases: any[] = attribution.case_macro_attributions || [];

const lines: string[] = [];

lines.push("# SMURF Macro Attribution Report v0.2");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## Executive Summary");
lines.push("");
lines.push(`- Cases attributed: ${attribution.summary?.cases_attributed ?? 0}`);
lines.push(`- Strong macro explanations: ${attribution.summary?.strong_macro_explanation ?? 0}`);
lines.push(`- Moderate macro explanations: ${attribution.summary?.moderate_macro_explanation ?? 0}`);
lines.push(`- Weak macro explanations: ${attribution.summary?.weak_macro_explanation ?? 0}`);
lines.push(`- Limited macro explanations: ${attribution.summary?.limited_macro_explanation ?? 0}`);
lines.push("");
lines.push("v0.2 applies a domain relevance filter to reduce unrelated macro drivers.");
lines.push("");
lines.push("## Case Macro Attribution");
lines.push("");

for (const c of cases) {
  lines.push(`### ${c.case_id}`);
  lines.push("");
  lines.push(`- Domain: ${c.domain}`);
  lines.push(`- Macro attribution score: ${c.macro_attribution_score}`);
  lines.push(`- Attribution band: ${c.macro_attribution_band}`);
  lines.push(`- Global macro share: ${c.attribution_split?.global_macro_share ?? 0}`);
  lines.push(`- National macro share: ${c.attribution_split?.national_macro_share ?? 0}`);
  lines.push(`- Sector / idiosyncratic share: ${c.attribution_split?.sector_or_idiosyncratic_share ?? 0}`);
  lines.push("");
  lines.push("Top macro drivers:");
  lines.push("");

  if (c.top_macro_drivers?.length) {
    for (const d of c.top_macro_drivers.slice(0, 5)) {
      lines.push(
        `- ${d.macro_key} → ${d.mechanism_id} | score ${d.macro_attribution_score} | relevance ${d.domain_relevance_adjustment} | channel: ${d.channel}`
      );
    }
  } else {
    lines.push("- None");
  }

  lines.push("");
}

lines.push("## Interpretation");
lines.push("");
lines.push("The v0.2 report filters macro drivers by domain relevance. This reduces pollution from unrelated macro indicators while preserving global and national context where relevant.");
lines.push("");
lines.push("## Governance Note");
lines.push("");
lines.push("This report is explanatory only. Observed macro data is still required before production-grade macro attribution. Evidence remains primary; macro context remains supportive.");

const markdown = lines.join("\n");

const output = {
  registry_version: "macro-attribution-report-v0.2",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_report_is_explanatory_only: true,
    domain_relevance_filter_applied: true,
    macro_context_is_not_causal_proof: true,
    observed_macro_data_required_for_production: true,
    evidence_remains_primary: true,
  },
  summary: attribution.summary || {},
  markdown,
};

ensureDir(path.join(ROOT, "data/intelligence"));
ensureDir(path.join(ROOT, "exports/macro-reports"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-attribution-report-v0.2.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/macro-reports/macro-attribution-report-v0.2.md"),
  markdown
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output_json: "data/intelligence/macro-attribution-report-v0.2.json",
  output_markdown: "exports/macro-reports/macro-attribution-report-v0.2.md",
});

console.log("\n--- Macro Attribution Report v0.2 Preview ---\n");
console.log(markdown);
