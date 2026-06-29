import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const cms = readJson(path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json"));
const gate = readJson(path.join(root, "exports/article-generator/publication-readiness-gate-v0.1.json"));
const authority = readJson(path.join(root, "exports/article-generator/publication-source-authority-review-v0.1.json"));
const graph = readJson(path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json"));

const slug = cms.article_payload.slug;

const manifest = {
  manifest_version: "smurf-bi-candidate-manifest-v0.1",
  generated_at: new Date().toISOString(),
  engine_section: "SMURF BI Engine",
  candidates: [
    {
      title: cms.article_payload.title,
      slug,
      category: cms.article_payload.category,
      country: cms.article_payload.country,
      publication_grade: cms.article_payload.publication_grade,
      cms_status: cms.cms_status,
      gate_status: gate.decision.recommended_status,
      institutional_grade: gate.decision.institutional_grade,
      authority_score: authority.scores.authority_score,
      authority_band: authority.band,
      graph_ready: graph.graph_ready,
      verified_metrics_count: graph.series.length,
      preview_url: `/znbw-previews/${slug}-preview-v0.1.html`,
      graph_url: `/znbw-previews/petroleum-sector-comparison-v0.1.svg`,
      source_package: "exports/article-generator/cms-finalization-package-v0.1.json",
      promotion_status: "pre_draft_manual_review",
      next_action: "Review preview and manually copy into CMS."
    }
  ]
};

const outPath = path.join(root, "exports/article-generator/smurf-bi-candidate-manifest-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log({
  manifest_version: manifest.manifest_version,
  candidates: manifest.candidates.length,
  output: outPath
});
