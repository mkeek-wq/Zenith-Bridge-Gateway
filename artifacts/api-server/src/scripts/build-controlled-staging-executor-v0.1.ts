import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/dry-run-duplicate-review-engine-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/controlled-staging-executor-v0.1.json";

function main() {
  const review = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const staged = (review.review ?? [])
    .filter((r: any) => r.review_status === "approved_for_staging")
    .map((r: any) => ({
      indicator_id: r.indicator_id,
      indicator_name: r.indicator_name,
      staging_status: "staged",
      staged_at: new Date().toISOString(),
    }));

  const output = {
    executor_version: "controlled-staging-executor-v0.1",
    generated_at: new Date().toISOString(),
    staged_count: staged.length,
    staging_status: "GO_FOR_PROMOTION_GATE_REVIEW",
    staged_items: staged,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    executor_version: output.executor_version,
    staged_count: output.staged_count,
    staging_status: output.staging_status,
    output: OUTPUT_PATH,
  });

  for (const item of staged) {
    console.log(`${item.indicator_id} | staged`);
  }
}

main();
