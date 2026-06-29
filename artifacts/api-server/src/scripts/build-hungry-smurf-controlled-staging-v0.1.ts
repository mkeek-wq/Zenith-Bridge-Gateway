import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const gate = readJson(
  path.join(ROOT, "data/intelligence/hungry-smurf-pre-ingestion-gate-v0.1.json")
);

const updateScan = readJson(
  path.join(ROOT, "data/intelligence/hungry-smurf-update-scan-v0.1.json")
);

if (gate.decision !== "GO_FOR_CONTROLLED_STAGING") {
  throw new Error(`Gate is not open for staging: ${gate.decision}`);
}

const stagingDir = path.join(ROOT, "data/ingestion/hungry-smurf-staging");
ensureDir(stagingDir);

const ready = (updateScan.scans || []).filter(
  (scan: any) => scan.scan_status === "ready"
);

const stagedItems = ready.map((scan: any) => {
  const parsedPath = path.join(
    ROOT,
    "data/intelligence/parsed-datasets",
    `${scan.dataset_id}.json`
  );

  const parsed = readJson(parsedPath);

  const staged = {
    staging_version: "hungry-smurf-controlled-staging-item-v0.1",
    generated_at: new Date().toISOString(),
    dataset_id: scan.dataset_id,
    source_scan_status: scan.scan_status,
    source_config: scan.source_config,
    raw_files: scan.raw_files,
    parsed_file: scan.parsed_file,
    values_count: parsed.values?.length ?? 0,
    coverage_start: parsed.values?.[0]?.period ?? null,
    coverage_end: parsed.values?.[parsed.values.length - 1]?.period ?? null,
    staging_status: "staged_for_human_review",
    production_mutation_allowed: false,
    recommended_next_step: "Review staged item before promotion.",
  };

  const outPath = path.join(stagingDir, `${scan.dataset_id}.json`);
  writeJson(outPath, staged);

  return {
    dataset_id: scan.dataset_id,
    staging_status: staged.staging_status,
    staged_file: path.relative(ROOT, outPath),
    values_count: staged.values_count,
    coverage_start: staged.coverage_start,
    coverage_end: staged.coverage_end,
  };
});

const output = {
  staging_run_version: "hungry-smurf-controlled-staging-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Stages ready datasets for human review. This run does not mutate production datasets.",
  mutation_allowed: false,
  source_gate: "data/intelligence/hungry-smurf-pre-ingestion-gate-v0.1.json",
  staged_count: stagedItems.length,
  staged_items: stagedItems,
  governance: {
    production_mutation_allowed: false,
    human_review_required: true,
    promotion_required: true,
  },
};

const outPath = path.join(
  ROOT,
  "data/ingestion/hungry-smurf-controlled-staging-v0.1.json"
);

writeJson(outPath, output);

console.log({
  staging_run_version: output.staging_run_version,
  staged_count: output.staged_count,
  output: path.relative(ROOT, outPath),
});

for (const item of stagedItems) {
  console.log(
    `${item.dataset_id} | staged | ${item.coverage_start}-${item.coverage_end} | values=${item.values_count}`
  );
}
