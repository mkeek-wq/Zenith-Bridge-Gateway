import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const requestPath = path.join(ROOT, "data", "intelligence", "data-request-queue-v0.1.json");
const requests = readJson(requestPath).requests || [];

const datasetMap = new Map<string, any>();

for (const request of requests) {
  for (const dataset of request.required_datasets || []) {
    if (!datasetMap.has(dataset.dataset_id)) {
      datasetMap.set(dataset.dataset_id, {
        dataset_id: dataset.dataset_id,
        name: dataset.name,
        country: dataset.country,
        metric_type: dataset.metric_type,
        frequency: dataset.frequency,
        preferred_sources: dataset.preferred_sources,
        verification_status: "requested_not_loaded",
        coverage_start: null,
        coverage_end: null,
        max_history_years_requested: dataset.max_history_years,
        max_forecast_years_requested: dataset.max_forecast_years,
        values_count: 0,
        source_url: null,
        local_file: null,
        notes: "Dataset requested by surgical intake. Values not loaded yet.",
        used_by_candidates: [request.candidate_id],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      const existing = datasetMap.get(dataset.dataset_id);
      if (!existing.used_by_candidates.includes(request.candidate_id)) {
        existing.used_by_candidates.push(request.candidate_id);
      }
    }
  }
}

const datasets = Array.from(datasetMap.values()).sort((a, b) =>
  a.dataset_id.localeCompare(b.dataset_id)
);

const output = {
  registry_version: "verified-dataset-registry-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Registry of datasets required, loaded, verified, and available for intelligence articles and graph generation.",
  dataset_count: datasets.length,
  datasets,
};

const outDir = path.join(ROOT, "data", "intelligence");
ensureDir(outDir);

const outPath = path.join(outDir, "verified-dataset-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  dataset_count: output.dataset_count,
  output: outPath,
});

for (const d of datasets.slice(0, 8)) {
  console.log(`${d.dataset_id} | ${d.verification_status} | used_by=${d.used_by_candidates.length}`);
}
