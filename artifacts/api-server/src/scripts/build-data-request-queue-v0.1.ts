import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slug(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferRequiredDatasets(candidate: any) {
  const title = String(candidate.title || "").toLowerCase();
  const driver = String(candidate.source_driver?.driver_name || "").toLowerCase();
  const text = `${title} ${driver}`;

  const base = [
    {
      dataset_id: "SG_TOTAL_MANUFACTURING_OUTPUT_INDEX",
      name: "Singapore total manufacturing output index",
      country: "Singapore",
      metric_type: "output_index",
      frequency: "monthly_or_quarterly",
      max_history_years: 10,
      max_forecast_years: 1,
      importance: "high",
      preferred_sources: ["EDB", "SingStat"],
      reason: "Provides industrial baseline for comparison.",
    },
  ];

  if (text.includes("petroleum") || text.includes("energy") || text.includes("refining")) {
    return [
      {
        dataset_id: "SG_PETROLEUM_OUTPUT_INDEX",
        name: "Singapore petroleum output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "critical",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Core metric for petroleum-cycle article.",
      },
      {
        dataset_id: "SG_CHEMICALS_OUTPUT_INDEX",
        name: "Singapore chemicals output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "high",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Related downstream/industrial comparison sector.",
      },
      {
        dataset_id: "SG_TRANSPORT_ENGINEERING_OUTPUT_INDEX",
        name: "Singapore transport engineering output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "medium",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Useful comparison for aviation/marine recovery context.",
      },
      ...base,
    ];
  }

  if (text.includes("semiconductor")) {
    return [
      {
        dataset_id: "SG_SEMICONDUCTOR_OUTPUT_INDEX",
        name: "Singapore semiconductor output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "critical",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Core metric for semiconductor-cycle analysis.",
      },
      {
        dataset_id: "SG_ELECTRONICS_OUTPUT_INDEX",
        name: "Singapore electronics output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "high",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Parent sector comparison for semiconductor activity.",
      },
      ...base,
    ];
  }

  if (text.includes("precision") || text.includes("capital equipment")) {
    return [
      {
        dataset_id: "SG_PRECISION_ENGINEERING_OUTPUT_INDEX",
        name: "Singapore precision engineering output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "critical",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Core metric for capital-equipment-cycle article.",
      },
      ...base,
    ];
  }

  if (text.includes("transport") || text.includes("aviation") || text.includes("marine")) {
    return [
      {
        dataset_id: "SG_TRANSPORT_ENGINEERING_OUTPUT_INDEX",
        name: "Singapore transport engineering output index",
        country: "Singapore",
        metric_type: "output_index",
        frequency: "monthly_or_quarterly",
        max_history_years: 10,
        max_forecast_years: 1,
        importance: "critical",
        preferred_sources: ["EDB", "SingStat"],
        reason: "Core metric for aviation/marine recovery article.",
      },
      ...base,
    ];
  }

  return [
    {
      dataset_id: `SG_${slug(candidate.title || candidate.opportunity_id || "UNKNOWN")}_PRIMARY_SERIES`,
      name: `Primary time series for ${candidate.title || "candidate"}`,
      country: "Singapore",
      metric_type: "unknown",
      frequency: "monthly_or_quarterly",
      max_history_years: 10,
      max_forecast_years: 1,
      importance: "critical",
      preferred_sources: ["EDB", "SingStat"],
      reason: "Candidate requires a primary verified time series before publication-grade analysis.",
    },
    ...base,
  ];
}

const queuePath = path.join(ROOT, "data", "intelligence", "article-opportunity-queue-v0.1.json");
const queue = readJson(queuePath);
const opportunities = queue.opportunities || [];

const requests = opportunities.map((candidate: any) => {
  const datasets = inferRequiredDatasets(candidate);

  return {
    request_id: `DRQ_${slug(candidate.opportunity_id || candidate.title)}`,
    candidate_id: candidate.opportunity_id,
    candidate_title: candidate.title,
    priority: datasets.some((d) => d.importance === "critical") ? "high" : "medium",
    request_status: "open",
    required_datasets: datasets,
    created_at: new Date().toISOString(),
    source_package: "article-opportunity-queue-v0.1",
  };
});

const output = {
  queue_version: "data-request-queue-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Surgical data requests required to upgrade article candidates into stronger ZNBW intelligence products.",
  request_count: requests.length,
  requests,
};

const outDir = path.join(ROOT, "data", "intelligence");
ensureDir(outDir);

const outPath = path.join(outDir, "data-request-queue-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  queue_version: output.queue_version,
  request_count: output.request_count,
  output: outPath,
});

for (const r of requests.slice(0, 5)) {
  console.log(`${r.request_id} | ${r.required_datasets.length} datasets | ${r.candidate_title}`);
}
