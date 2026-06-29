import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/sector-indicator-candidate-registry-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/controlled-bulk-ingestion-batch-v0.1.json";

function main() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const approved = (registry.candidates ?? []).filter(
    (c: any) => c.candidate_status === "approved_for_dry_run"
  );

  const batch = approved.map((item: any) => ({
    indicator_id: item.indicator_id,
    indicator_name: item.indicator_name,
    domain: item.domain,
    ingestion_action: "dry_run_stage",
    lineage_status: item.lineage_status,
  }));

  const output = {
    batch_version: "controlled-bulk-ingestion-batch-v0.1",
    generated_at: new Date().toISOString(),
    batch_size: batch.length,
    governance_status: "GO_FOR_CONTROLLED_DRY_RUN_REVIEW",
    items: batch,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    batch_version: output.batch_version,
    batch_size: output.batch_size,
    governance_status: output.governance_status,
    output: OUTPUT_PATH,
  });

  for (const item of batch) {
    console.log(`${item.domain} | ${item.indicator_id}`);
  }
}

main();
