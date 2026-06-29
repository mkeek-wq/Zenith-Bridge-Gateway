import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const graphPackage = readJson(
  path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json")
);

if (graphPackage.graph_ready !== true) {
  throw new Error("Institutional graph package is not ready.");
}

const output = {
  render_spec_version: "institutional-graph-render-spec-v0.1",
  generated_at: new Date().toISOString(),
  source_graph_package: graphPackage.package_version,
  article_identity: graphPackage.article_identity,
  chart: {
    type: "bar",
    title: graphPackage.title,
    subtitle: graphPackage.subtitle,
    x_axis: graphPackage.x_axis,
    y_axis: graphPackage.y_axis,
    data: graphPackage.series.map((s: any) => ({
      label: s.sector,
      value: s.value,
      unit: s.unit,
      period: s.period
    })),
    style: {
      theme: "institutional",
      header_color: "blue",
      title_text_color: "white",
      background: "white",
      source_panel: true
    }
  },
  source_panel: graphPackage.source_panel,
  verification_note:
    "Chart uses verified official sector output growth values. Synthetic and replay data are excluded.",
  output_targets: {
    png: "exports/article-generator/graphs/petroleum-sector-comparison-v0.1.png",
    svg: "exports/article-generator/graphs/petroleum-sector-comparison-v0.1.svg",
    json: "exports/article-generator/institutional-graph-render-spec-v0.1.json"
  }
};

const outPath = path.join(root, "exports/article-generator/institutional-graph-render-spec-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  render_spec_version: output.render_spec_version,
  data_points: output.chart.data.length,
  output: outPath
});
