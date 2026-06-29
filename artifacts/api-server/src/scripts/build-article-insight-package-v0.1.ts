import fs from "fs";
import path from "path";

type EvidenceItem = {
  claim: string;
  country: string;
  domain: string;
  source_name: string;
  source_type: string;
  metric?: string;
  value?: string;
  period?: string;
  source_confidence: number;
  freshness_confidence: number;
  evidence_strength: number;
  mechanism_confidence: number;
  article_readiness: string;
  graph_ready: boolean;
  recommended_use: string;
  notes: string;
};

const inPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "article-evidence-package-v0.1.json"
);

if (!fs.existsSync(inPath)) {
  throw new Error(`Missing input file: ${inPath}`);
}

const evidencePackage = JSON.parse(fs.readFileSync(inPath, "utf8"));
const evidence: EvidenceItem[] = evidencePackage.evidence ?? [];

const highOrModerate = evidence.filter((e) =>
  ["high", "moderate"].includes(e.article_readiness)
);

const graphReady = evidence.filter((e) => e.graph_ready);
const pendingFigures = evidence.filter((e) =>
  String(e.value ?? "").toLowerCase().includes("pending")
);

const output = {
  package_version: "article-insight-package-v0.1",
  generated_at: new Date().toISOString(),
  input_package: evidencePackage.package_version,
  article_candidate: evidencePackage.article_candidate,
  scope: evidencePackage.scope,

  insight_summary: {
    usable_evidence_items: highOrModerate.length,
    graph_ready_items: graphReady.length,
    pending_verified_figures: pendingFigures.length,
    article_status:
      pendingFigures.length > 0
        ? "draft_ready_pending_quantification"
        : "ready_for_article_generation",
  },

  surprise_candidates: [
    {
      surprise:
        "Singapore has virtually no domestic oil reserves, yet developed into a significant energy trading and maritime fuel hub.",
      confidence: "moderate",
      evidence_basis: [
        "Singapore is a significant global maritime and bunkering hub.",
        "Jurong Island is a major refining, petrochemical, and energy infrastructure cluster.",
      ],
      use_in_article: "opening_hook",
    },
  ],

  mechanism_candidates: [
    {
      mechanism: "Ecosystem accumulation",
      explanation:
        "Singapore's role appears to come from the accumulation of port infrastructure, storage, refining, trading, petrochemicals, and services rather than from domestic resource ownership.",
      confidence: "moderate",
      use_in_article: "main_explanation",
    },
    {
      mechanism: "Strategic location plus institutional execution",
      explanation:
        "Singapore's geographic position matters, but the stronger article mechanism is how infrastructure, regulation, and industrial clustering converted location into a durable energy ecosystem.",
      confidence: "moderate",
      use_in_article: "strategic_context",
    },
  ],

  headline_candidates: [
    {
      title:
        "Why Singapore Became One of the World's Most Important Energy Trading Hubs",
      type: "flagship",
      confidence: "high",
    },
    {
      title:
        "How Singapore Built an Energy Hub Without Major Domestic Oil Reserves",
      type: "flagship",
      confidence: "moderate",
    },
    {
      title:
        "Singapore's Energy Ecosystem: How Infrastructure Became Strategic Advantage",
      type: "reference",
      confidence: "moderate",
    },
  ],

  key_takeaways: [
    "Singapore's energy role is built on infrastructure, trading, logistics, and industrial clustering rather than domestic oil reserves.",
    "Jurong Island and related infrastructure help anchor Singapore's refining, petrochemical, and storage ecosystem.",
    "Shipping, bunkering, storage, trading, and financial services reinforce one another.",
    "Macro energy demand trends provide context, but Singapore remains the article anchor.",
    "The article should avoid precise global share claims until verified figures are added.",
  ],

  visual_opportunities: [
    {
      visual_id: "VIS_001",
      title: "Singapore's Energy Ecosystem",
      visual_type: "ecosystem_diagram",
      evidence_type: "qualitative",
      graph_ready: true,
      confidence: "moderate",
      message:
        "Singapore's energy role is created by the interaction between shipping, storage, refining, trading, petrochemicals, and services.",
      publish_guidance: "Can be used now as a non-numerical intelligence visual.",
    },
    {
      visual_id: "VIS_002",
      title: "Singapore's Size vs Energy Influence",
      visual_type: "comparison_chart",
      evidence_type: "quantitative",
      graph_ready: false,
      confidence: "developing",
      message:
        "Singapore's energy influence appears disproportionate to its population and land area.",
      publish_guidance:
        "Do not publish until MPA, World Bank, and SingStat figures are verified.",
    },
    {
      visual_id: "VIS_003",
      title: "How Singapore Built Its Energy Hub",
      visual_type: "timeline",
      evidence_type: "mixed",
      graph_ready: true,
      confidence: "moderate",
      message:
        "Singapore's energy position developed over decades through port, refining, storage, Jurong Island, and trading infrastructure.",
      publish_guidance:
        "Can be used as a conceptual timeline if labelled as development pathway, not measured data.",
    },
  ],

  article_generation_guardrails: [
    "Do not use exact percentages unless the value is verified.",
    "Do not claim a global ranking unless the source explicitly supports it.",
    "Keep Singapore as the article anchor.",
    "Use macro data only as supporting context.",
    "Separate article-ready claims from graph-ready figures.",
  ],
};

const outDir = path.join(process.cwd(), "data", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-insight-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  usable_evidence_items: output.insight_summary.usable_evidence_items,
  graph_ready_items: output.insight_summary.graph_ready_items,
  pending_verified_figures: output.insight_summary.pending_verified_figures,
  article_status: output.insight_summary.article_status,
  output: outPath,
});
