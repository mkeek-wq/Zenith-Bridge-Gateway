import fs from "fs";
import path from "path";

function readText(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const archiveDir = path.join(
  root,
  "data/document-archive/SG_SINGSTAT_monthly-manufacturing-performance-apr2026"
);

const metadata = readJson(path.join(archiveDir, "metadata.json"));
const html = readText(path.join(archiveDir, "document.html"));

const candidateTerms = [
  "manufacturing output",
  "petroleum",
  "chemicals",
  "petrochemicals",
  "transport engineering",
  "total manufacturing",
  "seasonally adjusted",
  "month-on-month",
  "year-on-year"
];

const matches = candidateTerms.map((term) => ({
  term,
  found_in_html: html.toLowerCase().includes(term.toLowerCase()),
  found_in_metadata:
    JSON.stringify(metadata).toLowerCase().includes(term.toLowerCase())
}));

const output = {
  package_version: "official-release-candidate-extractor-v0.1",
  generated_at: new Date().toISOString(),
  document_id: metadata.document_id,
  title: metadata.title,
  url: metadata.url,
  publication_date: metadata.publication_date,
  resource_type: metadata.resource_type,
  summary: metadata.summary,
  content_hash: metadata.content_hash,
  extraction_result: {
    archive_contains_source_lineage: true,
    archive_contains_sector_values: matches.some(
      (m) =>
        ["petroleum", "chemicals", "transport engineering"].includes(m.term) &&
        m.found_in_html
    ),
    extraction_mode:
      "source_discovery_only_pending_table_or_api_value_extraction"
  },
  candidate_terms: matches,
  candidate_source: {
    source_name: "Singapore Department of Statistics",
    source_url: metadata.url,
    source_type: "official_release",
    status: "official_source_confirmed_value_extraction_pending"
  },
  governance: {
    graph_values_extracted: false,
    may_promote_to_verified_metrics: false,
    may_use_for_source_lineage: true,
    human_review_required: true
  }
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "official-release-candidate-extractor-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.title,
  source_lineage: output.extraction_result.archive_contains_source_lineage,
  sector_values_found: output.extraction_result.archive_contains_sector_values,
  output: outPath
});
