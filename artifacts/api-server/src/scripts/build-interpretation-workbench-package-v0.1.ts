import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pct(value: any) {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "not specified";
}

const root = process.cwd();

const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const visual = readJson(path.join(root, "exports/article-generator/concept-visual-package-v0.2.json"));
const cms = readJson(path.join(root, "exports/article-generator/cms-export-package-v0.1.json"));

const identity = publication.publication_identity;
const snapshot = publication.smurf_snapshot ?? {};
const evidence = publication.smurf_evidence ?? {};
const signal = evidence.signal ?? {};
const cases = evidence.source_cases ?? [];
const patterns = evidence.evidence_patterns ?? [];
const missingData = publication.missing_data ?? [];

const output = {
  package_version: "interpretation-workbench-package-v0.1",
  generated_at: new Date().toISOString(),

  article_identity: identity,

  interpretation_context: {
    working_title: identity.title,
    current_status: publication.publication_status?.publication_recommendation,
    primary_driver: snapshot.primary_driver ?? evidence.source_driver?.driver_name,
    driver_id: snapshot.driver_id ?? evidence.source_driver?.driver_id,
    confidence_score: snapshot.confidence_score ?? signal.confidence_score,
    confidence_display: pct(snapshot.confidence_score ?? signal.confidence_score),
    confidence_tier: snapshot.confidence_tier ?? signal.confidence_tier,
    historical_cases: snapshot.historical_cases ?? cases.length,
    recurrence_score: snapshot.recurrence_score ?? signal.recurrence_score,
    experience_strength: snapshot.experience_strength ?? signal.experience_strength,
    pattern_stability: snapshot.pattern_stability ?? signal.stability_assessment,
    affected_sectors: evidence.affected_sectors ?? [],
  },

  what_smurf_thinks_it_sees: {
    short_interpretation:
      "Singapore petroleum-related manufacturing movements appear to reflect exposure to global energy demand, refining-cycle conditions, travel recovery, and logistics activity.",
    evidence_patterns: patterns,
    historical_case_summary: cases.map((c: any) => ({
      case_id: c.case_id,
      period: c.period,
      series_name: c.series_name,
      confidence: c.confidence,
      driver_score: c.driver_score,
      evidence_count: c.evidence_count,
    })),
  },

  claims_we_can_make_now: [
    "SMURF identified a recurring historical pattern linked to Singapore petroleum and refining activity.",
    "The primary attributed driver is Energy Demand / Refining Cycle.",
    "The current interpretation is supported by historical cases and recurring evidence patterns.",
    "Exact numerical claims remain blocked until verified metrics are approved.",
  ],

  claims_we_cannot_make_yet: [
    "We cannot claim exact output growth or decline without verified metric values.",
    "We cannot claim causality between global energy demand and Singapore petroleum output.",
    "We cannot publish quantitative charts until required metrics are verified.",
    "We cannot claim Singapore's global rank or relative influence without source-backed comparative data.",
  ],

  interpretation_questions_for_human_review: [
    "Is the article really about petroleum output, or about Singapore's broader energy-cycle exposure?",
    "Which audience is primary: investors, operators, policy readers, or supply-chain decision-makers?",
    "Should the article focus on petroleum output as a signal, or on the mechanism behind the signal?",
    "Which graph is essential for publication: petroleum output trend, ecosystem diagram, or energy-cycle timeline?",
    "What is the minimum verified data needed to make this article publishable?",
  ],

  article_building_blocks: {
    likely_thesis:
      "Singapore's petroleum-related manufacturing activity can be read as a signal of the country's exposure to global energy demand, travel recovery, refining margins, and logistics conditions.",
    supporting_arguments: [
      "The pattern is recurring across multiple historical cases.",
      "The attributed driver is energy demand and refining-cycle exposure.",
      "Evidence patterns repeatedly mention fuel demand, jet fuel demand, refinery maintenance, refining margins, and crude oil.",
      "The signal matters for logistics, trade, industrial demand, and business planning.",
    ],
    risk_language: [
      "suggests",
      "appears linked to",
      "may indicate",
      "can be interpreted as",
      "does not prove causality",
      "pending verified metrics",
    ],
  },

  visual_context: {
    visuals: visual.visuals ?? [],
    visual_summary: visual.visual_summary ?? {},
  },

  cms_context: {
    cms_status: cms.cms_entry?.status,
    seo_title: cms.seo?.seo_title,
    seo_description: cms.seo?.seo_description,
  },

  missing_data: missingData,

  recommended_next_action:
    "Use this package as the human-AI interpretation workspace before producing a publication-quality article and graph data request list.",
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "interpretation-workbench-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: identity.title,
  confidence: output.interpretation_context.confidence_display,
  historical_cases: output.interpretation_context.historical_cases,
  questions: output.interpretation_questions_for_human_review.length,
  output: outPath,
});
