import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/controlled-bulk-ingestion-batch-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/dry-run-duplicate-review-engine-v0.1.json";

function main() {
  const batch = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT_PATH), "utf8")
  );

  const seen = new Set<string>();

  const review = (batch.items ?? []).map((item: any) => {
    const duplicate = seen.has(item.indicator_id);

    if (!duplicate) {
      seen.add(item.indicator_id);
    }

    return {
      indicator_id: item.indicator_id,
      indicator_name: item.indicator_name,
      duplicate_detected: duplicate,
      review_status: duplicate
        ? "manual_duplicate_review_required"
        : "approved_for_staging",
    };
  });

  const output = {
    engine_version: "dry-run-duplicate-review-engine-v0.1",
    generated_at: new Date().toISOString(),
    items_reviewed: review.length,
    duplicates_detected: review.filter((r: any) => r.duplicate_detected).length,
    approved_for_staging: review.filter(
      (r: any) => r.review_status === "approved_for_staging"
    ).length,
    review,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    engine_version: output.engine_version,
    items_reviewed: output.items_reviewed,
    duplicates_detected: output.duplicates_detected,
    approved_for_staging: output.approved_for_staging,
    output: OUTPUT_PATH,
  });
}

main();
