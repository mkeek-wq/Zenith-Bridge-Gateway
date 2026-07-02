import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const sectorRegistry = readJson(
  path.join(root, "exports/article-generator/sector-performance-registry-v0.1.json")
);

const releaseCandidate = readJson(
  path.join(root, "exports/article-generator/official-release-candidate-extractor-v0.1.json")
);

const missing = (sectorRegistry.metrics ?? [])
  .filter((m: any) => !m.governance?.graph_use_allowed)
  .map((m: any) => ({
    request_id: `REQ_${m.sector.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${m.metric.toUpperCase()}`,
    sector: m.sector,
    metric: m.metric,
    required_period: m.period,
    required_unit: m.unit,
    current_status: m.verification_status,
    preferred_source: releaseCandidate.candidate_source.source_name,
    preferred_source_url: releaseCandidate.candidate_source.source_url,
    data_need: "official_value_required_for_institutional_graph",
    acceptable_sources: [
      "Singapore Department of Statistics",
      "EDB",
      "official Singapore manufacturing release",
      "official TableBuilder dataset"
    ],
    verification_requirements: [
      "period",
      "value",
      "unit",
      "source_name",
      "source_url"
    ],
    promotion_target:
      "inputs/article-generator/sector-performance-input-v0.1.json"
  }));

const output = {
  package_version: "missing-sector-data-request-package-v0.1",
  generated_at: new Date().toISOString(),
  source_sector_registry: sectorRegistry.registry_version,
  source_release_candidate: releaseCandidate.package_version,
  article_identity: {
    title: "What Petroleum Output Reveals About Singapore's Exposure to Global Energy Cycles",
    slug: "what-petroleum-output-reveals-about-singapore-s-exposure-to-global-energy-cycles"
  },
  total_requests: missing.length,
  requests: missing,
  publication_impact: {
    current_status: "institutional_graph_blocked",
    unblock_condition:
      "At least three related sector metrics must be verified.",
    expected_after_completion:
      "institutional_graph_ready"
  }
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "missing-sector-data-request-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  total_requests: output.total_requests,
  current_status: output.publication_impact.current_status,
  output: outPath
});
