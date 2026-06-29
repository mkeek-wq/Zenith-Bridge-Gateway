import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

const REGISTRY_PATH = path.join(
  ROOT,
  "data/intelligence/verified-dataset-registry-v0.1.json"
);

const CONFIG_DIR = path.join(ROOT, "data/intelligence/source-download-config");
const RAW_DIR = path.join(ROOT, "data/intelligence/raw-downloads");
const PARSED_DIR = path.join(ROOT, "data/intelligence/parsed-datasets");

const OUTPUT_PATH = path.join(
  ROOT,
  "data/intelligence/hungry-smurf-update-scan-v0.1.json"
);

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileHash(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function fileInfo(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      size_bytes: null,
      modified_at: null,
      sha256: null,
    };
  }

  const stat = fs.statSync(filePath);

  return {
    exists: true,
    size_bytes: stat.size,
    modified_at: stat.mtime.toISOString(),
    sha256: fileHash(filePath),
  };
}

function candidateRawFiles(datasetId: string) {
  return [
    path.join(RAW_DIR, `${datasetId}.csv`),
    path.join(RAW_DIR, `${datasetId}.json`),
    path.join(RAW_DIR, `${datasetId}.singstat.json`),
  ];
}

const registry = readJson(REGISTRY_PATH);
const datasets = Array.isArray(registry.datasets) ? registry.datasets : [];

const scans = datasets.map((dataset: any) => {
  const datasetId = dataset.dataset_id;

  const configPath = path.join(CONFIG_DIR, `${datasetId}.json`);
  const parsedPath = path.join(PARSED_DIR, `${datasetId}.json`);

  const config = fs.existsSync(configPath) ? readJson(configPath) : null;

  const rawCandidates = candidateRawFiles(datasetId).map((filePath) => ({
    path: path.relative(ROOT, filePath),
    ...fileInfo(filePath),
  }));

  const existingRaw = rawCandidates.filter((x) => x.exists);

  const parsedInfo = fileInfo(parsedPath);

  const issues: string[] = [];
  const warnings: string[] = [];
  const actions: string[] = [];

  if (!config) {
    warnings.push("missing_source_download_config");
  }

  if (dataset.verification_status === "requested_not_loaded") {
    actions.push("await_initial_source_load");
  }

  if (dataset.verification_status !== "requested_not_loaded" && existingRaw.length === 0) {
    warnings.push("missing_raw_download_file");
  }

  if (dataset.verification_status !== "requested_not_loaded" && !parsedInfo.exists) {
    issues.push("missing_parsed_dataset");
  }

  if (config && !config.source_url && config.file_type !== "singstat_table") {
    warnings.push("manual_source_or_custom_loader_required");
  }

  if (config?.file_type === "singstat_table") {
    actions.push("eligible_for_singstat_table_update_check");
  } else if (config?.source_url) {
    actions.push("eligible_for_url_download_update_check");
  }

  if (existingRaw.length > 0 && parsedInfo.exists) {
    actions.push("eligible_for_raw_vs_parsed_comparison");
  }

  return {
    dataset_id: datasetId,
    name: dataset.name ?? null,
    registry_status: dataset.verification_status ?? null,
    frequency: dataset.frequency ?? null,
    source_config: config
      ? {
          exists: true,
          path: path.relative(ROOT, configPath),
          source_name: config.source_name ?? null,
          table_id: config.table_id ?? null,
          series_match: config.series_match ?? null,
          source_url: config.source_url ?? null,
          file_type: config.file_type ?? null,
        }
      : { exists: false, path: path.relative(ROOT, configPath) },
    raw_files: rawCandidates,
    parsed_file: {
      path: path.relative(ROOT, parsedPath),
      ...parsedInfo,
    },
    issue_count: issues.length,
    warning_count: warnings.length,
    issues,
    warnings,
    recommended_actions: actions,
    scan_status:
      issues.length > 0 ? "blocked" : warnings.length > 0 ? "review" : "ready",
  };
});

const output = {
  scan_version: "hungry-smurf-update-scan-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Read-only update-readiness scan for dataset ingestion. Hungry Smurf checks what can be updated, compared, loaded, or reviewed without mutating production data.",
  mutation_allowed: false,
  dataset_count: scans.length,
  ready_count: scans.filter((x: any) => x.scan_status === "ready").length,
  review_count: scans.filter((x: any) => x.scan_status === "review").length,
  blocked_count: scans.filter((x: any) => x.scan_status === "blocked").length,
  scans,
  governance: {
    mutation_allowed: false,
    safe_to_schedule: true,
    next_step:
      "Use this scan to identify datasets eligible for incremental update checks. Do not promote data without validation and human review.",
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  scan_version: output.scan_version,
  dataset_count: output.dataset_count,
  ready_count: output.ready_count,
  review_count: output.review_count,
  blocked_count: output.blocked_count,
  output: path.relative(ROOT, OUTPUT_PATH),
});

for (const scan of scans) {
  console.log(
    `${scan.dataset_id} | ${scan.scan_status} | actions=${scan.recommended_actions.join(",") || "-"} | issues=${scan.issues.join(",") || "-"} | warnings=${scan.warnings.join(",") || "-"}`
  );
}
