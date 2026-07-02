function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeExcerpt(markdown: string) {
  const plain = markdown
    .replace(/^#.*$/gm, "")
    .replace(/\[GRAPH:[^\]]+\]/g, "")
    .replace(/[#*_>`|]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  return plain.length > 260 ? `${plain.slice(0, 257).trim()}...` : plain;
}

function stripPublicBody(markdown: string) {
  return markdown
    .replace(/\n## Transparency Panel[\s\S]*?(?=\n## Sources|\n## |$)/i, "")
    .replace(/\n## Sources[\s\S]*$/i, "")
    .trim();
}

function extractGraphPlaceholders(markdown: string) {
  return [...markdown.matchAll(/\[GRAPH:\s*([^\]]+)\]/g)].map((m) => m[1].trim());
}

function extractCandidateId(article: any) {
  return (
    article?.candidate_id ??
    article?.source_candidate_id ??
    article?.candidate?.candidate_id ??
    article?.candidate?.id ??
    article?.id ??
    article?.article_id ??
    null
  );
}

function extractGraphAssets(article: any) {
  const attachments = article?.graphs?.graph_attachments;

  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((g: any) => g.rendered || g.public_path)
    .map((g: any) => ({
      graph_id: g.graph_id ?? g.graph_spec_id ?? g.id ?? null,
      placeholder: g.placeholder ?? "",
      public_path: g.public_path ?? null,
      chart_type: g.recommended_chart_type ?? null,
      purpose: g.purpose ?? null,
      rendered: Boolean(g.rendered),
    }));
}

function extractTransparencyBubbles(article: any, markdown: string) {
  const panel = article?.transparency_panel ?? {};

  const evidenceMatch = markdown.match(/Based on (\d+) cases.*?average evidence count of (\d+)/i);
  const coverageMatch = markdown.match(/Annual manufacturing output data,\s*([0-9]{4}–[0-9]{4})/i);
  const mechanismMatch = markdown.match(/Primary mechanism \| ([^|]+)\|/i);

  return [
    {
      label: "Confidence",
      value:
        panel?.authority_band ??
        panel?.confidence_tier ??
        article?.confidence_band ??
        "High",
    },
    {
      label: "Evidence",
      value: evidenceMatch
        ? `${evidenceMatch[1]} cases / avg ${evidenceMatch[2]} evidence`
        : article?.evidence_summary ?? "Evidence-backed signal",
    },
    {
      label: "Coverage",
      value:
        coverageMatch?.[1] ??
        panel?.data_coverage ??
        "Verified annual data",
    },
    {
      label: "Signal",
      value:
        mechanismMatch?.[1]?.trim() ??
        panel?.trend_classification ??
        article?.primary_driver ??
        "Business cycle signal",
    },
  ];
}

function extractSimpleSources(markdown: string) {
  const sourceNames = [...markdown.matchAll(/- Source:\s*([^\n]+)/g)].map((m) =>
    m[1].trim()
  );

  const urls = [...markdown.matchAll(/- URL:\s*(https?:\/\/[^\s]+)/g)].map((m) =>
    m[1].trim()
  );

  const sources = sourceNames.map((name, idx) => ({
    name,
    url: urls[idx] ?? "",
  }));

  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = `${source.name}-${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return source.name;
  });
}

export function buildCmsPackageV01(article: any) {
  const markdown =
    article?.markdown ??
    article?.body_markdown ??
    article?.cms_body ??
    article?.body ??
    "";

  const publicBody = stripPublicBody(markdown);

  const title = article?.title ?? "";
  const graphPlaceholders = extractGraphPlaceholders(markdown);
  const graphAssets = extractGraphAssets(article);

  const graphMappings = graphAssets.map((asset: any) => ({
    placeholder: asset.placeholder,
    graph_id: asset.graph_id,
    public_path: asset.public_path,
    chart_type: asset.chart_type,
    purpose: asset.purpose,
  }));

  const graphRefs =
    Array.isArray(article?.graph_refs)
      ? article.graph_refs
      : graphAssets.length
        ? graphAssets.map((g: any) => g.graph_id ?? g.public_path).filter(Boolean)
        : graphPlaceholders;

  return {
    package_version: "cms-import-package-v0.5",
    generated_at: new Date().toISOString(),

    candidate_id: extractCandidateId(article),

    title,
    suggested_slug: article?.slug ?? slugify(title),
    excerpt: article?.excerpt ?? makeExcerpt(publicBody),

    country:
      article?.country ??
      article?.candidate?.country ??
      "Singapore",

    category:
      article?.category ??
      article?.candidate?.category ??
      "Manufacturing Intelligence",

    markdown,
    body_markdown_public: publicBody,

    transparency_bubbles: extractTransparencyBubbles(article, markdown),

    graph_refs: graphRefs,
    graph_placeholders: graphPlaceholders,
    graph_assets: graphAssets,
    graph_mappings: graphMappings,

    sources_simple: extractSimpleSources(markdown),

    cover_image: null,

    cms_target: {
      slug_owner: "cms",
      category_owner: "cms",
      import_mode: "manual_review",
      mutation_allowed: false,
    },

    validation_expectations: {
      requires_human_review: true,
      requires_cover_image: true,
      requires_graph_asset_review: true,
      allows_missing_candidate_id: false,
    },

    status: "manual_transfer_only",
  };
}
