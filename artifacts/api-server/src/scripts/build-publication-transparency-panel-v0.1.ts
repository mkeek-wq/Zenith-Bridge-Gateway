import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const gate = readJson(path.join(root, "exports/article-generator/publication-readiness-gate-v0.1.json"));
const graphPackage = readJson(path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json"));
const authorityReview = readJson(path.join(root, "exports/article-generator/publication-source-authority-review-v0.1.json"));
const integrityGuard = readJson(path.join(root, "exports/article-generator/sector-metric-integrity-guard-v0.1.json"));

const output = {
  panel_version: "publication-transparency-panel-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: gate.article_identity,
  publication_status: gate.decision,
  source_gate: gate.gate_version,
  transparency_panel: {
    publication_grade: gate.decision.institutional_grade
      ? "ZNBW Institutional Intelligence Article"
      : "ZNBW Interpretation Article",
    authority_band: authorityReview.band,
    authority_score: authorityReview.scores.authority_score,
    data_integrity: integrityGuard.integrity_passed ? "passed" : "failed",
    institutional_graph_ready: graphPackage.graph_ready,
    verified_metrics_count: graphPackage.series.length,
    source_panel: graphPackage.source_panel,
    governance_notes: [
      "Only verified sector metrics are used in charts.",
      "Synthetic replay data is excluded from quantitative visuals.",
      "Pending metrics may remain in the input file but do not block publication unless marked verified.",
      "Publication gate must pass before institutional article release."
    ]
  }
};

const outPath = path.join(root, "exports/article-generator/publication-transparency-panel-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  panel_version: output.panel_version,
  grade: output.transparency_panel.publication_grade,
  verified_metrics_count: output.transparency_panel.verified_metrics_count,
  output: outPath
});
