import fs from "fs";
import path from "path";

const ARTICLE_FILE = "data/intelligence/openai-generated-article-package-v0.4.json";
const GRAPH_SPEC_FILE = "data/intelligence/graph-specification-package-v0.1.json";
const GRAPH_MANIFEST_FILE =
  "/var/www/zenith-admin/intelligence-data/assets/generated-graphs/rendered-graph-assets-v0.1.json";
const OUTPUT_FILE = "data/intelligence/article-graph-attachment-package-v0.1.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const articles = readJson(ARTICLE_FILE);
const graphSpecs = readJson(GRAPH_SPEC_FILE);
const manifest = readJson(GRAPH_MANIFEST_FILE);

const assetsBySpecId = new Map(
  (manifest.assets ?? []).map((asset: any) => [asset.graph_spec_id, asset])
);

const specsByCandidate = new Map<string, any[]>();

for (const spec of graphSpecs.graph_specs ?? []) {
  const existing = specsByCandidate.get(spec.candidate_id) ?? [];
  existing.push(spec);
  specsByCandidate.set(spec.candidate_id, existing);
}

const packages = (articles.articles ?? []).map((article: any) => {
  const specs = specsByCandidate.get(article.candidate_id) ?? [];

  const graph_attachments = specs.map((spec: any) => {
    const asset: any = assetsBySpecId.get(spec.graph_spec_id);

    return {
      graph_spec_id: spec.graph_spec_id,
      placeholder: spec.placeholder,
      recommended_chart_type: spec.recommended_chart_type,
      purpose: spec.purpose,
      public_path: asset?.public_path ?? null,
      output_path: asset?.output_path ?? null,
      rendered: Boolean(asset),
      source_data_verified: spec.governance?.source_data_verified ?? false,
      human_review_required: spec.governance?.human_review_required ?? true,
    };
  });

  return {
    candidate_id: article.candidate_id,
    title: article.title,
    generated_article_id: article.generated_article_id,
    graph_attachment_count: graph_attachments.length,
    all_graphs_rendered: graph_attachments.every((g: any) => g.rendered),
    graph_attachments,
    governance: {
      human_review_required: true,
      graph_review_required: true,
      article_graph_linkage_complete: graph_attachments.every(
        (g: any) => g.rendered
      ),
    },
  };
});

const output = {
  package_version: "article-graph-attachment-package-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    article_package: ARTICLE_FILE,
    graph_specification_package: GRAPH_SPEC_FILE,
    rendered_graph_manifest: GRAPH_MANIFEST_FILE,
  },
  package_count: packages.length,
  packages,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  package_count: output.package_count,
  output: OUTPUT_FILE,
});
