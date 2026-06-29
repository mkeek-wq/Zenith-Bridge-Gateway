import fs from "node:fs";
import path from "node:path";

const sourcePath = "data/intelligence/evidence-discovery-queue-v0.1.json";
const opportunityPath = "data/intelligence/article-opportunity-queue-v0.1.json";
const outputPath = "data/intelligence/prioritized-evidence-discovery-queue-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceAuthorityScore(source: string) {
  const s = source.toLowerCase();

  if (
    s.includes("singstat") ||
    s.includes("mti") ||
    s.includes("edb") ||
    s.includes("mas") ||
    s.includes("iras")
  ) return 30;

  if (
    s.includes("iea") ||
    s.includes("eia") ||
    s.includes("opec") ||
    s.includes("imf") ||
    s.includes("world bank") ||
    s.includes("wto")
  ) return 25;

  if (
    s.includes("semi") ||
    s.includes("wsts") ||
    s.includes("sia") ||
    s.includes("iatai") ||
    s.includes("iaca")
  ) return 20;

  if (
    s.includes("company") ||
    s.includes("investor relations") ||
    s.includes("earnings") ||
    s.includes("annual reports")
  ) return 18;

  return 10;
}

function domainScore(domain: string) {
  if (
    [
      "official_statistics",
      "official_policy",
      "regulatory_notice",
      "company_disclosure",
      "commodity_market_data",
    ].includes(domain)
  ) return 25;

  if (
    [
      "industry_association",
      "industry_report",
      "multilateral_report",
      "government_announcement",
      "government_investment_announcement",
    ].includes(domain)
  ) return 18;

  return 10;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const opportunitySource = readJson(opportunityPath);

const opportunityByDriver: Record<string, any> = {};

for (const opportunity of opportunitySource.opportunities ?? []) {
  const driverId = opportunity.source_driver?.driver_id;
  if (!driverId) continue;
  opportunityByDriver[driverId] = opportunity;
}

const tasks = source.discovery_tasks ?? [];

const prioritized = tasks.map((task: any) => {
  const opportunity = opportunityByDriver[task.driver_id];
  const opportunityScore = opportunity?.opportunity_score ?? 0;
  const signalStrength = opportunity?.signal?.signal_strength ?? "unknown";
  const biasWarnings = opportunity?.signal?.bias_warnings ?? [];

  let score = 0;

  score += sourceAuthorityScore(task.evidence_source);
  score += domainScore(task.evidence_domain);
  score += Math.min(Math.round(opportunityScore / 5), 40);

  if (task.priority === "high") score += 15;
  if (signalStrength === "high") score += 20;
  if (signalStrength === "medium_high") score += 14;
  if (signalStrength === "medium") score += 8;

  if (biasWarnings.includes("LOW_SAMPLE_SIZE")) score -= 12;
  if (biasWarnings.includes("LOW_RECURRENCE")) score -= 8;
  if (biasWarnings.includes("LOW_PERSISTENCE")) score -= 8;
  if (biasWarnings.includes("HIGH_VOLATILITY")) score -= 6;
  if (biasWarnings.includes("POSSIBLE_TEMPLATE_CONCENTRATION")) score -= 6;

  return {
    ...task,
    opportunity_score: opportunityScore,
    signal_strength: signalStrength,
    bias_warnings: biasWarnings,
    priority_score: Math.max(0, score),
    review_priority:
      score >= 95 ? "top_review" :
      score >= 75 ? "high_review" :
      score >= 55 ? "medium_review" :
      "low_review",
  };
}).sort((a: any, b: any) => b.priority_score - a.priority_score);

const topReview = prioritized.slice(0, 30);

const output = {
  prioritized_evidence_discovery_queue_version:
    "prioritized-evidence-discovery-queue-v0.1",
  generated_at: new Date().toISOString(),
  source_discovery_queue: sourcePath,
  source_article_opportunities: opportunityPath,
  policy: {
    principle:
      "Prioritizes deterministic evidence-discovery tasks for human review. No live search or ingestion is performed.",
    auto_search_allowed: false,
    auto_ingestion_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
  },
  summary: {
    input_tasks: tasks.length,
    prioritized_tasks: prioritized.length,
    top_review_tasks: topReview.length,
    max_priority_score: prioritized[0]?.priority_score ?? 0,
  },
  top_review_tasks: topReview,
  prioritized_tasks: prioritized,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  prioritized_evidence_discovery_queue_version:
    output.prioritized_evidence_discovery_queue_version,
  input_tasks: output.summary.input_tasks,
  prioritized_tasks: output.summary.prioritized_tasks,
  top_review_tasks: output.summary.top_review_tasks,
  max_priority_score: output.summary.max_priority_score,
  output: outputPath,
});

for (const task of topReview) {
  console.log(
    `${task.priority_score} | ${task.driver_id} | ${task.evidence_source} | ${task.search_phrase}`
  );
}
