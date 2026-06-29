import fs from "fs";

const ARTICLE_FILE =
  "data/intelligence/openai-generated-article-package-v0.4.json";
const AUDIT_FILE = "data/intelligence/openai-article-audit-v0.2.json";
const GRAPH_ATTACHMENT_FILE =
  "data/intelligence/article-graph-attachment-package-v0.1.json";
const OUTPUT_FILE = "data/intelligence/article-preview-package-v0.1.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const articlePackage = readJson(ARTICLE_FILE);
const auditPackage = readJson(AUDIT_FILE);
const graphAttachmentPackage = readJson(GRAPH_ATTACHMENT_FILE);

const auditsByCandidate = new Map(
  (auditPackage.audits ?? []).map((audit: any) => [audit.candidate_id, audit])
);

const graphsByCandidate = new Map(
  (graphAttachmentPackage.packages ?? []).map((pkg: any) => [
    pkg.candidate_id,
    pkg,
  ])
);

const previews = (articlePackage.articles ?? []).map((article: any) => {
  const audit: any =
  auditsByCandidate.get(article.candidate_id) ?? null;

  const graphPackage: any =
  graphsByCandidate.get(article.candidate_id) ?? null;

  return {
    candidate_id: article.candidate_id,
    generated_article_id: article.generated_article_id,
    title: article.title,

    article: {
      markdown: article.markdown,
      generated_at: article.generated_at,
      generation_model: article.generation_model,
      source_package_version: article.source_package_version,
      mandatory_findings_count: article.mandatory_findings_count,
    },

    audit: audit
      ? {
          audit_version: audit.audit_version,
          generated_article_found: audit.generated_article_found,
          mandatory_findings_passed: audit.mandatory_findings_passed,
          critical_findings_passed: audit.critical_findings_passed,
          publication_ready: audit.publication_ready,
          missing_findings: audit.missing_findings ?? [],
          mandatory_finding_audit: audit.mandatory_finding_audit ?? [],
        }
      : null,

    graphs: graphPackage
      ? {
          graph_attachment_count: graphPackage.graph_attachment_count,
          all_graphs_rendered: graphPackage.all_graphs_rendered,
          graph_attachments: graphPackage.graph_attachments ?? [],
        }
      : null,

    governance: {
      human_review_required: true,
      publication_ready: Boolean(audit?.publication_ready),
      article_audit_required: true,
      graph_review_required: true,
      graph_linkage_complete: Boolean(graphPackage?.all_graphs_rendered),
      autonomous_publication_allowed: false,
    },
  };
});

const output = {
  package_version: "article-preview-package-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    article_package: ARTICLE_FILE,
    audit_package: AUDIT_FILE,
    graph_attachment_package: GRAPH_ATTACHMENT_FILE,
  },
  preview_count: previews.length,
  publication_ready_count: previews.filter(
    (preview: any) => preview.governance.publication_ready
  ).length,
  previews,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  preview_count: output.preview_count,
  publication_ready_count: output.publication_ready_count,
  output: OUTPUT_FILE,
});
