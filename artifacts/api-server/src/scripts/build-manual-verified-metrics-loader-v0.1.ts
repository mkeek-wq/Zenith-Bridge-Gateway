import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const input = readJson(
  path.join(root, "inputs/article-generator/manual-verified-metrics-v0.1.json")
);

const metrics = input.metrics ?? [];

const enrichedMetrics = metrics.map((m: any) => {
  const hasValue = m.value !== null && m.value !== undefined && m.value !== "";
  const hasSource =
    m.source_url &&
    m.source_url !== "TO_BE_ADDED" &&
    m.source_name &&
    m.source_name !== "TO_BE_ADDED";
  const hasPeriod = m.period && m.period !== "TO_BE_ADDED";
  const hasUnit = m.unit && m.unit !== "TO_BE_ADDED";

  const verified = hasValue && hasSource && hasPeriod && hasUnit;

  return {
    ...m,
    verification: {
      has_value: hasValue,
      has_source: hasSource,
      has_period: hasPeriod,
      has_unit: hasUnit,
      verified,
      graph_ready: verified,
      verification_status: verified ? "verified" : "pending",
    },
  };
});

const output = {
  registry_version: "manual-verified-metrics-registry-v0.1",
  generated_at: new Date().toISOString(),
  input_version: input.input_version,
  total_metrics: enrichedMetrics.length,
  verified: enrichedMetrics.filter((m: any) => m.verification.verified).length,
  pending: enrichedMetrics.filter((m: any) => !m.verification.verified).length,
  graph_ready: enrichedMetrics.filter((m: any) => m.verification.graph_ready).length,
  metrics: enrichedMetrics,
};

const outDir = path.join(root, "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const exportDir = path.join(root, "exports/article-generator");
fs.mkdirSync(exportDir, { recursive: true });

const dataPath = path.join(outDir, "manual-verified-metrics-registry-v0.1.json");
const exportPath = path.join(exportDir, "manual-verified-metrics-registry-v0.1.json");

fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));
fs.writeFileSync(exportPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  total_metrics: output.total_metrics,
  verified: output.verified,
  pending: output.pending,
  graph_ready: output.graph_ready,
  data_output: dataPath,
  export_output: exportPath,
});
