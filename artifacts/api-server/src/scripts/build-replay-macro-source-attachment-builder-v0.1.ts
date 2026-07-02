import fs from "node:fs";
import path from "node:path";

const replayDir = path.resolve("data/replay");
const intelligenceDir = path.resolve("data/intelligence");

const checklistPath = path.join(
  replayDir,
  "replay-macro-source-checklist-v0.1.json"
);

const datasetRegistryPath = path.join(
  intelligenceDir,
  "verified-dataset-registry-v0.1.json"
);

const outputPath = path.join(
  replayDir,
  "replay-macro-source-attachment-drafts-v0.1.json"
);

function readJsonIfExists(filePath: string, fallback: any) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalized(value: unknown) {
  return String(value || "").toLowerCase();
}

function datasetMatchesMacroDraft(dataset: any, draft: any) {
  const datasetText = [
    dataset.dataset_id,
    dataset.name,
    dataset.metric_type,
    dataset.notes,
    dataset.source_metadata?.table_title,
    dataset.source_metadata?.row_text
  ]
    .map(normalized)
    .join(" ");

const isBroadManufacturing =
  datasetText.includes("total manufacturing") ||
  datasetText.includes("manufacturing_output") ||
  dataset.dataset_id === "sg_total_manufacturing_output_annual" ||
  dataset.dataset_id === "sg_industrial_production_index_monthly";

  const isElectronics =
    datasetText.includes("electronic") ||
    datasetText.includes("computer") ||
    datasetText.includes("semiconductor");

  const isPetroleum =
    datasetText.includes("petroleum") ||
    datasetText.includes("oil") ||
    datasetText.includes("energy");

  const isTrade =
    datasetText.includes("trade") ||
    datasetText.includes("export") ||
    datasetText.includes("import");

  if (draft.event_type === "electronics_cycle") {
    return isElectronics || isBroadManufacturing;
  }

  if (draft.event_type === "supply_chain_disruption") {
    return isTrade || isBroadManufacturing;
  }

  if (draft.event_type === "general_macro_shock") {
    return isBroadManufacturing;
  }

  if (
    draft.event_type === "oil_price_shock" ||
    draft.event_type === "energy_shock" ||
    normalized(draft.label).includes("oil") ||
    normalized(draft.label).includes("petroleum")
  ) {
    return isPetroleum || isBroadManufacturing;
  }

  return false;
}

const checklistRaw = readJsonIfExists(checklistPath, { checklist: [] });
const datasetRegistry = readJsonIfExists(datasetRegistryPath, { datasets: [] });

const datasets = Array.isArray(datasetRegistry.datasets)
  ? datasetRegistry.datasets
  : [];

const drafts = checklistRaw.checklist.map((item: any) => {
  const baseDraft = {
    macro_event_id: item.macro_event_id,
    label: item.label,
    event_type: item.event_type,
    priority: item.priority,
    source_attachment_status: "draft_needs_manual_sources",
    production_write_allowed: false,
    papa_review_required: true,
    source_entries: [],
    dataset_source_candidates: [],
    required_minimum: item.minimum_ready_definition,
    checklist_items: item.checklist_items,
    draft_note:
      "Attach source entries manually. Dataset candidates are reference-only and cannot promote anchors without Papa review."
  };

  const datasetCandidates = datasets
    .filter((dataset: any) => datasetMatchesMacroDraft(dataset, baseDraft))
    .map((dataset: any) => ({
      dataset_id: dataset.dataset_id,
      name: dataset.name,
      country: dataset.country,
      metric_type: dataset.metric_type,
      frequency: dataset.frequency,
      verification_status: dataset.verification_status,
      coverage_start: dataset.coverage_start,
      coverage_end: dataset.coverage_end,
      values_count: dataset.values_count,
      source_url: dataset.source_url,
      unit: dataset.unit,
      evidence_role: "candidate_dataset_reference",
      source_status: "requires_papa_review",
      production_write_allowed: false
    }));

  return {
    ...baseDraft,
    dataset_source_candidates: datasetCandidates,
    dataset_candidate_count: datasetCandidates.length
  };
});

const output = {
  version: "replay-macro-source-attachment-drafts-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro source attachment drafts help humans attach sources to macro anchors. Dataset candidates are reference-only and do not promote, validate, or write production evidence.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_source_checklist: "data/replay/replay-macro-source-checklist-v0.1.json",
    verified_dataset_registry:
      "data/intelligence/verified-dataset-registry-v0.1.json"
  },
  dataset_registry_available: fs.existsSync(datasetRegistryPath),
  dataset_count: datasets.length,
  draft_count: drafts.length,
  dataset_candidate_total: drafts.reduce(
    (sum: number, draft: any) => sum + draft.dataset_candidate_count,
    0
  ),
  drafts
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

console.log("✅ Macro source attachment drafts created");
console.log(`Output: ${outputPath}`);
console.log(`Draft count: ${drafts.length}`);
console.log(`Dataset registry available: ${output.dataset_registry_available}`);
console.log(`Dataset count: ${output.dataset_count}`);
console.log(`Dataset candidates attached: ${output.dataset_candidate_total}`);
