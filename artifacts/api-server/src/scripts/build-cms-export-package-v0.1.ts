import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();
const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const cover = readJson(path.join(root, "exports/article-generator/cover-image-brief-v0.1.json"));

const identity = publication.publication_identity;
const article = publication.article;
const status = publication.publication_status;

const seoDescription =
  article.excerpt?.slice(0, 155) ??
  "Singapore intelligence article generated from SMURF evidence and publication governance.";

const output = {
  package_version: "cms-export-package-v0.1",
  generated_at: new Date().toISOString(),
  source_publication_package: publication.package_version,

  cms_entry: {
    title: identity.title,
    slug: identity.slug,
    excerpt: article.excerpt,
    body_markdown: article.markdown,
    category: identity.category,
    country: identity.country,
    status: "draft",
    article_type: "smurf_interpretation",
    source_opportunity_id: identity.source_opportunity_id,
  },

  seo: {
    seo_title: identity.title,
    seo_description: seoDescription,
    canonical_slug: identity.slug,
  },

  media: {
    cover_image_required: true,
    cover_image_brief_version: cover.package_version,
    cover_image_prompt: cover.prompt_for_image_model,
    cover_image_status: cover.publish_status,
  },

  governance: {
    publication_recommendation: status.publication_recommendation,
    exact_figures_allowed: status.exact_figures_allowed,
    quantitative_graphs_allowed: status.quantitative_graphs_allowed,
    governance_note: status.governance_note,
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "cms-export-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.cms_entry.title,
  slug: output.cms_entry.slug,
  cms_status: output.cms_entry.status,
  publication_recommendation: output.governance.publication_recommendation,
  output: outPath,
});
