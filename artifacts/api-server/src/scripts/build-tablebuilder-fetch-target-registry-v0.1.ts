import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const missingRequests = readJson(
  path.join(root, "exports/article-generator/missing-sector-data-request-package-v0.1.json")
);

const targets = (missingRequests.requests ?? []).map((req: any) => ({
  target_id: `TB_${req.sector.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
  sector: req.sector,
  metric: req.metric,
  required_period: req.required_period,
  required_unit: req.required_unit,
  tablebuilder_priority: "high",
  official_source_name: "Singapore Department of Statistics TableBuilder",
  official_source_url: "https://tablebuilder.singstat.gov.sg",
  release_reference_url: req.preferred_source_url,
  likely_dataset_family: "Manufacturing output / industrial production by cluster or industry",
  required_for: [
    "institutional_graph",
    "sector_comparison_chart",
    "article_quantification",
    "premium_dataset_layer"
  ],
  expected_fields: [
    "sector",
    "period",
    "growth_yoy",
    "unit",
    "source_url"
  ],
  retrieval_status: "target_identified_value_not_retrieved",
  governance: {
    official_source_identified: true,
    value_verified: false,
    graph_use_allowed: false,
    human_review_required: true,
    auto_promotion_allowed: false
  }
}));

const output = {
  registry_version: "tablebuilder-fetch-target-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_request_package: missingRequests.package_version,
  article_identity: missingRequests.article_identity,
  total_targets: targets.length,
  targets,
  governance_rules: [
    "TableBuilder targets identify official data sources but do not verify values.",
    "Values must be manually reviewed or validated by a trusted extractor before promotion.",
    "A target without a value may not be used in charts.",
    "Institutional graphs require verified sector values, not merely identified sources."
  ],
  next_action:
    "Retrieve or extract values from official TableBuilder dataset, then update sector-performance-input-v0.1.json."
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "tablebuilder-fetch-target-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  total_targets: output.total_targets,
  next_action: output.next_action,
  output: outPath
});
