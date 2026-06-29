import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function formatPercent(value: any) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return `${Number(value).toFixed(1)}%`;
}

function formatNumber(value: any) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function buildDraft(pkg: any) {
  const candidate = pkg.candidate;
  const intel = pkg.intelligence_package;
  const graphs = pkg.graph_packages ?? [];
  const primaryGraph = graphs[0];
  const comparisonGraph = graphs[1];

  const title = candidate.title;
  const excerpt = candidate.excerpt;

  const confidence = intel?.signal?.confidence_tier ?? candidate.confidence_band ?? "n/a";
  const evidenceCaseCount = intel?.signal?.case_count ?? candidate.source_case_count ?? "n/a";
  const evidencePatterns = (intel?.evidence_patterns ?? [])
    .slice(0, 6)
    .map((x: any) => x.phrase)
    .join(", ");

  const primaryLatest = primaryGraph
    ? `${primaryGraph.title} reached ${formatNumber(primaryGraph.latest_value)} ${primaryGraph.unit ?? ""} in ${primaryGraph.latest_period}, with latest YoY change of ${formatPercent(primaryGraph.latest_yoy_percent)}.`
    : "Primary graph package unavailable.";

  const comparisonLatest = comparisonGraph
    ? `${comparisonGraph.title} reached ${formatNumber(comparisonGraph.latest_value)} ${comparisonGraph.unit ?? ""} in ${comparisonGraph.latest_period}, with latest YoY change of ${formatPercent(comparisonGraph.latest_yoy_percent)}.`
    : "";

  const markdown = `# ${title}

${excerpt}

## What happened?

${primaryLatest}

${comparisonLatest}

The verified data package covers ${pkg.coverage?.verified_dataset_count ?? 0} verified datasets out of ${pkg.coverage?.required_dataset_count ?? 0} required datasets. The article passed the readiness gate with status: ${pkg.readiness_decision?.generation_status ?? "n/a"}.

## Why did it happen?

${intel?.business_implication ?? "Business implication not available."}

The primary driver identified by the Intelligence Engine is **${intel?.source_driver?.driver_name ?? candidate.primary_driver}**.

## What does the historical evidence show?

The signal is classified as **${confidence}**, based on ${evidenceCaseCount} source cases.

Evidence patterns include: ${evidencePatterns || "n/a"}.

## Why does it matter for businesses?

${intel?.why_it_matters ?? "Why-it-matters note not available."}

Affected sectors include: ${(intel?.affected_sectors ?? []).join(", ") || "n/a"}.

## What should operators watch next?

Operators should monitor whether the same pattern continues in the next official releases, whether related manufacturing sectors confirm the signal, and whether the underlying driver remains consistent with the historical evidence.

## Data and sources

${(pkg.source_registry ?? [])
  .map((source: any) => `- ${source.name}: ${source.source_metadata?.datasource ?? "Source"} / ${source.source_metadata?.table_title ?? "Table"} / ${source.source_metadata?.row_text ?? "Row"}`)
  .join("\n")}

## Confidence

This article is based on verified datasets, graph-ready packages, and Intelligence Engine evidence patterns. Confidence band: ${confidence}. Human editorial review remains required before publication.
`;

  return {
    draft_id: `DRAFT_${pkg.candidate_id}`,
    candidate_id: pkg.candidate_id,
    title,
    excerpt,
    country: candidate.country,
    category: candidate.category,
    status: "draft_generated_for_human_review",
    generation_mode: "deterministic_scaffold_v0.1",
    markdown,
    graph_instructions: {
      recommended_graphs: intel?.editorial_guidance?.required_graphs ?? [],
      available_graph_packages: graphs.map((graph: any) => ({
        graph_package_id: graph.graph_package_id,
        dataset_id: graph.dataset_id,
        title: graph.title,
        recommended_graphs: graph.recommended_graphs,
      })),
    },
    source_section: pkg.source_registry ?? [],
    confidence_section: {
      confidence_band: confidence,
      confidence_score: intel?.signal?.confidence_score ?? candidate.confidence_score,
      evidence_case_count: evidenceCaseCount,
      workbench_status: pkg.workbench_status,
      readiness_status: pkg.readiness_decision?.generation_status ?? null,
    },
    governance: {
      human_review_required: true,
      autonomous_publication_allowed: false,
      cms_copy_paste_required: true,
      internal_reference_check_required: true,
    },
    generated_at: new Date().toISOString(),
  };
}

const workbench = readJson(
  path.join(root, "data/intelligence/article-workbench-package-v0.2.json")
);

const readyPackages = (workbench.packages ?? []).filter(
  (pkg: any) => pkg.workbench_status === "workbench_ready"
);

const drafts = readyPackages.map(buildDraft);

const output = {
  draft_package_version: "article-draft-package-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Deterministic draft scaffolds generated from article workbench v0.2 packages before OpenAI narrative generation.",
  source_file: "data/intelligence/article-workbench-package-v0.2.json",
  draft_count: drafts.length,
  drafts,
};

const outPath = path.join(root, "data/intelligence/article-draft-package-v0.1.json");
writeJson(outPath, output);

console.log({
  draft_package_version: output.draft_package_version,
  draft_count: output.draft_count,
  output: outPath,
});
