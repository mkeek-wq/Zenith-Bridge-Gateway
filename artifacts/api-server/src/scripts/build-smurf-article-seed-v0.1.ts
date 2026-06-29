import fs from "fs";
import path from "path";

const output = {
  seed_version: "smurf-article-seed-v0.1",
  generated_at: new Date().toISOString(),

  source_system: {
    name: "SMURF Intelligence Engine",
    integration_mode: "lightweight_seed_adapter",
    current_scope: "Singapore evidence with macro context",
  },

  article_seed: {
    seed_id: "SG_ENERGY_HUB_001",
    country_anchor: "Singapore",
    macro_role: "supporting_context_only",
    article_type: "flagship",
    topic: "Singapore energy trading hub",
    proposed_title:
      "Why Singapore Became One of the World's Most Important Energy Trading Hubs",
    core_question:
      "How did Singapore become a major energy trading hub despite having virtually no domestic oil reserves?",
  },

  smurf_context: {
    related_domains: [
      "energy_trade",
      "industrial_ecosystem",
      "macro_context",
      "ecosystem_mechanism",
    ],
    related_mechanisms: [
      "ecosystem_accumulation",
      "strategic_location_plus_institutional_execution",
      "infrastructure_cluster_advantage",
    ],
    confidence_mode: "early_article_generator_confidence",
  },

  evidence_requests: [
    {
      request_id: "REQ_001",
      claim_target: "Singapore is a significant maritime and bunkering hub.",
      preferred_source: "Maritime and Port Authority of Singapore",
      needed_for: ["article", "future_graph"],
      priority: "high",
    },
    {
      request_id: "REQ_002",
      claim_target:
        "Jurong Island anchors Singapore's energy and chemicals ecosystem.",
      preferred_source: "Singapore Economic Development Board",
      needed_for: ["article", "future_graph"],
      priority: "high",
    },
    {
      request_id: "REQ_003",
      claim_target:
        "Singapore's role is disproportionate relative to its size.",
      preferred_source: "World Bank / SingStat / MPA",
      needed_for: ["flagship_graph"],
      priority: "high",
    },
    {
      request_id: "REQ_004",
      claim_target:
        "Regional energy demand provides macro context for Singapore's hub role.",
      preferred_source: "International Energy Agency",
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

const outDir = path.join(process.cwd(), "data", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "smurf-article-seed-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  seed_version: output.seed_version,
  seed_id: output.article_seed.seed_id,
  topic: output.article_seed.topic,
  evidence_requests: output.evidence_requests.length,
  output: outPath,
});
