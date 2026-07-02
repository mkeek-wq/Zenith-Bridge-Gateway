import fs from "fs";
import path from "path";

const root = process.cwd();

const articleFile = path.join(
  root,
  "data/intelligence/openai-generated-article-package-v0.1.json"
);

const auditFile = path.join(
  root,
  "data/intelligence/openai-article-audit-v0.1.json"
);

const outputFile = path.join(
  root,
  "data/intelligence/cms-publication-package-v0.1.json"
);

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const articles = readJson(articleFile);
const audits = readJson(auditFile);

const auditMap = new Map(
  audits.audits.map((audit: any) => [audit.candidate_id, audit])
);

const publicationPackages = articles.articles
  .filter((article: any) => {
    const audit = auditMap.get(article.candidate_id);
    return audit?.publication_ready_for_human_review === true;
  })
  .map((article: any) => ({
    candidate_id: article.candidate_id,
    title: article.title,

    publication_status: "ready_for_manual_cms_review",

    markdown: article.markdown,

    governance: {
      human_review_required: true,
      cms_copy_paste_required: true,
      publication_approved_by_audit: true,
    },

    generated_at: article.generated_at,
  }));

const output = {
  package_version: "cms-publication-package-v0.1",
  generated_at: new Date().toISOString(),
  package_count: publicationPackages.length,
  packages: publicationPackages,
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2)
);

console.log({
  package_version: output.package_version,
  package_count: output.package_count,
  output: outputFile,
});
