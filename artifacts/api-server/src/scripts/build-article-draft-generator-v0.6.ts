import fs from "fs";
import path from "path";

function safeArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function pct(value: any): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "not specified";
  return `${(value * 100).toFixed(1)}%`;
}

function sentenceList(items: string[], fallback: string): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return fallback;
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

const inPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "article-brief-package-v0.3.json"
);

if (!fs.existsSync(inPath)) {
  throw new Error(`Missing input file: ${inPath}`);
}

const brief = JSON.parse(fs.readFileSync(inPath, "utf8"));

const snapshotPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "smurf-intelligence-snapshot-v0.1.json"
);

const snapshot = fs.existsSync(snapshotPath)
  ? JSON.parse(fs.readFileSync(snapshotPath, "utf8")).intelligence_snapshot
  : null;

const a = brief.article_identity ?? {};
const e = brief.editorial_brief ?? {};
const smurf = brief.smurf_evidence ?? {};
const driver = smurf.source_driver ?? {};
const signal = smurf.signal ?? {};
const sourceCases = safeArray(smurf.source_cases);
const evidencePatterns = safeArray(smurf.evidence_patterns);
const affectedSectors = safeArray(smurf.affected_sectors);
const evidenceRows = safeArray(brief.evidence_table?.rows);

const title = a.title ?? "Singapore Intelligence Article";
const driverName =
  driver.driver_name ?? snapshot?.primary_driver ?? "the selected SMURF driver";
const driverId = driver.driver_id ?? snapshot?.driver_id ?? "not specified";
const confidence =
  signal.confidence ?? snapshot?.confidence_score ?? null;
const historicalCases =
  signal.case_count ?? snapshot?.historical_cases ?? sourceCases.length;

const patternText = sentenceList(
  evidencePatterns.map((p: any) =>
    typeof p === "string" ? p : p.phrase ?? p.pattern ?? ""
  ),
  "the available evidence patterns"
);

const sectorText = sentenceList(
  affectedSectors.map((s: any) => String(s)),
  "the relevant Singapore sectors"
);

const keyTakeaways = safeArray(brief.key_takeaways)
  .map((t: string) => `- ${t}`)
  .join("\n");

const caseRows =
  sourceCases.length > 0
    ? sourceCases
        .slice(0, 8)
        .map(
          (c: any) =>
            `| ${c.case_id ?? "case"} | ${c.period ?? "period not specified"} | ${
              c.series_name ?? "series not specified"
            } | ${c.confidence ?? "not specified"} | ${
              c.driver_score ?? "not specified"
            } |`
        )
        .join("\n")
    : `| No source cases supplied | - | - | - | - |`;

const evidenceTable =
  evidenceRows.length > 0
    ? evidenceRows
        .map(
          (r: any) =>
            `| ${r.claim ?? "claim not specified"} | ${
              r.source ?? "source not specified"
            } | ${r.confidence ?? "not specified"} | ${r.use ?? ""} |`
        )
        .join("\n")
    : `| Evidence rows not supplied | - | - | - |`;

const snapshotMarkdown = snapshot
  ? `## SMURF Intelligence Snapshot

| Indicator | Reading |
|---|---|
| Primary driver | ${snapshot.primary_driver} |
| Driver ID | ${snapshot.driver_id} |
| Confidence score | ${pct(snapshot.confidence_score)} |
| Historical cases | ${snapshot.historical_cases} |
| Recurrence score | ${pct(snapshot.recurrence_score)} |
| Experience strength | ${pct(snapshot.experience_strength)} |
| Pattern stability | ${snapshot.pattern_stability} |
| Confidence tier | ${snapshot.confidence_tier} |
`
  : `## SMURF Intelligence Snapshot

A structured SMURF snapshot was not available for this draft. The article therefore relies on the article brief package and its embedded evidence context.
`;

