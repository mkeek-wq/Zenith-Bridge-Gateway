import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readiness(score: number) {
  if (score >= 0.85) return "strong_data_coverage";
  if (score >= 0.55) return "partial_data_coverage";
  if (score > 0) return "thin_data_coverage";
  return "no_verified_data";
}

const requestPath = path.join(ROOT, "data", "intelligence", "data-request-queue-v0.1.json");
const registryPath = path.join(ROOT, "data", "intelligence", "verified-dataset-registry-v0.1.json");

const requestQueue = readJson(requestPath);
const registry = readJson(registryPath);

const datasetById = new Map<string, any>();

for (const dataset of registry.datasets || []) {
  datasetById.set(dataset.dataset_id, dataset);
}

const coverage = (requestQueue.requests || []).map((request: any) => {
  const required = request.required_datasets || [];

  const rows = required.map((dataset: any) => {
    const existing = datasetById.get(dataset.dataset_id);

    return {
      dataset_id: dataset.dataset_id,
      name: dataset.name,
      importance: dataset.importance,
      required: true,
      verification_status: existing?.verification_status || "missing",
      values_count: existing?.values_count || 0,
      coverage_start: existing?.coverage_start || null,
      coverage_end: existing?.coverage_end || null,
      available_for_graphs: existing?.verification_status === "verified",
    };
  });

  const critical = rows.filter((r: any) => r.importance === "critical");
  const high = rows.filter((r: any) => r.importance === "high");
  const medium = rows.filter((r: any) => r.importance === "medium");

  const weightedTotal =
    critical.length * 3 + high.length * 2 + medium.length;

  const weightedVerified =
    critical.filter((r: any) => r.available_for_graphs).length * 3 +
    high.filter((r: any) => r.available_for_graphs).length * 2 +
    medium.filter((r: any) => r.available_for_graphs).length;

  const score = weightedTotal === 0 ? 0 : weightedVerified / weightedTotal;

  return {
    candidate_id: request.candidate_id,
    candidate_title: request.candidate_title,
    required_dataset_count: rows.length,
    verified_dataset_count: rows.filter((r: any) => r.available_for_graphs).length,
    missing_dataset_count: rows.filter((r: any) => !r.available_for_graphs).length,
    coverage_score: Number(score.toFixed(3)),
    readiness: readiness(score),
    graph_readiness:
      score >= 0.55 ? "graph_package_possible" : "graph_package_not_ready",
    datasets: rows,
    generated_at: new Date().toISOString(),
  };
});

const output = {
  engine_version: "dataset-coverage-engine-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Measures whether each article candidate has sufficient verified datasets for richer graphs and publication-grade analysis.",
  candidate_count: coverage.length,
  strong_data_coverage: coverage.filter((c: any) => c.readiness === "strong_data_coverage").length,
  partial_data_coverage: coverage.filter((c: any) => c.readiness === "partial_data_coverage").length,
  thin_data_coverage: coverage.filter((c: any) => c.readiness === "thin_data_coverage").length,
  no_verified_data: coverage.filter((c: any) => c.readiness === "no_verified_data").length,
  coverage,
};

const outDir = path.join(ROOT, "data", "intelligence");
ensureDir(outDir);

const outPath = path.join(outDir, "dataset-coverage-engine-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  engine_version: output.engine_version,
  candidate_count: output.candidate_count,
  strong: output.strong_data_coverage,
  partial: output.partial_data_coverage,
  thin: output.thin_data_coverage,
  none: output.no_verified_data,
  output: outPath,
});

for (const c of coverage.slice(0, 8)) {
  console.log(`${c.candidate_id} | ${c.coverage_score} | ${c.readiness} | missing=${c.missing_dataset_count}`);
}
