import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const requests = readJson(
  path.join(root, "exports/article-generator/missing-sector-data-request-package-v0.1.json")
);

const targets = (requests.requests ?? []).map((req: any) => ({
  target_id: `FETCH_${req.sector.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
  sector: req.sector,
  metric: req.metric,
  period: req.required_period,
  unit: req.required_unit,
  target_source: req.preferred_source,
  target_url: req.preferred_source_url,
  retrieval_method_priority: [
    "manual_official_page_review",
    "TableBuilder export",
    "official PDF/table download",
    "future API connector"
  ],
  expected_output_fields: [
    "sector",
    "period",
    "metric",
    "value",
    "unit",
    "source_name",
    "source_url",
    "verification_status"
  ],
  promotion_rule:
    "Promote only after value is manually verified against official source.",
  governance: {
    auto_ingestion_allowed: false,
    manual_review_required: true,
    graph_use_allowed_before_verification: false
  }
}));

const output = {
  package_version: "official-source-fetch-target-package-v0.1",
  generated_at: new Date().toISOString(),
  source_request_package: requests.package_version,
  article_identity: requests.article_identity,
  total_targets: targets.length,
  targets,
  operator_next_action:
    "Retrieve official values, update sector-performance-input-v0.1.json, then rerun sector registry and institutional graph bridge.",
  rerun_commands: [
    "pnpm tsx src/scripts/build-sector-performance-registry-v0.1.ts",
    "pnpm tsx src/scripts/build-institutional-graph-bridge-v0.1.ts"
  ]
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "official-source-fetch-target-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  total_targets: output.total_targets,
  next_action: output.operator_next_action,
  output: outPath
});
