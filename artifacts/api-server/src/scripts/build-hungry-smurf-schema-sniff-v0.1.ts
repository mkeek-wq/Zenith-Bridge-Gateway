import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PARSED_DIR = path.join(ROOT, "data/intelligence/parsed-datasets");
const OUTPUT_PATH = path.join(
  ROOT,
  "data/intelligence/hungry-smurf-schema-sniff-v0.1.json"
);

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const files = fs.existsSync(PARSED_DIR)
  ? fs.readdirSync(PARSED_DIR).filter((f) => f.endsWith(".json"))
  : [];

const scans = files.map((file) => {
  const filePath = path.join(PARSED_DIR, file);
  const dataset = readJson(filePath);
  const values = Array.isArray(dataset.values) ? dataset.values : [];

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!dataset.dataset_id) issues.push("missing_dataset_id");
  if (!dataset.name) warnings.push("missing_name");
  if (!dataset.frequency) warnings.push("missing_frequency");
  if (!dataset.unit) warnings.push("missing_unit");
  if (!Array.isArray(dataset.values)) issues.push("values_not_array");
  if (values.length === 0) issues.push("no_values");

  const badRows = values.filter((row: any) => {
    return (
      !row ||
      typeof row !== "object" ||
      !("period" in row) ||
      !("value" in row) ||
      row.period === null ||
      row.period === "" ||
      row.value === null ||
      Number.isNaN(Number(row.value))
    );
  });

  if (badRows.length > 0) issues.push("invalid_value_rows");

  const periods = values.map((row: any) => String(row.period));
  const duplicatePeriods = periods.filter(
    (p: string, i: number) => periods.indexOf(p) !== i
  );

  if (duplicatePeriods.length > 0) issues.push("duplicate_periods");

  const numericValues = values
    .map((row: any) => Number(row.value))
    .filter((v: number) => !Number.isNaN(v));

  const minValue = numericValues.length ? Math.min(...numericValues) : null;
  const maxValue = numericValues.length ? Math.max(...numericValues) : null;

  if (numericValues.some((v: number) => v < 0)) {
    warnings.push("negative_values_detected");
  }

  return {
    dataset_id: dataset.dataset_id || file.replace(".json", ""),
    file: path.relative(ROOT, filePath),
    values_count: values.length,
    first_period: values[0]?.period ?? null,
    last_period: values[values.length - 1]?.period ?? null,
    min_value: minValue,
    max_value: maxValue,
    issue_count: issues.length,
    warning_count: warnings.length,
    issues,
    warnings,
    sniff_status:
      issues.length > 0 ? "blocked" : warnings.length > 0 ? "review" : "clean",
  };
});

const output = {
  sniff_version: "hungry-smurf-schema-sniff-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Read-only schema and value sniff for parsed datasets before controlled ingestion.",
  mutation_allowed: false,
  dataset_count: scans.length,
  clean_count: scans.filter((s: any) => s.sniff_status === "clean").length,
  review_count: scans.filter((s: any) => s.sniff_status === "review").length,
  blocked_count: scans.filter((s: any) => s.sniff_status === "blocked").length,
  scans,
  governance: {
    mutation_allowed: false,
    ingestion_allowed: scans.every((s: any) => s.sniff_status !== "blocked"),
    human_review_required: scans.some((s: any) => s.sniff_status !== "clean"),
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  sniff_version: output.sniff_version,
  dataset_count: output.dataset_count,
  clean_count: output.clean_count,
  review_count: output.review_count,
  blocked_count: output.blocked_count,
  output: path.relative(ROOT, OUTPUT_PATH),
});

for (const scan of scans) {
  console.log(
    `${scan.dataset_id} | ${scan.sniff_status} | issues=${scan.issues.join(",") || "-"} | warnings=${scan.warnings.join(",") || "-"}`
  );
}
