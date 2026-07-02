import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const relevanceRules = [
  {
    domain: "manufacturing",
    preferred_macro_keys: ["SINGAPORE_MANUFACTURING", "GLOBAL_PMI", "GLOBAL_TRADE_VOLUME", "SINGAPORE_NODX"],
    penalized_macro_keys: [],
  },
  {
    domain: "petroleum",
    preferred_macro_keys: ["BRENT_CRUDE", "GLOBAL_TRADE_VOLUME", "GLOBAL_PMI", "SINGAPORE_NODX"],
    penalized_macro_keys: ["GLOBAL_SEMICONDUCTOR_SALES"],
  },
  {
    domain: "semiconductors",
    preferred_macro_keys: ["GLOBAL_SEMICONDUCTOR_SALES", "SINGAPORE_NODX", "GLOBAL_PMI", "US_PMI", "CHINA_EXPORT_GROWTH"],
    penalized_macro_keys: ["BRENT_CRUDE"],
  },
  {
    domain: "biomedical",
    preferred_macro_keys: ["SINGAPORE_GDP", "GLOBAL_PMI", "FED_FUNDS_RATE", "GLOBAL_TRADE_VOLUME"],
    penalized_macro_keys: ["GLOBAL_SEMICONDUCTOR_SALES", "BRENT_CRUDE"],
  },
  {
    domain: "electronics",
    preferred_macro_keys: ["GLOBAL_SEMICONDUCTOR_SALES", "SINGAPORE_NODX", "GLOBAL_PMI", "US_PMI", "CHINA_EXPORT_GROWTH"],
    penalized_macro_keys: ["BRENT_CRUDE"],
  },
  {
    domain: "services",
    preferred_macro_keys: ["SINGAPORE_GDP", "FED_FUNDS_RATE", "GLOBAL_PMI"],
    penalized_macro_keys: ["GLOBAL_SEMICONDUCTOR_SALES", "BRENT_CRUDE"],
  },
  {
    domain: "trade",
    preferred_macro_keys: ["GLOBAL_TRADE_VOLUME", "SINGAPORE_NODX", "GLOBAL_PMI", "CHINA_EXPORT_GROWTH"],
    penalized_macro_keys: [],
  },
  {
    domain: "exports",
    preferred_macro_keys: ["SINGAPORE_NODX", "GLOBAL_TRADE_VOLUME", "GLOBAL_PMI", "CHINA_EXPORT_GROWTH"],
    penalized_macro_keys: [],
  },
];

const output = {
  registry_version: "macro-domain-relevance-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    macro_relevance_filters_reduce_noise_not_truth: true,
    domain_relevance_is_contextual: true,
    relevance_rules_are_reviewable: true,
    evidence_remains_primary: true,
  },
  summary: {
    domains_registered: relevanceRules.length,
    total_preferred_rules: relevanceRules.reduce((sum, r) => sum + r.preferred_macro_keys.length, 0),
    total_penalty_rules: relevanceRules.reduce((sum, r) => sum + r.penalized_macro_keys.length, 0),
  },
  relevance_rules: relevanceRules,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/macro-domain-relevance-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/intelligence/macro-domain-relevance-engine-v0.1.json",
});

console.table(
  relevanceRules.map((r) => ({
    domain: r.domain,
    preferred: r.preferred_macro_keys.length,
    penalized: r.penalized_macro_keys.length,
  }))
);
