import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const batch = readJson(
  "data/replay/replay-macro-sourced-batch-v0.1.json"
);

const checklist = batch.sourced_anchors.map((anchor: any) => ({
  macro_event_id: anchor.macro_event_id,
  label: anchor.label,
  event_type: anchor.event_type,
  priority: "high",
  ingestion_status: anchor.ingestion_status,
  checklist_items: [
    {
      item: "Confirm event date range",
      status: "open",
      required: true,
    },
    {
      item: "Attach authoritative macro source",
      status: "open",
      required: true,
      source_hints: anchor.source_hints,
    },
    {
      item: "Attach sector-specific source",
      status: "open",
      required: true,
      source_hints: anchor.source_hints,
    },
    {
      item: "Confirm transmission mechanisms",
      status: "open",
      required: true,
    },
    {
      item: "Document affected sectors",
      status: "open",
      required: true,
    },
    {
      item: "Write short benchmark note",
      status: "open",
      required: true,
    },
    {
      item: "Papa review before promotion to sourced anchor registry",
      status: "open",
      required: true,
    },
  ],
  minimum_ready_definition: {
    source_count_required: 2,
    authoritative_macro_source_required: true,
    sector_source_required: true,
    papa_review_required: true,
  },
}));

const output = {
  version: "replay-macro-source-checklist-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro source checklist converts high-priority macro anchors into source-enrichment tasks. It remains reference-only until sources are attached and Papa review is complete.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_sourced_batch: "data/replay/replay-macro-sourced-batch-v0.1.json",
  },
  checklist_count: checklist.length,
  checklist,
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-macro-source-checklist-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  output: outputPath,
  checklist_count: output.checklist_count,
  safety_mode: output.safety_mode,
});
