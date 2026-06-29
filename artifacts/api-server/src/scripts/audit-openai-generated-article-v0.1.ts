import fs from "fs";
import path from "path";

const root = process.cwd();

const inputPath = path.join(
  root,
  "data/intelligence/openai-generated-article-package-v0.1.json"
);

const outputPath = path.join(
  root,
  "data/intelligence/openai-article-audit-v0.1.json"
);

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function containsAny(text: string, patterns: string[]) {
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function auditArticle(article: any) {
  const markdown = String(article.markdown ?? "");
  const failures: string[] = [];
  const warnings: string[] = [];

  if (!article.title) failures.push("missing_title");
  if (!markdown.trim()) failures.push("missing_markdown_body");

  if (!markdown.includes("## Sources")) failures.push("missing_sources_section");
  if (!markdown.includes("## Confidence")) failures.push("missing_confidence_section");

  if (
    containsAny(markdown, [
      "SMURF",
      "smurf",
      "What SMURF Found",
      "replay analysis",
      "internal engine",
      "hidden mechanism",
      "internal id",
      "candidate_id",
      "graph_package_id",
      "dataset_id",
    ])
  ) {
    failures.push("internal_reference_detected");
  }

  if (
    containsAny(markdown, [
      "placeholder",
      "insert source",
      "todo",
      "tbd",
      "lorem ipsum",
      "fake",
      "synthetic",
      "example.com",
    ])
  ) {
    failures.push("placeholder_or_test_content_detected");
  }

  if (!markdown.includes("https://tablebuilder.singstat.gov.sg")) {
    warnings.push("singstat_source_url_not_found_in_markdown");
  }

  if (!article.governance?.human_review_required) {
    failures.push("human_review_not_required");
  }

  if (article.governance?.autonomous_publication_allowed === true) {
    failures.push("autonomous_publication_allowed");
  }

  if (markdown.length < 2000) {
    warnings.push("article_body_may_be_too_short");
  }

  if (markdown.length > 12000) {
    warnings.push("article_body_may_be_too_long");
  }

  const publicationReady = failures.length === 0;

  return {
    generated_article_id: article.generated_article_id,
    candidate_id: article.candidate_id,
    title: article.title,
    audit_status: publicationReady
      ? "publication_ready_for_human_review"
      : "publication_blocked",
    publication_ready_for_human_review: publicationReady,
    failures,
    warnings,
    checks: {
      has_title: Boolean(article.title),
      has_markdown_body: markdown.trim().length > 0,
      has_sources_section: markdown.includes("## Sources"),
      has_confidence_section: markdown.includes("## Confidence"),
      human_review_required: article.governance?.human_review_required === true,
      autonomous_publication_blocked:
        article.governance?.autonomous_publication_allowed !== true,
      internal_reference_free: !failures.includes("internal_reference_detected"),
      placeholder_free: !failures.includes("placeholder_or_test_content_detected"),
    },
    audited_at: new Date().toISOString(),
  };
}

const input = readJson(inputPath);

const articleAudits = (input.articles ?? []).map(auditArticle);

const output = {
  audit_version: "openai-article-audit-v0.1",
  generated_at: new Date().toISOString(),
  source_file: "data/intelligence/openai-generated-article-package-v0.1.json",
  article_count: articleAudits.length,
  publication_ready_count: articleAudits.filter(
    (audit: any) => audit.publication_ready_for_human_review
  ).length,
  blocked_count: articleAudits.filter(
    (audit: any) => !audit.publication_ready_for_human_review
  ).length,
  audits: articleAudits,
};

writeJson(outputPath, output);

console.log({
  audit_version: output.audit_version,
  article_count: output.article_count,
  publication_ready_count: output.publication_ready_count,
  blocked_count: output.blocked_count,
  output: outputPath,
});
