import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) ||
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.1.json")) ||
  {};

const lifecycle =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-lifecycle-registry-v0.1.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];

const lifecycleItems: any[] =
  lifecycle.lifecycle_items ||
  lifecycle.lifecycle_objects ||
  lifecycle.mechanisms ||
  lifecycle.items ||
  [];

type Rule = {
  mechanism_id: string;
  mechanism_name: string;
  terms: string[];
  explanation: string;
};

const rules: Rule[] = [
  {
    mechanism_id: "MKT_002",
    mechanism_name: "Inventory Cycle / Restocking",
    terms: [
      "inventory",
      "restocking",
      "manufacturing",
      "manufacturing_output",
      "industrial production",
      "production",
      "output",
      "electronics",
      "semiconductor",
    ],
    explanation:
      "Evidence relates to production, manufacturing output, electronics, semiconductors, or inventory-sensitive activity.",
  },
  {
    mechanism_id: "MKT_006",
    mechanism_name: "Policy / Regulatory Impact",
    terms: [
      "policy",
      "regulatory",
      "government",
      "incentive",
      "subsidy",
      "tax",
      "investment",
      "direct_investment",
      "interest",
      "rate",
      "cpi",
      "inflation",
      "gdp",
    ],
    explanation:
      "Evidence relates to policy transmission, investment, inflation, rates, government action, or macro-policy channels.",
  },
  {
    mechanism_id: "MKT_010",
    mechanism_name: "Demand Shock / External Downturn",
    terms: [
      "demand",
      "exports",
      "export",
      "nodx",
      "trade",
      "orders",
      "pmi",
      "external",
      "downturn",
      "services trade",
      "electronics",
      "semiconductor",
    ],
    explanation:
      "Evidence relates to external demand, exports, trade, orders, PMI, electronics, or export-sensitive activity.",
  },
];

function getMechanismId(x: any): string {
  return String(x.driver_id || x.mechanism_id || x.id || "UNKNOWN");
}

function getMechanismName(x: any): string {
  return String(x.driver_name || x.mechanism_name || x.name || "Unknown Mechanism");
}

function calculateLinkStrength(evidence: any, rule: Rule): number {
  const text = `${evidence.metric_name || ""} ${evidence.evidence_window || ""}`.toLowerCase();

  const hits = rule.terms.filter((term) => text.includes(term.toLowerCase())).length;
  if (hits === 0) return 0;

  const evidenceScore = Number(evidence.scores?.evidence_score ?? 0.4);
  const termStrength = clamp(hits / 4);

  return clamp(evidenceScore * 0.7 + termStrength * 0.3);
}

const links: any[] = [];

for (const mechanism of lifecycleItems) {
  const mechanismId = getMechanismId(mechanism);
  const rule = rules.find((r) => r.mechanism_id === mechanismId);

  if (!rule) continue;

  for (const evidence of assessedEvidence) {
    const linkStrength = calculateLinkStrength(evidence, rule);

    if (linkStrength <= 0) continue;

    links.push({
      link_id: `MEL_${String(links.length + 1).padStart(5, "0")}`,
      mechanism_id: mechanismId,
      mechanism_name: getMechanismName(mechanism),
      lifecycle_status: mechanism.lifecycle_status || "unknown",
      validated_mechanism: mechanism.validated_mechanism === true,
      evidence_id: evidence.evidence_id,
      metric_name: evidence.metric_name,
      period: evidence.period,
      evidence_score: evidence.scores?.evidence_score,
      evidence_status: evidence.assessment?.status,
      evidence_direction: evidence.direction || "unknown",
      link_strength: Number(linkStrength.toFixed(3)),
      link_band:
        linkStrength >= 0.75
          ? "strong_link"
          : linkStrength >= 0.55
            ? "useful_link"
            : "weak_link",
      link_reason: rule.explanation,
      governance: {
        link_is_supportive_not_conclusive: true,
        evidence_remains_primary: true,
        mechanism_may_not_override_evidence: true,
        candidate_mechanisms_are_not_validated_truths: true,
      },
    });
  }
}

const mechanismSummaries = lifecycleItems.map((mechanism) => {
  const mechanismId = getMechanismId(mechanism);
  const mechanismLinks = links.filter((l) => l.mechanism_id === mechanismId);

  const avgLinkStrength =
    mechanismLinks.length > 0
      ? mechanismLinks.reduce((sum, l) => sum + Number(l.link_strength), 0) / mechanismLinks.length
      : 0;

  const strongLinks = mechanismLinks.filter((l) => l.link_band === "strong_link").length;
  const usefulLinks = mechanismLinks.filter((l) => l.link_band === "useful_link").length;

  return {
    mechanism_id: mechanismId,
    mechanism_name: getMechanismName(mechanism),
    lifecycle_status: mechanism.lifecycle_status || "unknown",
    validated_mechanism: mechanism.validated_mechanism === true,
    linked_evidence_items: mechanismLinks.length,
    strong_links: strongLinks,
    useful_links: usefulLinks,
    weak_links: mechanismLinks.filter((l) => l.link_band === "weak_link").length,
    average_link_strength: Number(avgLinkStrength.toFixed(3)),
    top_linked_evidence: mechanismLinks
      .slice()
      .sort((a, b) => b.link_strength - a.link_strength)
      .slice(0, 8)
      .map((l) => ({
        evidence_id: l.evidence_id,
        metric_name: l.metric_name,
        period: l.period,
        evidence_score: l.evidence_score,
        link_strength: l.link_strength,
        link_band: l.link_band,
      })),
  };
});

const output = {
  registry_version: "mechanism-evidence-linker-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    evidence_remains_primary: true,
    mechanism_links_are_supportive_not_conclusive: true,
    historical_similarity_must_never_override_evidence: true,
    past_results_do_not_guarantee_future_outcomes: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    lifecycle_items: lifecycleItems.length,
  },
  summary: {
    mechanism_count: mechanismSummaries.length,
    total_links: links.length,
    strong_links: links.filter((l) => l.link_band === "strong_link").length,
    useful_links: links.filter((l) => l.link_band === "useful_link").length,
    weak_links: links.filter((l) => l.link_band === "weak_link").length,
  },
  mechanism_summaries: mechanismSummaries,
  links,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-evidence-linker-v0.1.json",
});

console.table(
  mechanismSummaries.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism: m.mechanism_name,
    linked: m.linked_evidence_items,
    strong: m.strong_links,
    useful: m.useful_links,
    avg_link: m.average_link_strength,
  }))
);
