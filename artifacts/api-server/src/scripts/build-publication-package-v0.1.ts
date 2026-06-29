import fs from "fs";
import path from "path";

function readJson(filePath: string, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) throw new Error(`Missing input file: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const draft = readJson(path.join(root, "exports/article-generator/article-draft-generator-v0.6.json"));
const graph = readJson(path.join(root, "data/article-generator/graph-opportunity-generator-v0.2.json"), false);
const snapshot = readJson(path.join(root, "data/article-generator/smurf-intelligence-snapshot-v0.1.json"), false);
const metrics = readJson(path.join(root, "data/article-generator/verified-metrics-registry-v0.1.json"), false);
const dataRequests = readJson(path.join(root, "data/article-generator/data-request-queue-v0.1.json"), false);

const output = {
  package_version: "publication-package-v0.1",
  generated_at: new Date().toISOString(),

  publication_identity: {
    title: draft.article_identity?.title,
    slug: draft.article_identity?.slug,
    country: draft.metadata?.country,
    category: draft.metadata?.category,
    status: draft.metadata?.status,
    source_opportunity_id: draft.metadata?.source_opportunity_id,
  },

  article: {
    markdown: draft.article_markdown,
    excerpt: draft.metadata?.excerpt,
    word_count: draft.article_markdown?.split(/\s+/).length ?? 0,
  },

  smurf_snapshot: snapshot?.intelligence_snapshot ?? null,

  smurf_evidence: draft.smurf_evidence ?? null,

  graph_briefs: graph?.graph_opportunities ?? graph?.opportunities ?? [],

  verified_metrics_status: {
    registry_version: metrics?.registry_version ?? null,
    total_metrics: metrics?.total_metrics ?? 0,
    verified: metrics?.verified ?? 0,
    pending: metrics?.pending ?? 0,
    graph_ready: metrics?.graph_ready ?? 0,
  },

  missing_data: dataRequests?.requests ?? dataRequests?.data_requests ?? [],

  publication_status: {
    article_ready: true,
    exact_figures_allowed: draft.metadata?.allow_exact_figures === true,
    quantitative_graphs_allowed: draft.metadata?.allow_quantitative_graphs === true,
    publication_recommendation:
      draft.metadata?.allow_exact_figures === true
        ? "ready_for_editorial_review"
        : "draft_ready_pending_verified_metrics",
    governance_note:
      "Publication package may be used for editorial review. Exact figures, rankings, and quantitative charts remain blocked unless verified metrics are approved.",
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "publication-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.publication_identity.title,
  status: output.publication_status.publication_recommendation,
  word_count: output.article.word_count,
  graph_briefs: output.graph_briefs.length,
  missing_data: output.missing_data.length,
  output: outPath,
});

