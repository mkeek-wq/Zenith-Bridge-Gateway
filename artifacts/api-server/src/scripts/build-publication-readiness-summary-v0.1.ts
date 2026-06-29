import fs from "fs";

const PREVIEW_FILE =
  "data/intelligence/article-preview-package-v0.1.json";

const MANDATORY_AUDIT_FILE =
  "data/intelligence/mandatory-findings-audit-v0.1.json";

const OUTPUT_FILE =
  "data/intelligence/publication-readiness-summary-v0.1.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const previewPackage = readJson(PREVIEW_FILE);
const mandatoryAuditPackage = readJson(MANDATORY_AUDIT_FILE);

const mandatoryAuditByCandidate = new Map(
  (mandatoryAuditPackage.audits ?? []).map((audit: any) => [
    audit.candidate_id,
    audit,
  ])
);

const summaries = (previewPackage.previews ?? []).map((preview: any) => {
  const previewAuditReady = preview.audit?.publication_ready === true;
  const previewMandatoryReady =
    preview.audit?.mandatory_findings_passed === true;
  const previewCriticalReady =
    preview.audit?.critical_findings_passed === true;

  const mandatoryAudit = mandatoryAuditByCandidate.get(
    preview.candidate_id
  ) as any;

  const mandatoryAuditAttached = Boolean(mandatoryAudit);
  const mandatoryFindingsReady =
    mandatoryAudit?.mandatory_findings_passed === true;
  const criticalFindingsReady =
    mandatoryAudit?.critical_findings_passed === true;

  const graphsReady = preview.graphs?.all_graphs_rendered === true;
  const graphCount = preview.graphs?.graph_attachment_count ?? 0;

  const blockers = [
    !previewAuditReady ? "preview_audit_not_publication_ready" : null,
    !previewMandatoryReady
      ? "preview_mandatory_findings_not_passed"
      : null,
    !previewCriticalReady
      ? "preview_critical_findings_not_passed"
      : null,
    !mandatoryAuditAttached ? "mandatory_findings_audit_missing" : null,
    mandatoryAuditAttached && !mandatoryFindingsReady
      ? "mandatory_findings_audit_failed"
      : null,
    mandatoryAuditAttached && !criticalFindingsReady
      ? "critical_findings_audit_failed"
      : null,
    !graphsReady ? "graphs_not_fully_rendered" : null,
    graphCount === 0 ? "no_graphs_attached" : null,
  ].filter(Boolean);

  const publicationReady = blockers.length === 0;

  return {
    candidate_id: preview.candidate_id,
    title: preview.title,

    publication_ready: publicationReady,

    preview_audit_ready: previewAuditReady,
    preview_mandatory_findings_passed: previewMandatoryReady,
    preview_critical_findings_passed: previewCriticalReady,

    mandatory_findings_audit_attached: mandatoryAuditAttached,
    mandatory_findings_passed: mandatoryFindingsReady,
    critical_findings_passed: criticalFindingsReady,

    graph_count: graphCount,
    graphs_ready: graphsReady,

    caution_status:
      preview.article?.governance?.caution_status ??
      preview.governance?.caution_status ??
      false,

    blockers,

    recommendation: publicationReady
      ? "ready_for_human_editorial_review"
      : "hold_for_pipeline_or_editorial_fix",
  };
});

const output = {
  summary_version: "publication-readiness-summary-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    preview_package: PREVIEW_FILE,
    mandatory_findings_audit: MANDATORY_AUDIT_FILE,
  },
  article_count: summaries.length,
  publication_ready_count: summaries.filter(
    (summary: any) => summary.publication_ready
  ).length,
  blocked_count: summaries.filter(
    (summary: any) => !summary.publication_ready
  ).length,
  summaries,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  summary_version: output.summary_version,
  article_count: output.article_count,
  publication_ready_count: output.publication_ready_count,
  blocked_count: output.blocked_count,
  output: OUTPUT_FILE,
});
