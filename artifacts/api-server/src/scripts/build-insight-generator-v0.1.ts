import fs from "node:fs";
import path from "node:path";

const sourcePath = "data/intelligence/experience-registry-v0.2.json";
const outputPath = "data/intelligence/insight-generator-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function signalStrength(
  experienceStrength: number,
  maturityStage: string,
  confidenceScore: number,
  recurrenceScore: number,
  persistenceScore: number,
  biasWarnings: string[]
) {
  const hasLowSample =
    biasWarnings.includes("LOW_SAMPLE_SIZE");

  const hasLowRecurrence =
    biasWarnings.includes("LOW_RECURRENCE");

  const hasLowPersistence =
    biasWarnings.includes("LOW_PERSISTENCE");

  const hasHighVolatility =
    biasWarnings.includes("HIGH_VOLATILITY");

  if (hasLowSample) {
    if (experienceStrength >= 0.65 && confidenceScore >= 0.8) {
      return "medium";
    }

    return "early_signal";
  }

  if (
    experienceStrength >= 0.8 &&
    confidenceScore >= 0.8 &&
    recurrenceScore >= 0.6 &&
    persistenceScore >= 0.5 &&
    !hasLowRecurrence &&
    !hasLowPersistence
  ) {
    return hasHighVolatility ? "medium_high" : "high";
  }

  if (
    experienceStrength >= 0.65 &&
    confidenceScore >= 0.7 &&
    recurrenceScore >= 0.5 &&
    persistenceScore >= 0.3 &&
    ["early_cluster", "developing_cluster"].includes(maturityStage)
  ) {
    return "medium_high";
  }

  if (
    experienceStrength >= 0.5 &&
    confidenceScore >= 0.6
  ) {
    return "medium";
  }

  if (experienceStrength > 0) return "early_signal";

  return "unknown";
}

function confidenceTier(experienceStrength: number) {
  if (experienceStrength >= 0.8) return "established_pattern";
  if (experienceStrength >= 0.65) return "developing_pattern";
  if (experienceStrength >= 0.5) return "emerging_pattern";
  return "experimental_pattern";
}

function stabilityAssessment(volatilityScore: number) {
  if (volatilityScore >= 0.8) return "stable_pattern";
  if (volatilityScore >= 0.6) return "moderately_stable_pattern";
  if (volatilityScore >= 0.4) return "volatile_pattern";
  return "highly_volatile_pattern";
}

function recurrenceAssessment(recurrenceScore: number, persistenceScore: number) {
  if (recurrenceScore >= 0.7 && persistenceScore >= 0.5) {
    return "recurring_across_periods";
  }

  if (recurrenceScore >= 0.5 && persistenceScore >= 0.3) {
    return "partially_recurring";
  }

  return "limited_recurrence";
}

function buildBusinessImplication(driverId: string, driverName: string, patterns: string[]) {
  if (driverId === "MKT_008") {
    return "Singapore's semiconductor manufacturing movements appear linked to global electronics and chip-cycle dynamics, suggesting that external technology demand can materially affect local industrial output.";
  }

  if (driverId === "MKT_011") {
    return "Singapore's chemicals and petrochemicals output appears linked to regional industrial demand, downstream manufacturing activity, feedstock costs, and plant utilisation patterns.";
  }

  if (driverId === "MKT_012") {
    return "Singapore's precision engineering movements appear linked to capital equipment demand, machinery orders, automation investment, and manufacturing capex cycles.";
  }

  if (driverId === "MKT_013") {
    return "Singapore's transport engineering movements appear linked to aviation recovery, aircraft maintenance, marine engineering, ship repair, and fleet maintenance cycles.";
  }

  if (driverId === "MKT_007") {
    return "Singapore's petroleum-related manufacturing movements appear linked to energy demand and refining-cycle conditions, suggesting exposure to global fuel demand, travel activity, and refinery operations.";
  }

  if (driverId === "MKT_010") {
    return "The case pattern suggests exposure to broad external demand shocks, where global disruptions can transmit quickly into Singapore's industrial production base.";
  }

  if (driverId === "MKT_004") {
    return "The case pattern suggests that capacity expansion and production ramp-up can create meaningful changes in output, making investment and plant-level activity important signals.";
  }

  return `The case pattern suggests that ${driverName} is a meaningful explanatory driver for selected Singapore manufacturing movements.`;
}

