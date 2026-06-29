import fs from "fs";
import path from "path";

const queuePath = path.join(
  process.cwd(),
  "data/intelligence/article-opportunity-queue-v0.1.json"
);

if (!fs.existsSync(queuePath)) {
  throw new Error(`Missing opportunity queue: ${queuePath}`);
}

const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));

const opportunities =
  queue.article_opportunities ??
  queue.opportunities ??
  queue.queue ??
  [];

if (!Array.isArray(opportunities) || opportunities.length === 0) {
  throw new Error("No article opportunities found in queue.");
}

const selected =
  opportunities.find((o: any) =>
    String(o.title ?? o.article_title ?? "")
      .toLowerCase()
      .includes("energy")
  ) ?? opportunities[0];

const title =
  selected.title ??
  selected.article_title ??
  "Singapore Intelligence Article";

const topic =
  selected.topic ??
  selected.domain ??
  selected.driver_id ??
  title;

const seedId =
  selected.opportunity_id ??
  selected.article_id ??
  `AOQ_SEED_${Date.now()}`;

const output = {
  seed_version: "smurf-article-seed-from-opportunity-v0.1",
  generated_at: new Date().toISOString(),

  source_system: {
    name: "SMURF Intelligence Engine",
    integration_mode: "article_opportunity_queue_adapter",
    source_queue: "article-opportunity-queue-v0.1",
  },

  article_seed: {
    seed_id: seedId,
    country_anchor: "Singapore",
    macro_role: "supporting_context_only",
    article_type: selected.article_type ?? "flagship",
    topic,
    proposed_title: title,
    core_question:
      selected.core_question ??
      selected.question ??
      `What explains ${title}?`,
  },

  smurf_context: {
    original_opportunity: selected,
    confidence_mode: "early_article_generator_confidence",
  },

  evidence_requests: [
    {
      request_id: "REQ_001",
      claim_target: `${title} can be supported by Singapore-specific evidence.`,
      preferred_source: "Singapore Department of Statistics",
      needed_for: ["article"],
      priority: "high",
    },
    {
      request_id: "REQ_002",
      claim_target: `${title} may require sector or agency evidence.`,
      preferred_source: "Relevant Singapore official agency",
      needed_for: ["article", "future_graph"],
      priority: "high",
    },
    {
      request_id: "REQ_003",
      claim_target: `${title} may benefit from light macro comparison.`,
      preferred_source: "World Bank / IEA / WTO / IMF where relevant",
      needed_for: ["macro_context"],
      priority: "medium",
    },
  ],

  generator_instructions: {
    generate_article: true,
    generate_quantitative_graphs: false,
    generate_conceptual_visuals: true,
    require_verified_figures_for_numeric_claims: true,
    public_article_should_include_confidence_table: true,
  },
};

const outDir = path.join(process.cwd(), "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "smurf-article-seed-from-opportunity-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  seed_version: output.seed_version,
  seed_id: output.article_seed.seed_id,
  title: output.article_seed.proposed_title,
  output: outPath,
});
