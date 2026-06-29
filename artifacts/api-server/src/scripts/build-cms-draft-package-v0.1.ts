import fs from "fs";
import path from "path";

const root = process.cwd();

const sourceFile = path.join(
  root,
  "data/intelligence/cms-publication-package-v0.1.json"
);

const outputFile = path.join(
  root,
  "data/intelligence/cms-draft-package-v0.1.json"
);

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractExcerpt(markdown: string) {
  const withoutTitle = markdown.replace(/^# .+\n+/, "").trim();
  const firstParagraph = withoutTitle.split(/\n\s*\n/)[0] ?? "";
  return firstParagraph.slice(0, 320);
}

const source = readJson(sourceFile);

const drafts = (source.packages ?? []).map((pkg: any) => ({
  candidate_id: pkg.candidate_id,
  title: pkg.title,
  slug: slugify(pkg.title),
  excerpt: extractExcerpt(pkg.markdown),
  body_markdown: pkg.markdown,
  country: "Singapore",
  category: "Intelligence",
  status: "draft_ready_for_manual_creation",
  cms_mutation_allowed: false,
  governance: {
    source_package: "cms-publication-package-v0.1",
    human_review_required: true,
    automatic_publish_allowed: false,
    automatic_cms_write_allowed: false,
    manual_copy_paste_required: true,
  },
  generated_at: new Date().toISOString(),
}));

const output = {
  package_version: "cms-draft-package-v0.1",
  generated_at: new Date().toISOString(),
  source_file: "data/intelligence/cms-publication-package-v0.1.json",
  draft_count: drafts.length,
  drafts,
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  draft_count: output.draft_count,
  output: outputFile,
});
