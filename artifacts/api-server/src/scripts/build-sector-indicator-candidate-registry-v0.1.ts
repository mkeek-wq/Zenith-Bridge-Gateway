import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/sector-macro-registry-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/sector-indicator-candidate-registry-v0.1.json";

const APPROVED_AUTHORITIES = [
  "SingStat / EDB",
  "Enterprise Singapore / SingStat",
  "EIA / FRED / World Bank",
  "SIA / WSTS",
];

function main() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const candidates = (registry.indicators ?? []).map((i: any) => ({
    indicator_id: i.indicator_id,
    indicator_name: i.indicator_name,
    domain: i.domain,
    source_authority: i.source_authority,
    candidate_status: APPROVED_AUTHORITIES.includes(i.source_authority)
      ? "approved_for_dry_run"
      : "needs_source_review",
    lineage_status: i.lineage_status,
    ingestion_status: i.ingestion_status,
  }));

  const output = {
    registry_version: "sector-indicator-candidate-registry-v0.1",
    generated_at: new Date().toISOString(),
    candidates_reviewed: candidates.length,
    approved_for_dry_run: candidates.filter(
      (c) => c.candidate_status === "approved_for_dry_run"
    ).length,
    needs_source_review: candidates.filter(
      (c) => c.candidate_status === "needs_source_review"
    ).length,
    candidates,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    registry_version: output.registry_version,
    approved_for_dry_run: output.approved_for_dry_run,
    needs_source_review: output.needs_source_review,
    output: OUTPUT_PATH,
  });

  for (const c of candidates) {
    console.log(`${c.candidate_status} | ${c.indicator_id}`);
  }
}

main();
