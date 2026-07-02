import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const article = readJson(path.join(root, "exports/article-generator/publication-article-v0.1.json"));
const gate = readJson(path.join(root, "exports/article-generator/publication-readiness-gate-v0.1.json"));
const graphSpec = readJson(path.join(root, "exports/article-generator/institutional-graph-render-spec-v0.1.json"));
const transparencyPanel = readJson(path.join(root, "exports/article-generator/publication-transparency-panel-v0.1.json"));

if (gate.decision.publish_allowed !== true) {
  throw new Error("Publication gate has not approved this article.");
}

const output = {
  package_version: "cms-finalization-package-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: article.article_identity,
  source_publication_article: article.package_version,
  source_publication_gate: gate.gate_version,
  publication_decision: gate.decision,
  cms_status: gate.decision.institutional_grade
    ? "ready_for_institutional_publication"
    : "ready_for_interpretation_publication",
  article_payload: {
    title: article.article_identity?.title,
    slug: article.article_identity?.slug,
    country: article.article_identity?.country,
    category: article.article_identity?.category,
    body_markdown:
  article.article_markdown ??
  article.body_markdown ??
  article.body ??
  (
    fs.existsSync(path.join(root, "exports/article-generator/what-petroleum-output-reveals-about-singapore-s-exposure-to-global-energy-cycles-publication-article-v0.1.md"))
      ? fs.readFileSync(path.join(root, "exports/article-generator/what-petroleum-output-reveals-about-singapore-s-exposure-to-global-energy-cycles-publication-article-v0.1.md"), "utf8")
      : null
  ),
    graph: {
      render_spec: graphSpec.output_targets.json,
      png_target: graphSpec.output_targets.png,
      svg_target: graphSpec.output_targets.svg,
      placement: "after_opening_section"
    },
    transparency_panel: transparencyPanel.transparency_panel,
    publication_grade: transparencyPanel.transparency_panel.publication_grade
  },
  final_checks: {
    publication_gate_passed: true,
    institutional_grade: gate.decision.institutional_grade,
    graph_spec_attached: true,
    transparency_panel_attached: true
  },
  next_actions: [
    "Render graph image from institutional-graph-render-spec-v0.1.json.",
    "Attach graph to CMS article.",
    "Review article text against verified values before publishing."
  ]
};

const outPath = path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  cms_status: output.cms_status,
  institutional_grade: output.final_checks.institutional_grade,
  output: outPath
});
