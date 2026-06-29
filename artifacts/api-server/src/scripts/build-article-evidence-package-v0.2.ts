import fs from "fs";
import path from "path";

type ConfidenceLabel = "high" | "moderate" | "developing" | "low";

type EvidenceItem = {
  request_id: string;
  claim: string;
  country: string;
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

function sourceType(source: string): EvidenceItem["source_type"] {
  const s = source.toLowerCase();
  if (
    s.includes("maritime and port authority") ||
    s.includes("economic development board") ||
    s.includes("singstat") ||
    s.includes("world bank")
  ) {
    return s.includes("world bank") ? "multilateral" : "official";
  }
  if (s.includes("international energy agency")) return "multilateral";
  if (s.includes("smurf") || s.includes("znbw")) return "internal_smurf";
  return "other";
}

function confidenceFromSource(source: string) {
  const t = sourceType(source);
  if (t === "official") return 0.95;
  if (t === "multilateral") return 0.9;
  if (t === "internal_smurf") return 0.65;
  return 0.5;
}

function domainFromClaim(claim: string): string {
  const c = claim.toLowerCase();
  if (c.includes("bunkering") || c.includes("maritime")) return "energy_trade";
  if (c.includes("jurong") || c.includes("chemicals")) return "industrial_ecosystem";
  if (c.includes("demand") || c.includes("macro")) return "macro_context";
  if (c.includes("disproportionate") || c.includes("size")) return "strategic_positioning";
  return "article_context";
}

function metricFromClaim(claim: string): string {
  const c = claim.toLowerCase();
  if (c.includes("bunkering")) return "Bunkering / maritime fuel activity";
  if (c.includes("jurong")) return "Energy and chemicals cluster";
  if (c.includes("disproportionate")) return "Relative global role vs population / GDP";
  if (c.includes("demand")) return "Energy demand outlook";
  return "Evidence claim";
}

function recommendedUse(claim: string): EvidenceItem["recommended_use"] {
  const c = claim.toLowerCase();
  if (c.includes("disproportionate")) return "context_only";
  if (c.includes("demand")) return "context_only";
  return "article_only";
}

function graphReady(claim: string): boolean {
  const c = claim.toLowerCase();
  return c.includes("ecosystem") || c.includes("relationship");
}

function buildEvidenceItem(req: any, country: string): EvidenceItem {
  const source = req.preferred_source ?? "Unknown source";
  const claim = req.claim_target ?? "Unknown claim";
  const sourceConfidence = confidenceFromSource(source);

  const itemWithoutReadiness = {
    request_id: req.request_id,
    claim,
    country,
    domain: domainFromClaim(claim),
    source_name: source,
    source_type: sourceType(source),
    metric: metricFromClaim(claim),
    value: "pending verified figure",
    period: "latest available",
    source_confidence: sourceConfidence,
    freshness_confidence: req.priority === "high" ? 0.72 : 0.65,
    evidence_strength: req.priority === "high" ? 0.78 : 0.65,
    mechanism_confidence: claim.toLowerCase().includes("jurong") ? 0.85 : 0.72,
    graph_ready: graphReady(claim),
    recommended_use: recommendedUse(claim),
    notes:
      req.priority === "high"
        ? "High-priority evidence request from SMURF article seed. Requires verified figure before quantitative graphing."
        : "Supporting context request from SMURF article seed.",
  };

  const score = average([
    itemWithoutReadiness.source_confidence,
    itemWithoutReadiness.freshness_confidence,
    itemWithoutReadiness.evidence_strength,
    itemWithoutReadiness.mechanism_confidence,
  ]);

  return {
    ...itemWithoutReadiness,
    article_readiness: label(score),
  };
}

const opportunitySeedPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "smurf-article-seed-from-opportunity-v0.1.json"
);

const manualSeedPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "smurf-article-seed-v0.1.json"
);

const seedPath = fs.existsSync(opportunitySeedPath)
  ? opportunitySeedPath
  : manualSeedPath;

if (!fs.existsSync(seedPath)) {
  throw new Error(`Missing SMURF article seed: ${seedPath}`);
}

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const evidence: EvidenceItem[] = seed.evidence_requests.map((req: any) =>
  buildEvidenceItem(req, seed.article_seed.country_anchor)
);

const output = {
  package_version: "article-evidence-package-v0.2",
  generated_at: new Date().toISOString(),
  input_seed: seed.seed_version,
  seed_id: seed.article_seed.seed_id,
  scope: {
    country_anchor: seed.article_seed.country_anchor,
    macro_role: seed.article_seed.macro_role,
    smurf_integration: "seed_adapter_v0.1",
  },
  article_candidate: {
    title: seed.article_seed.proposed_title,
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

const outPath = path.join(outDir, "article-evidence-package-v0.2.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  input_seed: output.input_seed,
  seed_id: output.seed_id,
  evidence_items: evidence.length,
  high: output.evidence_summary.high,
  moderate: output.evidence_summary.moderate,
  graph_ready: output.evidence_summary.graph_ready,
  output: outPath,
});
