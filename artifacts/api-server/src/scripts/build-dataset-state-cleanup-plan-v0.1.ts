import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REGISTRY_PATH = path.join(
  ROOT,
  "data/intelligence/verified-dataset-registry-v0.1.json"
);

const PARSED_DIR = path.join(ROOT, "data/intelligence/parsed-datasets");

const OUTPUT_PATH = path.join(
  ROOT,
  "data/intelligence/dataset-state-cleanup-plan-v0.1.json"
);

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(REGISTRY_PATH);
const datasets = Array.isArray(registry.datasets) ? registry.datasets : [];

const cleanupPlan = datasets
  .map((dataset: any) => {
    const parsedPath = path.join(PARSED_DIR, `${dataset.dataset_id}.json`);

    if (!fs.existsSync(parsedPath)) {
      return null;
    }

    const parsed = readJson(parsedPath);

    const mutableGovernanceFields = [
      "verification_status",
      "reviewed_at",
      "approval_status",
      "approved_at",
      "rejected_at",
      "governance_status",
    ].filter((field) => Object.prototype.hasOwnProperty.call(parsed, field));

    return {
      dataset_id: dataset.dataset_id,
      parsed_file: path.relative(ROOT, parsedPath),
      registry_verification_status: dataset.verification_status ?? null,
      parsed_verification_status: parsed.verification_status ?? null,
      mutable_governance_fields_found: mutableGovernanceFields,
      recommended_action:
        mutableGovernanceFields.length > 0
          ? "remove_mutable_governance_fields_from_parsed_dataset"
          : "no_action_required",
    };
  })
  .filter(Boolean);

const output = {
  plan_version: "dataset-state-cleanup-plan-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Creates a read-only cleanup plan to enforce verified-dataset-registry as the source of truth for mutable dataset governance state.",
  mutation_allowed: false,
  source_of_truth: {
    dataset_lifecycle_state:
      "data/intelligence/verified-dataset-registry-v0.1.json",
    parsed_datasets:
      "Immutable/semi-immutable dataset payload, values, source metadata, and load metadata only.",
  },
  dataset_count: cleanupPlan.length,
  action_count: cleanupPlan.filter(
    (item: any) => item.recommended_action !== "no_action_required"
  ).length,
  cleanup_plan: cleanupPlan,
  governance: {
    human_review_required: true,
    next_step:
      "Review this plan. If approved, run a separate cleanup executor that removes mutable governance fields from parsed dataset files.",
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  plan_version: output.plan_version,
  dataset_count: output.dataset_count,
  action_count: output.action_count,
  output: path.relative(ROOT, OUTPUT_PATH),
});

for (const item of cleanupPlan as any[]) {
  if (item.recommended_action !== "no_action_required") {
    console.log(
      `${item.dataset_id} | ${item.recommended_action} | fields=${item.mutable_governance_fields_found.join(",")}`
    );
  }
}
