import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const quant = readJson(
  path.join(root, "exports/article-generator/article-quant-dataset-registry-v0.1.json")
);

const graphPackage = readJson(
  path.join(root, "exports/article-generator/article-graph-dataset-package-v0.1.json")
);

const score =
  quant.graph_eligible_datasets >= 3 ? 90 :
  quant.graph_eligible_datasets === 2 ? 75 :
  quant.graph_eligible_datasets === 1 ? 55 :
  25;

const output = {
  report_version: "article-quant-readiness-report-v0.1",
  generated_at: new Date().toISOString(),
  article_identity: quant.article_identity,
  quant_readiness_score: score,
  quant_readiness_band:
    score >= 85 ? "strong" :
    score >= 70 ? "moderate" :
    score >= 50 ? "limited" :
    "weak",
  datasets: {
    total: quant.total_datasets,
    graph_eligible: quant.graph_eligible_datasets,
  },
  graphs: graphPackage.summary,
  publication_guidance: {
    quantitative_article_allowed: quant.graph_eligible_datasets > 0,
    dense_quantitative_article_allowed: quant.graph_eligible_datasets >= 3,
    recommended_graph_strategy:
      quant.graph_eligible_datasets >= 3
        ? "Use multi-metric institutional graph package."
        : quant.graph_eligible_datasets === 1
        ? "Use one simple quantitative graph plus conceptual visuals."
        : "Use conceptual visuals only.",
    article_text_rule:
      "Avoid dense percentages in article text; let graphs carry numerical density.",
  },
  blockers:
    quant.graph_eligible_datasets < 3
      ? [
          "Additional verified datasets needed for multi-series graph package.",
          "Do not use synthetic replay evidence as quantitative chart data.",
          "Need official values for bunker sales, aviation or fuel demand, and sector-level manufacturing series.",
        ]
      : [],
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-quant-readiness-report-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  report_version: output.report_version,
  title: quant.article_identity.title,
  score: output.quant_readiness_score,
  band: output.quant_readiness_band,
  datasets: output.datasets.graph_eligible,
  quantitative_article_allowed: output.publication_guidance.quantitative_article_allowed,
  output: outPath,
});
