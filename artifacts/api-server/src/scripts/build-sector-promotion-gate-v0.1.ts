import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/controlled-staging-executor-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/sector-promotion-gate-v0.1.json";

function main() {
  const staged = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const promoted = (staged.staged_items ?? []).map((item: any) => ({
    indicator_id: item.indicator_id,
    indicator_name: item.indicator_name,
    promotion_status: "awaiting_manual_approval",
  }));

  const output = {
    gate_version: "sector-promotion-gate-v0.1",
    generated_at: new Date().toISOString(),
    staged_items_reviewed: promoted.length,
    governance_status: "MANUAL_PROMOTION_REVIEW_REQUIRED",
    promoted_candidates: promoted,
    doctrine:
      "No automatic promotion. Human review remains mandatory.",
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    gate_version: output.gate_version,
    staged_items_reviewed: output.staged_items_reviewed,
    governance_status: output.governance_status,
    output: OUTPUT_PATH,
  });

  for (const item of promoted) {
    console.log(
      `${item.indicator_id} | ${item.promotion_status}`
    );
  }
}

main();
