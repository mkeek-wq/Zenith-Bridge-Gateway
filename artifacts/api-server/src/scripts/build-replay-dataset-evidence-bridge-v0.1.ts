import fs from "node:fs";
import path from "node:path";

const apiRoot = process.cwd();

function readJson(relativePath: string, fallback: any) {
  const fullPath = path.join(apiRoot, relativePath);
  if (!fs.existsSync(fullPath)) return fallback;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const attachmentDrafts = readJson(
  "data/replay/replay-macro-source-attachment-drafts-v0.1.json",
  { drafts: [], dataset_count: 0, dataset_candidate_total: 0 }
);

const auditReport = readJson("data/intelligence/dataset-audit-report-v0.1.json", {
  dataset_count: 0,
  pass_count: 0,
  questionable_count: 0,
  fail_count: 0,
  audits: []
});

const drafts = Array.isArray(attachmentDrafts.drafts)
  ? attachmentDrafts.drafts
  : [];

const audits = Array.isArray(auditReport.audits) ? auditReport.audits : [];

const auditByDataset = new Map(
  audits.map((audit: any) => [audit.dataset_id, audit])
);

const bridge_items = drafts.map((draft: any) => {
  const candidates = Array.isArray(draft.dataset_source_candidates)
    ? draft.dataset_source_candidates
    : [];

  const passCandidates = candidates.filter((candidate: any) => {
    const audit = auditByDataset.get(candidate.dataset_id) as any;
    return audit?.audit_status === "PASS";
  });

  return {
    macro_event_id: draft.macro_event_id,
    label: draft.label,
    event_type: draft.event_type,
    priority: draft.priority,
    dataset_candidate_count: candidates.length,
    pass_dataset_candidate_count: passCandidates.length,
    candidate_dataset_ids: candidates.map((candidate: any) => candidate.dataset_id),
    pass_candidate_dataset_ids: passCandidates.map(
      (candidate: any) => candidate.dataset_id
    ),
    evidence_bridge_status:
      passCandidates.length > 0
        ? "dataset_candidates_available_for_papa_review"
        : "no_passed_dataset_candidates",
    production_write_allowed: false,
    papa_review_required: true
  };
});

const eventsWithPassedDatasetCandidates = bridge_items.filter(
  (item: any) => item.pass_dataset_candidate_count > 0
).length;

const output = {
  version: "replay-dataset-evidence-bridge-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Dataset evidence bridge summarizes passed dataset candidates attached to macro source drafts. It does not promote evidence, certify truth, or change replay confidence without explicit governance approval.",
  safety_mode: "REFERENCE_ONLY",
  production_write_allowed: false,
  source_files: {
    macro_source_attachment_drafts:
      "data/replay/replay-macro-source-attachment-drafts-v0.1.json",
    dataset_audit_report: "data/intelligence/dataset-audit-report-v0.1.json"
  },
  dataset_count: auditReport.dataset_count,
  dataset_pass_count: auditReport.pass_count,
  dataset_questionable_count: auditReport.questionable_count,
  dataset_fail_count: auditReport.fail_count,
  draft_count: bridge_items.length,
  dataset_candidate_total: attachmentDrafts.dataset_candidate_total ?? 0,
  events_with_passed_dataset_candidates: eventsWithPassedDatasetCandidates,
  dataset_evidence_coverage_ratio:
    bridge_items.length > 0
      ? Number((eventsWithPassedDatasetCandidates / bridge_items.length).toFixed(3))
      : 0,
  bridge_items
};

const outputPath = path.join(
  apiRoot,
  "data/replay/replay-dataset-evidence-bridge-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

console.log({
  output: outputPath,
  dataset_count: output.dataset_count,
  dataset_pass_count: output.dataset_pass_count,
  draft_count: output.draft_count,
  events_with_passed_dataset_candidates:
    output.events_with_passed_dataset_candidates,
  dataset_evidence_coverage_ratio: output.dataset_evidence_coverage_ratio
});
