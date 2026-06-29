import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const targets = readJson(
  path.join(root, "exports/article-generator/tablebuilder-fetch-target-registry-v0.1.json")
);

const workbench = {
  workbench_version: "tablebuilder-retrieval-workbench-v0.1",
  generated_at: new Date().toISOString(),
  source_target_registry: targets.registry_version,
  article_identity: targets.article_identity,
  retrieval_status: "manual_official_retrieval_required",
  tablebuilder_url: "https://tablebuilder.singstat.gov.sg",
  targets: (targets.targets ?? []).map((t: any) => ({
    target_id: t.target_id,
    sector: t.sector,
    required_metric: t.metric,
    required_period: t.required_period,
    required_unit: t.required_unit,
    dataset_family: t.likely_dataset_family,
    retrieval_steps: [
      "Open Singapore Department of Statistics TableBuilder.",
      "Search for manufacturing output / industrial production by cluster or industry.",
      `Select sector: ${t.sector}.`,
      `Select period: ${t.required_period}.`,
      "Retrieve year-on-year growth value.",
      "Record value without percent sign.",
      "Verify source URL, dataset name, period, unit, and sector label.",
      "Enter value into inputs/article-generator/tablebuilder-sector-values-input-v0.1.csv."
    ],
    required_csv_row: {
      sector: t.sector,
      metric: "output_growth_yoy",
      period: t.required_period,
      value: "TO_BE_RETRIEVED",
      unit: "percent",
      source_url: "https://tablebuilder.singstat.gov.sg",
      dataset: "TableBuilder",
      verification_status: "manual_verified"
    },
    governance: {
      official_source_required: true,
      placeholder_values_allowed: false,
      test_values_allowed_for_pipeline_test_only: true,
      publication_allowed_before_real_value: false
    }
  })),
  verification_checklist: [
    "Value comes from official SingStat / TableBuilder source.",
    "Sector label exactly matches target sector.",
    "Period exactly matches required period.",
    "Value is numeric.",
    "Value is not a placeholder.",
    "Value is not a pipeline test value.",
    "Verification status is manual_verified only after human review."
  ],
  next_action:
    "Retrieve official values and update inputs/article-generator/tablebuilder-sector-values-input-v0.1.csv."
};

const outPath = path.join(
  root,
  "exports/article-generator/tablebuilder-retrieval-workbench-v0.1.json"
);

fs.writeFileSync(outPath, JSON.stringify(workbench, null, 2));

console.log({
  workbench_version: workbench.workbench_version,
  targets: workbench.targets.length,
  output: outPath
});