const article = `# ${title}

${e.opening_surprise ?? e.angle ?? ""}

## Executive Summary

${e.why_it_matters ?? "This article explains a Singapore economic signal identified by SMURF and translates it into business-relevant interpretation."}

SMURF flagged this topic because it connects an observed Singapore pattern to ${driverName}. The current confidence reading is ${confidence !== null ? pct(confidence) : "not specified"}, based on ${historicalCases} historical case${historicalCases === 1 ? "" : "s"} and recurring evidence patterns including ${patternText}.

The article should be read as an interpretation brief, not as a final statistical release. Precise figures and chart-ready claims remain subject to verified metric approval.

## Key Takeaways

${keyTakeaways}

${snapshotMarkdown}

## What the Data Shows

The selected opportunity points to a Singapore pattern linked to ${sectorText}. The available SMURF brief indicates that the signal is not only a single observation, but part of a broader evidence trail.

At this stage, the article can explain the mechanism and business relevance. Exact percentages, rankings, and chart values should remain blocked unless they are present in the verified metrics registry.

## Why SMURF Flagged This

SMURF associated the opportunity with:

| Field | Reading |
|---|---|
| Driver | ${driverName} |
| Driver ID | ${driverId} |
| Confidence | ${confidence !== null ? pct(confidence) : "not specified"} |
| Historical cases | ${historicalCases} |
| Evidence patterns | ${patternText} |

This matters because SMURF does not treat the article as a standalone writing prompt. It treats it as the publication layer of an intelligence chain: opportunity, evidence, historical comparison, driver attribution, confidence assessment, and interpretation.

## Historical Pattern Review

SMURF identified the following source cases behind this article brief:

| Case ID | Period | Series | Confidence | Driver score |
|---|---|---|---|---|
${caseRows}

These cases do not prove causality by themselves. They provide historical context for judging whether the current signal resembles earlier patterns observed in Singapore's economic data.

## Driver Interpretation

The primary driver is ${driverName}.

In practical terms, this means the article should focus less on a generic description of Singapore's economic position and more on the mechanism connecting the observed data to business conditions.

For this opportunity, the important question is:

> ${e.core_question ?? `What does this signal reveal about ${driverName}?`}

The driver interpretation should therefore explain how the signal may affect demand, operating conditions, sector exposure, planning assumptions, or investment relevance.

## Evidence Patterns

The most relevant evidence patterns are:

${evidencePatterns.length > 0 ? evidencePatterns.map((p: any) => `- ${typeof p === "string" ? p : p.phrase ?? p.pattern ?? JSON.stringify(p)}`).join("\n") : "- No evidence patterns supplied."}

These patterns are useful because they indicate what SMURF repeatedly observed across cases. They also provide a watchlist for future updates.

## Evidence Confidence Snapshot

| Claim | Source | Confidence | Use |
|---|---|---|---|
${evidenceTable}

## Business Implications

${e.article_goal ?? brief.excerpt ?? "The business implication is that recurring Singapore economic signals can help decision-makers monitor changing sector exposure and macro sensitivity."}

For business readers, the value is not simply knowing that a sector moved. The value is understanding what the movement may reveal about demand, trade exposure, supply-chain conditions, investment timing, and regional operating risk.

This is where the SMURF interpretation layer matters. It converts data observations into structured, confidence-aware interpretation.

## What to Watch Next

The next useful indicators are:

${safeArray(brief.next_data_needed).map((item: string) => `- ${item}`).join("\n")}

Until those inputs are verified, this article should remain careful with precise claims and should avoid unsupported rankings, percentages, or causal statements.

## Conclusion

${title} is best understood as an intelligence interpretation rather than a generic article topic.

SMURF has identified a recurring pattern, linked it to ${driverName}, reviewed historical cases, and surfaced evidence patterns that may matter for business interpretation.

The publication layer can now explain the signal, while preserving the governance principle that exact figures, charts, and strong claims require verified data.
`;

const output = {
  package_version: "article-draft-generator-v0.6",
  generated_at: new Date().toISOString(),
  input_package: brief.package_version,
  article_identity: a,
  smurf_evidence: smurf,
  generator_decision: brief.generator_decision,
  article_markdown: article,
  metadata: {
    excerpt: brief.excerpt,
    country: a.country,
    category: a.category,
    status: a.status,
    source_opportunity_id: a.source_opportunity_id,
    primary_driver: driverName,
    driver_id: driverId,
    confidence_score: confidence,
    historical_cases: historicalCases,
    allow_exact_figures: brief.generator_decision?.allow_exact_figures,
    allow_quantitative_graphs: brief.generator_decision?.allow_quantitative_graphs,
  },
};

const outDir = path.join(process.cwd(), "exports", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(outDir, "article-draft-generator-v0.6.json");
const mdPath = path.join(outDir, `${a.slug ?? "smurf-article"}-draft-v0.6.md`);

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
fs.writeFileSync(mdPath, article);

console.log({
  package_version: output.package_version,
  title,
  input_package: output.input_package,
  primary_driver: driverName,
  confidence_score: confidence,
  historical_cases: historicalCases,
  markdown_output: mdPath,
  json_output: jsonPath,
});
