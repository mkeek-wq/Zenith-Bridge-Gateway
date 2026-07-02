import fs from "node:fs";
import path from "node:path";

const sourcePath = "data/intelligence/insight-generator-v0.1.json";
const outputPath = "data/intelligence/article-opportunity-queue-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function maturityScore(stage: string) {
  if (stage === "developing_cluster") return 35;
  if (stage === "early_cluster") return 25;
  if (stage === "emerging_pattern") return 18;
  if (stage === "single_case_or_weak_pattern") return 5;
  return 0;
}

function signalScore(signal: string) {
  if (signal === "high") return 30;
  if (signal === "medium") return 20;
  if (signal === "early_signal") return 8;
  return 0;
}

function scoreOpportunity(insight: any) {
  let score = 0;

  const experienceStrength = insight.experience_strength ?? 0;
  const confidenceScore = insight.confidence_score ?? 0;
  const weightedCaseCount = insight.weighted_case_count ?? 0;
  const scoreVolatility = insight.score_volatility ?? 0;
  const recurrenceScore = insight.recurrence_score ?? 0;
  const persistenceScore = insight.persistence_score ?? 0;
  const volatilityScore = insight.volatility_score ?? 0;
  const biasWarnings = insight.bias_warnings ?? [];
  const confidenceTier = insight.confidence_tier ?? "unknown";

  score += Math.round(experienceStrength * 40);
  score += maturityScore(insight.maturity_stage ?? "unknown");
  score += signalScore(insight.signal_strength ?? "unknown");

  if (confidenceTier === "established_pattern") score += 12;
  else if (confidenceTier === "developing_pattern") score += 8;
  else if (confidenceTier === "emerging_pattern") score += 4;

  score += Math.round(recurrenceScore * 10);
  score += Math.round(persistenceScore * 10);
  score += Math.round(volatilityScore * 8);

  if (biasWarnings.includes("LOW_SAMPLE_SIZE")) score -= 18;
  if (biasWarnings.includes("LOW_RECURRENCE")) score -= 10;
  if (biasWarnings.includes("LOW_PERSISTENCE")) score -= 10;
  if (biasWarnings.includes("HIGH_VOLATILITY")) score -= 8;
  if (biasWarnings.includes("POSSIBLE_TEMPLATE_CONCENTRATION")) score -= 6;

  if (confidenceScore >= 0.9) score += 10;
  else if (confidenceScore >= 0.6) score += 6;
  else if (confidenceScore > 0) score += 3;

  if (weightedCaseCount >= 5) score += 20;
  else if (weightedCaseCount >= 3) score += 15;
  else if (weightedCaseCount >= 2) score += 10;
  else if (weightedCaseCount >= 1) score += 5;

  if (insight.article_candidate?.priority === "high") score += 20;

  if ((insight.average_evidence_count ?? 0) >= 3) score += 8;

  if ((insight.weighted_average_driver_score ?? 0) >= 50) score += 6;
  else if ((insight.weighted_average_driver_score ?? 0) >= 25) score += 3;

  if (scoreVolatility > 25) score -= 5;

  return Math.max(0, score);
}

function recommendedFormat(insight: any) {
  const biasWarnings = insight.bias_warnings ?? [];

  if (biasWarnings.includes("LOW_SAMPLE_SIZE")) {
    return "short_brief";
  }

  if (
    insight.signal_strength === "high" &&
    insight.confidence_tier === "established_pattern" &&
    (insight.persistence_score ?? 0) >= 0.5
  ) {
    return "deep_dive";
  }

  if (
    ["high", "medium_high"].includes(insight.signal_strength ?? "") &&
    ["established_pattern", "developing_pattern"].includes(
      insight.confidence_tier ?? ""
    )
  ) {
    return "analysis_article";
  }

  return "short_brief";
}

function editorialGraphSuggestions(insight: any) {
  if (insight.driver_id === "MKT_008") {
    return [
      "Singapore semiconductor / electronics output trend",
      "Historical semiconductor signal timeline",
    ];
  }

  if (insight.driver_id === "MKT_011") {
    return [
      "Singapore chemicals / petrochemicals output trend",
      "Feedstock and downstream demand signal timeline",
    ];
  }

  if (insight.driver_id === "MKT_012") {
    return [
      "Singapore precision engineering output trend",
      "Capital equipment / capex signal timeline",
    ];
  }

  if (insight.driver_id === "MKT_013") {
    return [
      "Singapore transport engineering output trend",
      "Aviation and marine recovery signal timeline",
    ];
  }

  if (insight.driver_id === "MKT_007") {
    return [
      "Singapore petroleum output trend",
      "Energy demand and refining-cycle signal timeline",
    ];
  }

  return [
    "Singapore manufacturing output trend",
    "Historical movement / signal timeline",
  ];
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);

