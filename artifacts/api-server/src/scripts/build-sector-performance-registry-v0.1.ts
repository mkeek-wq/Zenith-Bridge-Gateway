import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const input = readJson(
  path.join(root, "inputs/article-generator/sector-performance-input-v0.1.json")
);

const metrics = (input.metrics ?? []).map((m: any) => {
  const hasValue = m.value !== null && m.value !== undefined && m.value !== "";
  const hasPeriod = m.period && m.period !== "TO_BE_ADDED";
  const hasSource = m.source_name !== "TO_BE_ADDED" && m.source_url !== "TO_BE_ADDED";
  const verified =
    hasValue &&
    hasPeriod &&
    hasSource &&
    m.verification_status === "verified_manual_entry";

  return {
    sector_metric_id: `SPM_${m.sector.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${m.period}`,
    ...m,
    governance: {
      verified,
      graph_use_allowed: verified,
      article_claim_allowed: verified,
      synthetic_data: false,
      sandbox_data: false,
      verification_note: verified
        ? "Metric is verified and eligible for article and graph use."
        : "Metric remains pending and may not be used for quantitative claims."
    }
  };
});

const output = {
  registry_version: "sector-performance-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_input: input.input_version,
  total_metrics: metrics.length,
  verified_metrics: metrics.filter((m: any) => m.governance.verified).length,
  pending_metrics: metrics.filter((m: any) => !m.governance.verified).length,
  graph_eligible_metrics: metrics.filter((m: any) => m.governance.graph_use_allowed).length,
  metrics,
  governance_rules: [
    "Only verified sector metrics may be used in quantitative graphs.",
    "Pending metrics may be listed as data needs but not used in published visuals.",
    "Synthetic replay evidence may not enter sector performance charts.",
    "Every graph-eligible metric requires period, value, unit, source name, and source URL."
  ]
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "sector-performance-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  total_metrics: output.total_metrics,
  verified_metrics: output.verified_metrics,
  pending_metrics: output.pending_metrics,
  graph_eligible_metrics: output.graph_eligible_metrics,
  output: outPath
});
