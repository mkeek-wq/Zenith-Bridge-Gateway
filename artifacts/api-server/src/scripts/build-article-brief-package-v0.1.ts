import fs from "fs";
import path from "path";

const inPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "article-insight-package-v0.1.json"
);

if (!fs.existsSync(inPath)) {
  throw new Error(`Missing input file: ${inPath}`);
}

const insightPackage = JSON.parse(fs.readFileSync(inPath, "utf8"));

const primaryTitle =
  insightPackage.headline_candidates?.[0]?.title ??
  insightPackage.article_candidate?.title ??
  "Untitled Singapore Insight";

const output = {
  package_version: "article-brief-package-v0.1",
  generated_at: new Date().toISOString(),
  input_package: insightPackage.package_version,

  article_identity: {
    title: primaryTitle,
    slug: "why-singapore-became-one-of-the-worlds-most-important-energy-trading-hubs",
    country: "Singapore",
    category: "Energy | Trade & Logistics | Economic Development",
    article_type: "flagship",
    status: insightPackage.insight_summary.article_status,
  },

  editorial_brief: {
    core_question:
      "How did Singapore become a major energy trading hub despite having virtually no domestic oil reserves?",
    opening_surprise:
      insightPackage.surprise_candidates?.[0]?.surprise ??
      "Singapore has virtually no domestic oil reserves, yet developed a major energy role.",
    target_reader:
      "Business leaders, investors, consultants, policymakers, and professionals trying to understand Singapore's economic position in Asia.",
    tone:
      "Calm, factual, executive-friendly, mechanism-driven, non-promotional.",
    article_goal:
      "Explain Singapore's energy position through strategic location, infrastructure development, ecosystem clustering, and regional demand context.",
  },

  excerpt:
    "Singapore has virtually no domestic oil reserves, yet it has developed into a major energy trading, refining, storage, and maritime fuel hub. Its position reflects decades of infrastructure investment, industrial clustering, regulatory stability, and strategic location within Asian trade flows.",

  key_takeaways: insightPackage.key_takeaways,

  recommended_structure: [
    {
      section: "Introduction",
      purpose:
        "Introduce the surprise: Singapore has little domestic oil, yet plays an important energy role.",
    },
    {
      section: "A Strategic Location at the Center of Global Trade",
      purpose:
        "Explain the Strait of Malacca, Singapore's port role, and regional trade position.",
    },
    {
      section: "Building More Than a Port",
      purpose:
        "Explain refining, storage, Jurong Island, and infrastructure development.",
    },
    {
      section: "The Rise of an Energy Ecosystem",
      purpose:
        "Explain how shipping, bunkering, trading, petrochemicals, and services reinforce one another.",
    },
    {
      section: "Why Singapore Matters in Global Energy Markets",
      purpose:
        "Use macro context carefully while keeping Singapore as the anchor.",
    },
    {
      section: "Why This Matters for Businesses",
      purpose:
        "Translate the article into business implications for energy, logistics, manufacturing, trade, and investment.",
    },
  ],

  evidence_table: {
    include_in_article: true,
    title: "Evidence Confidence Snapshot",
    rows: [
      {
        claim: "Singapore is a significant maritime and bunkering hub.",
        source: "Maritime and Port Authority of Singapore",
        confidence: "High",
        use: "Article now; graph after verified figure.",
      },
      {
        claim: "Jurong Island anchors Singapore's energy and chemicals ecosystem.",
        source: "Singapore Economic Development Board",
        confidence: "High",
        use: "Article now; graph after verified figure.",
      },
      {
        claim:
          "Singapore's energy role is supported by shipping, storage, refining, trading, petrochemicals, and services.",
        source: "ZNBW / SMURF internal mechanism interpretation",
        confidence: "Moderate",
        use: "Ecosystem diagram.",
      },
      {
        claim:
          "Global and regional energy demand trends provide context for Singapore's hub role.",
        source: "International Energy Agency",
        confidence: "Moderate",
        use: "Context only.",
      },
    ],
  },

  visual_brief: insightPackage.visual_opportunities,

  generation_guardrails: insightPackage.article_generation_guardrails,

  next_data_needed: [
    "Verified Singapore bunkering volume or market position from MPA.",
    "Verified Jurong Island / energy and chemicals contribution from EDB or SingStat.",
    "Verified Singapore population and GDP share from World Bank / SingStat.",
    "Verified macro energy demand figure from IEA.",
  ],

  generator_decision: {
    generate_full_article_now: true,
    allow_exact_figures: false,
    allow_conceptual_visuals: true,
    allow_quantitative_graphs: false,
    reason:
      "Article can be generated as a narrative flagship draft, but precise graphs should wait for verified data.",
  },
};

const outDir = path.join(process.cwd(), "data", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-brief-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  article_type: output.article_identity.article_type,
  status: output.article_identity.status,
  generate_full_article_now: output.generator_decision.generate_full_article_now,
  allow_exact_figures: output.generator_decision.allow_exact_figures,
  allow_quantitative_graphs: output.generator_decision.allow_quantitative_graphs,
  output: outPath,
});