const opportunities = (source.insights ?? []).map((insight: any) => {
  const title = insight.article_candidate?.title ?? "Untitled Article Opportunity";
  const opportunityScore = scoreOpportunity(insight);

  return {
    opportunity_version: "article-opportunity-v0.1",
    opportunity_id: `ART-${slugify(title)}`,
    title,
    angle: insight.article_candidate?.angle ?? "",
    priority: insight.article_candidate?.priority ?? "medium",
    opportunity_score: opportunityScore,
    recommended_format: recommendedFormat(insight),
    source_driver: {
      driver_id: insight.driver_id,
      driver_name: insight.driver_name,
      attribution_bucket: insight.attribution_bucket,
    },
    signal: {
      signal_strength: insight.signal_strength,
      case_count: insight.case_count,
      weighted_case_count: insight.weighted_case_count,
      maturity_stage: insight.maturity_stage,
      confidence_score: insight.confidence_score,
      experience_strength: insight.experience_strength,
      recurrence_score: insight.recurrence_score,
      persistence_score: insight.persistence_score,
      volatility_score: insight.volatility_score,
      confidence_tier: insight.confidence_tier,
      stability_assessment: insight.stability_assessment,
      recurrence_assessment: insight.recurrence_assessment,
      bias_warnings: insight.bias_warnings ?? [],
      score_volatility: insight.score_volatility,
      average_evidence_count: insight.average_evidence_count,
      average_driver_score: insight.average_driver_score,
      weighted_average_driver_score: insight.weighted_average_driver_score,
    },
    business_implication: insight.business_implication,
    why_it_matters: insight.why_it_matters,
    affected_sectors: insight.affected_sectors,
    source_cases: insight.source_cases,
    evidence_patterns: insight.evidence_patterns,
    editorial_guidance: {
      suggested_sections: [
        "What happened?",
        "Why did it happen?",
        "What does the historical evidence show?",
        "Why does it matter for businesses?",
        "What should operators watch next?",
      ],
      required_graphs: editorialGraphSuggestions(insight),
      tone:
        "Calm, factual, structured, business-oriented. Avoid hype. Explain mechanisms.",
    },
    governance: {
      sandbox_only: true,
      article_auto_publish_allowed: false,
      requires_editorial_review: true,
      production_mutation_allowed: false,
      source_insight_file: sourcePath,
    },
  };
});

opportunities.sort(
  (a: any, b: any) =>
    b.opportunity_score - a.opportunity_score ||
    (b.signal?.experience_strength ?? 0) - (a.signal?.experience_strength ?? 0) ||
    (b.signal?.weighted_case_count ?? 0) - (a.signal?.weighted_case_count ?? 0)
);

const output = {
  article_opportunity_queue_version: "article-opportunity-queue-v0.1",
  generated_at: new Date().toISOString(),
  source_insights: sourcePath,
  policy: {
    principle:
      "Article opportunities convert business insights into editorial candidates. They are not publish-ready articles and require editorial review.",
    production_mutation_allowed: false,
  },
  hardening_notes: {
    purpose:
      "Scores article opportunities using hardened insight fields including experience_strength, maturity_stage, confidence_score, weighted_case_count, and score_volatility.",
  },
  summary: {
    opportunities_generated: opportunities.length,
    high_priority: opportunities.filter((x: any) => x.priority === "high").length,
    max_score: opportunities[0]?.opportunity_score ?? 0,
  },
  opportunities,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  article_opportunity_queue_version: output.article_opportunity_queue_version,
  opportunities_generated: output.summary.opportunities_generated,
  high_priority: output.summary.high_priority,
  max_score: output.summary.max_score,
  output: outputPath,
});

for (const opportunity of opportunities) {
  console.log("\nOpportunity:", opportunity.title);
  console.log("Score:", opportunity.opportunity_score);
  console.log("Format:", opportunity.recommended_format);
  console.log("Priority:", opportunity.priority);
  console.log("Signal:", opportunity.signal.signal_strength);
  console.log("Strength:", opportunity.signal.experience_strength);
  console.log("Maturity:", opportunity.signal.maturity_stage);
}
