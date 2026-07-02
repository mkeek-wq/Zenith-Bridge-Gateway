import fs from "fs";
import path from "path";

type ConfidenceLabel = "high" | "moderate" | "developing" | "low";

type EvidenceItem = {
  claim: string;
  country: "Singapore";
  domain: string;
  source_name: string;
  source_type: "official" | "multilateral" | "internal_smurf" | "other";
  metric?: string;
  value?: string;
  period?: string;
  source_confidence: number;
  freshness_confidence: number;
  evidence_strength: number;
  mechanism_confidence: number;
  article_readiness: ConfidenceLabel;
  graph_ready: boolean;
  recommended_use: "article_and_graph" | "article_only" | "context_only" | "do_not_publish";
  notes: string;
};

function label(score: number): ConfidenceLabel {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "moderate";
  if (score >= 0.4) return "developing";
  return "low";
}

function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function enrich(item: Omit<EvidenceItem, "article_readiness">): EvidenceItem {
  const score = average([
    item.source_confidence,
    item.freshness_confidence,
    item.evidence_strength,
    item.mechanism_confidence,
  ]);

  return {
    ...item,
    article_readiness: label(score),
  };
}

const evidence: EvidenceItem[] = [
  enrich({
    claim: "Singapore is a significant global maritime and bunkering hub.",
    country: "Singapore",
    domain: "energy_trade",
    source_name: "Maritime and Port Authority of Singapore",
    source_type: "official",
    metric: "Bunkering / maritime fuel activity",
    value: "pending verified figure",
    period: "latest available",
    source_confidence: 0.95,
    freshness_confidence: 0.75,
    evidence_strength: 0.85,
    mechanism_confidence: 0.8,
    graph_ready: false,
    recommended_use: "article_only",
    notes: "Use for narrative now; upgrade to article_and_graph after MPA figure is validated.",
  }),
  enrich({
    claim: "Jurong Island is a major refining, petrochemical, and energy infrastructure cluster.",
    country: "Singapore",
    domain: "industrial_ecosystem",
    source_name: "Singapore Economic Development Board",
    source_type: "official",
    metric: "Energy and chemicals cluster",
    value: "pending verified figure",
    period: "latest available",
    source_confidence: 0.95,
    freshness_confidence: 0.7,
    evidence_strength: 0.8,
    mechanism_confidence: 0.9,
    graph_ready: false,
    recommended_use: "article_only",
    notes: "Strong mechanism evidence; needs quantified EDB/SingStat figures before graphing.",
  }),
  enrich({
    claim: "Singapore's energy role is supported by shipping, storage, refining, trading, petrochemicals, and financial services.",
    country: "Singapore",
    domain: "ecosystem_mechanism",
    source_name: "ZNBW / SMURF internal mechanism interpretation",
    source_type: "internal_smurf",
    metric: "Ecosystem relationship",
    value: "qualitative",
    period: "current",
    source_confidence: 0.65,
    freshness_confidence: 0.65,
    evidence_strength: 0.7,
    mechanism_confidence: 0.85,
    graph_ready: true,
    recommended_use: "context_only",
    notes: "Suitable for ecosystem diagram, not numerical chart.",
  }),
  enrich({
    claim: "Global and regional energy demand trends provide context for Singapore's hub role.",
    country: "Singapore",
    domain: "macro_context",
    source_name: "International Energy Agency",
    source_type: "multilateral",
    metric: "Energy demand outlook",
    value: "pending verified figure",
    period: "latest available",
    source_confidence: 0.9,
    freshness_confidence: 0.7,
    evidence_strength: 0.65,
    mechanism_confidence: 0.7,
    graph_ready: false,
    recommended_use: "context_only",
    notes: "Use as macro support only; Singapore remains article anchor.",
  }),
];

const output = {
  package_version: "article-evidence-package-v0.1",
  generated_at: new Date().toISOString(),
  scope: {
    country_anchor: "Singapore",
    macro_role: "supporting_context_only",
    smurf_integration: "lightweight_manual_seed",
  },
  article_candidate: {
    title: "Why Singapore Became One of the World's Most Important Energy Trading Hubs",
    status: "draft_ready_pending_verified_figures",
  },
  evidence_summary: {
    total_items: evidence.length,
    high: evidence.filter((e) => e.article_readiness === "high").length,
    moderate: evidence.filter((e) => e.article_readiness === "moderate").length,
    developing: evidence.filter((e) => e.article_readiness === "developing").length,
    low: evidence.filter((e) => e.article_readiness === "low").length,
    graph_ready: evidence.filter((e) => e.graph_ready).length,
  },
  evidence,
};

const outDir = path.join(process.cwd(), "data", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-evidence-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  evidence_items: evidence.length,
  high: output.evidence_summary.high,
  moderate: output.evidence_summary.moderate,
  developing: output.evidence_summary.developing,
  low: output.evidence_summary.low,
  graph_ready: output.evidence_summary.graph_ready,
  output: outPath,
});
