import fs from "node:fs";
import path from "node:path";

const replayDir = path.resolve("data/replay");

const checklistPath = path.join(
  replayDir,
  "replay-macro-source-checklist-v0.1.json"
);

const outputPath = path.join(
  replayDir,
  "replay-macro-source-attachment-drafts-v0.1.json"
);

const checklistRaw = JSON.parse(fs.readFileSync(checklistPath, "utf8"));

const drafts = checklistRaw.checklist.map((item: any) => ({
  macro_event_id: item.macro_event_id,
  label: item.label,
  event_type: item.event_type,
  priority: item.priority,
  source_attachment_status: "draft_needs_manual_sources",
  production_write_allowed: false,
  papa_review_required: true,
  source_entries: [],
  required_minimum: item.minimum_ready_definition,
  checklist_items: item.checklist_items,
  draft_note:
    "Attach source entries manually. This draft is reference-only and cannot promote anchors without Papa review."
}));

const output = {
  version: "replay-macro-source-attachment-drafts-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Macro source attachment drafts help humans attach sources to macro anchors. They do not promote, validate, or write production evidence.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_source_checklist: "data/replay/replay-macro-source-checklist-v0.1.json"
  },
  draft_count: drafts.length,
  drafts
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

console.log("✅ Macro source attachment drafts created");
console.log(`Output: ${outputPath}`);
console.log(`Draft count: ${drafts.length}`);
