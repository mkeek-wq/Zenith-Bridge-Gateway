import fs from "fs";
import path from "path";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const insightPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "article-insight-package-v0.2.json"
);

const seedPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "smurf-article-seed-from-opportunity-v0.1.json"
);

if (!fs.existsSync(insightPath)) {
  throw new Error(`Missing input file: ${insightPath}`);
}

if (!fs.existsSync(seedPath)) {
  throw new Error(`Missing seed file: ${seedPath}`);
}

const insightPackage = JSON.parse(fs.readFileSync(insightPath, "utf8"));
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const opportunity = seed.smurf_context?.original_opportunity ?? {};

const primaryTitle =
  seed.article_seed?.proposed_title ??
  opportunity.title ??
  insightPackage.headline_candidates?.[0]?.title ??
  "Singapore Intelligence Article";

const slug = slugify(primaryTitle);

const sourceCases = opportunity.source_cases ?? [];
const evidencePatterns = opportunity.evidence_patterns ?? [];
const editorialGuidance = opportunity.editorial_guidance ?? {};

const output = {
  package_version: "article-brief-package-v0.3",
  generated_at: new Date().toISOString(),
  input_package: insightPackage.package_version,
  input_seed: seed.seed_version,

  article_identity: {
    title: primaryTitle,
    slug,
    country: seed.article_seed?.country_anchor ?? "Singapore",
    category: "Energy | Manufacturing | Trade & Logistics",
    article_type: seed.article_seed?.article_type ?? "flagship",
    status: insightPackage.insight_summary.article_status,
    source_opportunity_id: opportunity.opportunity_id ?? seed.article_seed?.seed_id,
  },

  editorial_brief: {
    core_question:
      seed.article_seed?.core_question ??
      `What explains ${primaryTitle}?`,
    opening_surprise:
      opportunity.angle ??
      insightPackage.surprise_candidates?.[0]?.surprise ??
      primaryTitle,
    angle:
      opportunity.angle ??
      "Explain the mechanism behind the selected Singapore intelligence opportunity.",
    target_reader:
      "Business leaders, investors, consultants, policymakers, and professionals trying to understand Singapore's economic position in Asia.",
    tone:
      editorialGuidance.tone ??
      "Calm, factual, executive-friendly, mechanism-driven, non-promotional.",
    article_goal:
      opportunity.business_implication ??
      "Explain the business relevance of the selected Singapore intelligence opportunity using SMURF evidence and light macro context.",
    why_it_matters:
      opportunity.why_it_matters ??
      "This matters because recurring economic signals can help businesses understand changing demand, sector exposure, and operating conditions.",
  },

  excerpt:
    opportunity.business_implication ??
    "SMURF identified a recurring Singapore pattern that may help explain sector exposure, macro sensitivity, and business-relevant economic signals.",

  key_takeaways: [
    opportunity.business_implication ??
      "SMURF identified a recurring Singapore intelligence pattern with business relevance.",
    opportunity.why_it_matters ??
      "The pattern may help businesses understand changing sector and macro conditions.",
    `Primary driver: ${opportunity.source_driver?.driver_name ?? "Not specified"}.`,
    `Historical cases assessed: ${opportunity.signal?.case_count ?? sourceCases.length ?? 0}.`,
    "Precise figures and charts should remain blocked until verified metrics are added.",
  ],

  recommended_structure:
    editorialGuidance.suggested_sections?.map((section: string) => ({
      section,
      purpose: `Address: ${section}`,
    })) ?? [
      {
        section: "What happened?",
        purpose: "Describe the observed Singapore pattern.",
      },
      {
        section: "Why did it happen?",
        purpose: "Explain the underlying mechanism.",
      },
      {
        section: "What does the historical evidence show?",
        purpose: "Summarize recurring SMURF cases and evidence patterns.",
      },
      {
        section: "Why does it matter for businesses?",
        purpose: "Translate the pattern into business implications.",
      },
      {
        section: "What should operators watch next?",
        purpose: "Identify indicators to monitor.",
      },
    ],

  smurf_evidence: {
    source_driver: opportunity.source_driver ?? null,
    signal: opportunity.signal ?? null,
    source_cases: sourceCases,
    evidence_patterns: evidencePatterns,
    affected_sectors: opportunity.affected_sectors ?? [],
  },

  evidence_table: {
    include_in_article: true,
    title: "Evidence Confidence Snapshot",
    rows: sourceCases.slice(0, 8).map((c: any) => ({
      claim: `${c.series_name} pattern observed in ${c.period}`,
      source: c.case_id,
      confidence: c.confidence,
      use: `Driver score ${c.driver_score}; evidence count ${c.evidence_count}`,
    })),
  },

  visual_brief: [
    {
      visual_id: "VIS_001",
      title: editorialGuidance.required_graphs?.[0] ?? "Singapore sector trend",
      visual_type: "line_chart",
      evidence_type: "quantitative",
      graph_ready: false,
      confidence: "developing",
      message:
        "Show the relevant Singapore sector or output trend once verified metrics are available.",
      publish_guidance:
        "Blocked until verified metric values are added to the verified metrics registry.",
    },
    {
      visual_id: "VIS_002",
      title:
        editorialGuidance.required_graphs?.[1] ??
        "SMURF evidence signal timeline",
      visual_type: "timeline",
      evidence_type: "mixed",
      graph_ready: true,
      confidence: "moderate",
      message:
        "Show recurring SMURF cases, evidence patterns, and driver signals across periods.",
      publish_guidance:
        "Can be used as a SMURF evidence timeline; quantitative values require metric validation.",
    },
  ],

  generation_guardrails: [
    "Do not use exact percentages unless the value is verified.",
    "Do not claim a global ranking unless the source explicitly supports it.",
    "Keep Singapore as the article anchor.",
    "Use macro data only as supporting context.",
    "Separate article-ready claims from graph-ready figures.",
    "Public article should reflect the selected SMURF opportunity title and angle.",
  ],

  next_data_needed: [
    ...(editorialGuidance.required_graphs ?? []),
    "Verified Singapore sector/output trend from SingStat or official source.",
    "Verified macro context from relevant official or multilateral source.",
  ],

  generator_decision: {
    generate_full_article_now: true,
    allow_exact_figures: false,
    allow_conceptual_visuals: true,
    allow_quantitative_graphs: false,
    reason:
      "Article can be generated as a SMURF-assisted narrative draft, but precise figures and charts require verified metrics.",
  },
};

const outDir = path.join(process.cwd(), "data", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-brief-package-v0.3.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  slug: output.article_identity.slug,
  source_cases: output.smurf_evidence.source_cases.length,
  evidence_patterns: output.smurf_evidence.evidence_patterns.length,
  output: outPath,
});