function buildWhyItMatters(driverId: string) {
  if (driverId === "MKT_008") {
    return "For investors and operators, semiconductor-cycle exposure matters because Singapore can benefit from global technology demand but may also face volatility when chip demand, inventories, or electronics orders shift.";
  }

  if (driverId === "MKT_011") {
    return "For businesses, chemicals and petrochemicals matter because they sit across energy, manufacturing, logistics, and industrial supply chains, making them useful signals for regional demand and cost pressure.";
  }

  if (driverId === "MKT_012") {
    return "For operators, precision engineering matters because it can indicate where capital spending, automation, and advanced manufacturing investment are strengthening or weakening.";
  }

  if (driverId === "MKT_013") {
    return "For businesses, transport engineering matters because aviation, marine, and maintenance cycles can reveal recovery patterns in travel, logistics, offshore activity, and regional industrial demand.";
  }

  if (driverId === "MKT_007") {
    return "For businesses, energy-cycle exposure matters because petroleum and refining movements can signal changes in trade, logistics, travel, and industrial demand conditions.";
  }

  if (driverId === "MKT_010") {
    return "For market-entry decisions, demand shocks matter because they reveal which sectors are resilient and which are vulnerable during global disruptions.";
  }

  if (driverId === "MKT_004") {
    return "For business planners, capacity expansion matters because it can signal where production ecosystems, suppliers, and investment opportunities may deepen.";
  }

  return "For business readers, this matters because recurring historical drivers can help interpret future economic signals more quickly.";
}

function buildArticleCandidate(driverId: string, driverName: string, signal: string) {
  if (driverId === "MKT_008") {
    return {
      title:
        "How Semiconductor Cycles Shape Singapore's Manufacturing Advantage",
      angle:
        "Use historical semiconductor output movements to explain why Singapore's manufacturing base is closely tied to global chip and electronics demand.",
      priority: signal === "high" ? "high" : "medium",
    };
  }

  if (driverId === "MKT_011") {
    return {
      title:
        "How Chemicals and Petrochemicals Reflect Singapore's Industrial Cycle",
      angle:
        "Use historical chemicals and petrochemicals cases to explain how feedstock costs, downstream demand, and plant utilisation shape Singapore's manufacturing base.",
      priority: signal === "high" ? "high" : "medium",
    };
  }

  if (driverId === "MKT_012") {
    return {
      title:
        "What Precision Engineering Reveals About Singapore's Capital Equipment Cycle",
      angle:
        "Explain how machinery demand, automation investment, and capex cycles affect Singapore's precision engineering sector.",
      priority: signal === "high" ? "high" : "medium",
    };
  }

  if (driverId === "MKT_013") {
    return {
      title:
        "What Transport Engineering Reveals About Singapore's Aviation and Marine Recovery",
      angle:
        "Explain how aviation recovery, aircraft maintenance, marine engineering, and ship repair activity shape Singapore's transport engineering sector.",
      priority: signal === "high" ? "high" : "medium",
    };
  }

  if (driverId === "MKT_007") {
    return {
      title:
        "What Petroleum Output Reveals About Singapore's Exposure to Global Energy Cycles",
      angle:
        "Explain how petroleum-related manufacturing movements reflect fuel demand, travel recovery, refining margins, and operational factors.",
      priority: "medium",
    };
  }

  if (driverId === "MKT_010") {
    return {
      title:
        "How Global Demand Shocks Move Through Singapore's Industrial Base",
      angle:
        "Use historical demand-shock episodes to show how external disruptions affect Singapore's manufacturing sectors.",
      priority: "medium",
    };
  }

  return {
    title: `Understanding ${driverName} in Singapore's Manufacturing Data`,
    angle:
      "Translate historical industrial movements into practical business interpretation for investors and operators.",
    priority: "medium",
  };
}

