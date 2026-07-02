import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing input file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pct(value: any) {
  if (typeof value !== "number") return "not specified";
  return `${(value * 100).toFixed(1)}%`;
}

const root = process.cwd();

const thesis = readJson(
  path.join(
    root,
    "exports/article-generator/article-thesis-package-v0.1.json"
  )
);

const workbench = readJson(
  path.join(
    root,
    "exports/article-generator/interpretation-workbench-package-v0.1.json"
  )
);

const identity = thesis.article_identity;
const ctx = workbench.interpretation_context;

const title = identity.title;

const article = `# ${title}

## Executive Summary

Singapore's petroleum output is often viewed as an industry statistic.

However, the historical evidence reviewed by SMURF suggests that petroleum-related manufacturing activity may also serve as a broader signal of Singapore's exposure to global energy demand conditions.

Across multiple historical cases, periods of stronger petroleum activity frequently coincided with changes in fuel demand, travel activity, refining economics, and logistics conditions.

Rather than treating petroleum output as an isolated sector indicator, it may therefore be more useful to interpret it as a window into broader energy-cycle conditions affecting the Singapore economy.

---

## Why This Signal Matters

Singapore occupies a unique position within regional and global energy supply chains.

The country combines refining capacity, storage infrastructure, trading expertise, shipping connectivity, and petrochemical activity within a relatively compact economic footprint.

Because of this position, changes in petroleum-related manufacturing activity can sometimes reflect developments occurring far beyond Singapore's borders.

Fuel demand, aviation recovery, refinery utilization, shipping activity, and crude-oil market conditions may all influence the sector's performance.

---

## What Historical Replay Reveals

SMURF identified ${ctx.historical_cases} historical cases associated with the same driver environment.

These cases do not prove causality.

However, they indicate that similar evidence patterns have appeared repeatedly during periods of changing energy demand and refining-cycle conditions.

The recurrence of these signals increases confidence that the observed pattern is not entirely isolated.

Current confidence is assessed at ${pct(ctx.confidence_score)}.

This confidence level should be interpreted as support for further investigation rather than certainty regarding future outcomes.

---

## Understanding the Energy Demand and Refining Cycle

The primary attributed driver is:

**${ctx.primary_driver}**

In practical terms, this mechanism describes how changes in global energy consumption can influence refining activity, fuel demand, logistics requirements, and related industrial activity.

When demand conditions strengthen, refineries may operate differently, transport volumes may change, and associated industrial activity can respond.

Singapore's role within these networks means that petroleum-related indicators may provide useful clues regarding broader regional developments.

---

## Evidence Patterns Worth Watching

The strongest recurring evidence patterns identified by SMURF include:

- Fuel demand
- Jet fuel demand
- Travel demand
- Refinery maintenance
- Refining margins
- Crude oil activity

Individually, none of these signals provide a complete explanation.

Together, however, they form a recurring pattern that has appeared across multiple historical cases.

For businesses, these indicators may provide early context regarding changing operating conditions.

---

## Business Implications

The practical value of this signal lies in interpretation rather than prediction.

Businesses exposed to trade, logistics, industrial demand, transportation, or energy-related activity may benefit from monitoring the same indicators that appear throughout the historical record.

Changes in petroleum-related manufacturing activity may reveal broader shifts in regional demand conditions before those shifts become visible in other areas of the economy.

This makes the signal potentially useful as part of a wider monitoring framework.

---

## What Still Requires Verification

Several questions remain open.

Additional verified metrics would strengthen the analysis and allow more precise quantitative interpretation.

Future work should focus on:

- Petroleum-related manufacturing output trends
- Regional fuel demand indicators
- Aviation and jet-fuel demand measures
- Shipping and logistics activity metrics

Until these metrics are verified, interpretation should remain cautious and avoid unsupported quantitative conclusions.

---

## Conclusion

Petroleum output should not necessarily be viewed as the story itself.

Instead, it may be better understood as a signal of broader energy-cycle conditions affecting Singapore's economy.

Historical replay suggests that recurring patterns connect petroleum activity to fuel demand, travel recovery, refining economics, and logistics conditions.

While further quantitative verification remains necessary, the available evidence supports treating petroleum-related manufacturing activity as a useful lens through which to observe changing global energy conditions.
`;

const output = {
  package_version: "article-editor-v0.1",
  generated_at: new Date().toISOString(),
  source_thesis_package: thesis.package_version,
  article_identity: identity,
  publication_article: article,
  publication_metadata: {
    title,
    confidence_score: ctx.confidence_score,
    confidence_tier: ctx.confidence_tier,
    historical_cases: ctx.historical_cases,
    primary_driver: ctx.primary_driver,
  },
};

const outDir = path.join(root, "exports/article-generator");

fs.mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(
  outDir,
  "publication-article-v0.1.json"
);

const mdPath = path.join(
  outDir,
  `${identity.slug}-publication-article-v0.1.md`
);

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
fs.writeFileSync(mdPath, article);

console.log({
  package_version: output.package_version,
  title,
  historical_cases: ctx.historical_cases,
  confidence: pct(ctx.confidence_score),
  markdown_output: mdPath,
  json_output: jsonPath,
});
