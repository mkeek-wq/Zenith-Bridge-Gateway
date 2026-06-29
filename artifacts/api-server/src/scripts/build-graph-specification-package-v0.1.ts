import fs from "fs";
import path from "path";

const root = process.cwd();

const articleFile = path.join(
  root,
  "data/intelligence/openai-generated-article-package-v0.4.json"
);

const workbenchFile = path.join(
  root,
  "data/intelligence/article-workbench-package-v0.2.json"
);

const outputFile = path.join(
  root,
  "data/intelligence/graph-specification-package-v0.1.json"
);

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function extractGraphPlaceholders(markdown: string) {
  const matches = markdown.match(/\[GRAPH:\s*([^\]]+)\]/g) ?? [];

  return matches.map((match) =>
    match.replace("[GRAPH:", "").replace("]", "").trim()
  );
}

function safeId(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

const articles = readJson(articleFile);
const workbench = readJson(workbenchFile);

const workbenchByCandidate = new Map(
  (workbench.packages ?? []).map((pkg: any) => [pkg.candidate_id, pkg])
);

const graphSpecs = (articles.articles ?? []).flatMap((article: any) => {
  const pkg = workbenchByCandidate.get(article.candidate_id) as any;
  const graphPackages = pkg?.graph_packages ?? [];
  const placeholders = extractGraphPlaceholders(article.markdown ?? "");

  return placeholders.map((placeholder: string, index: number) => {
    const isComparison =
      placeholder.toLowerCase().includes("versus") ||
      placeholder.toLowerCase().includes("indexed");

    const selectedPackages = isComparison
      ? graphPackages.slice(0, 2)
      : graphPackages.slice(0, 1);

    return {
      graph_spec_id: `GSPEC_${safeId(article.candidate_id)}_${index + 1}`,
      candidate_id: article.candidate_id,
      article_title: article.title,
      placeholder,
      recommended_chart_type: isComparison
        ? "indexed_multi_series_line_chart"
        : "single_series_line_chart",
      visual_standard: {
        header_style: "dark_blue_header_white_text",
        footer_required: true,
        source_line_required: true,
        confidence_line_required: true,
        znbw_branding_required: true
      },
      purpose: isComparison
        ? "Compare the primary sector against a benchmark series over time."
        : "Show the historical trend of the primary sector series.",
      series: selectedPackages.map((graph: any) => ({
        dataset_id: graph.dataset_id,
        title: graph.title,
        unit: graph.unit,
        frequency: graph.frequency,
        coverage_start: graph.coverage_start,
        coverage_end: graph.coverage_end,
        latest_period: graph.latest_period,
        latest_value: graph.latest_value,
        latest_yoy_percent: graph.latest_yoy_percent,
        ten_year_change_percent: graph.ten_year_change_percent,
        values: graph.values,
        source_name: graph.source_name,
        source_url: graph.source_url,
        source_metadata: graph.source_metadata
      })),
      render_requirements: {
        period_start: selectedPackages[0]?.coverage_start ?? null,
        period_end: selectedPackages[0]?.coverage_end ?? null,
        include_forecast: false,
        forecast_years: 0,
        show_latest_value_callout: true,
        show_yoy_callout: true,
        show_ten_year_change_callout: true,
        chart_density: "medium",
        annotation_depth: "medium"
      },
      governance: {
        human_review_required: true,
        graph_render_allowed: selectedPackages.length > 0,
        source_data_verified: selectedPackages.length > 0
      },
      generated_at: new Date().toISOString()
    };
  });
});

const output = {
  package_version: "graph-specification-package-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    article_package: "data/intelligence/openai-generated-article-package-v0.3.json",
    workbench_package: "data/intelligence/article-workbench-package-v0.2.json"
  },
  graph_spec_count: graphSpecs.length,
  graph_specs: graphSpecs
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  graph_spec_count: output.graph_spec_count,
  output: outputFile
});