function affectedSectors(driverId: string) {
  if (driverId === "MKT_008") {
    return ["Semiconductors", "Electronics", "Advanced Manufacturing"];
  }

  if (driverId === "MKT_011") {
    return ["Chemicals", "Petrochemicals", "Manufacturing", "Logistics"];
  }

  if (driverId === "MKT_012") {
    return ["Precision Engineering", "Capital Equipment", "Advanced Manufacturing"];
  }

  if (driverId === "MKT_013") {
    return ["Aerospace", "Marine Engineering", "Transport Engineering", "MRO"];
  }

  if (driverId === "MKT_007") {
    return ["Petroleum", "Refining", "Energy", "Logistics"];
  }

  return ["Manufacturing"];
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const registry = readJson(sourcePath);
const insights = (registry.driver_experiences ?? []).map((experience: any) => {
  const patterns = (experience.evidence_patterns ?? []).map((x: any) => x.phrase);

  const signal = signalStrength(
  experience.experience_strength ?? 0,
  experience.maturity_stage ?? "unknown",
  experience.confidence_score ?? 0,
  experience.recurrence_score ?? 0,
  experience.persistence_score ?? 0,
  experience.bias_warnings ?? []
  );

  const articleCandidate = buildArticleCandidate(
    experience.driver_id,
    experience.driver_name,
    signal
  );

  return {
    insight_version: "business-insight-v0.1",
    driver_id: experience.driver_id,
    driver_name: experience.driver_name,
    attribution_bucket: experience.attribution_bucket,
    source_cases: experience.cases ?? [],
    evidence_patterns: experience.evidence_patterns ?? [],
    case_count: experience.case_count,
    weighted_case_count: experience.weighted_case_count,
    maturity_stage: experience.maturity_stage,
    confidence_score: experience.confidence_score,
    experience_strength: experience.experience_strength,
    score_volatility: experience.score_volatility,
    recurrence_score: experience.recurrence_score,
    persistence_score: experience.persistence_score,
    volatility_score: experience.volatility_score,
    bias_warnings: experience.bias_warnings ?? [],
    confidence_tier: confidenceTier(experience.experience_strength ?? 0),
    stability_assessment: stabilityAssessment(experience.volatility_score ?? 0),
    recurrence_assessment: recurrenceAssessment(
    experience.recurrence_score ?? 0,
    experience.persistence_score ?? 0
    ),
    average_evidence_count: experience.average_evidence_count,
    average_driver_score: experience.average_driver_score,
    weighted_average_driver_score: experience.weighted_average_driver_score,
    signal_strength: signal,
    business_implication: buildBusinessImplication(
      experience.driver_id,
      experience.driver_name,
      patterns
    ),
    why_it_matters: buildWhyItMatters(experience.driver_id),
    affected_sectors: affectedSectors(experience.driver_id),
    article_candidate: articleCandidate,
    governance: {
      sandbox_only: true,
      article_auto_publish_allowed: false,
      requires_editorial_review: true,
      production_mutation_allowed: false,
    },
  };
});

const output = {
  insight_generator_version: "insight-generator-v0.1",
  generated_at: new Date().toISOString(),
  source_experience_registry: sourcePath,
  policy: {
    principle:
      "Insights translate driver experience into business implications and article opportunities. They are editorial inputs, not publish-ready articles.",
    production_mutation_allowed: false,
  },
  hardening_notes: {
    purpose:
      "Uses hardened experience registry fields including experience_strength, maturity_stage, confidence_score, weighted_case_count, recurrence_score, persistence_score, volatility_score, score_volatility, and bias_warnings."
  },
  summary: {
    insights_generated: insights.length,
    high_priority_article_candidates: insights.filter(
      (x: any) => x.article_candidate?.priority === "high"
    ).length,
  },
  insights,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  insight_generator_version: output.insight_generator_version,
  insights_generated: output.summary.insights_generated,
  high_priority_article_candidates:
    output.summary.high_priority_article_candidates,
  output: outputPath,
});

for (const insight of insights) {
  console.log("\nInsight:", insight.driver_id, insight.driver_name);
  console.log("Signal:", insight.signal_strength);
  console.log("Strength:", insight.experience_strength);
  console.log("Maturity:", insight.maturity_stage);
  console.log("Article:", insight.article_candidate.title);
  console.log("Priority:", insight.article_candidate.priority);
}
