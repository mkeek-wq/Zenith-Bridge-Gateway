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

function cleanHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractCandidateAround(text: string, term: string, radius = 220) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx === -1) return null;

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + term.length + radius);
  return text.slice(start, end);
}

function extractNumbers(snippet: string | null) {
  if (!snippet) return [];
  const matches = snippet.match(/[-+]?\d+(?:\.\d+)?\s?%?/g) ?? [];
  return matches.slice(0, 20);
}

const root = process.cwd();

const archiveDir = path.join(
  root,
  "data/document-archive/SG_SINGSTAT_monthly-manufacturing-performance-apr2026"
);

const metadata = readJson(path.join(archiveDir, "metadata.json"));
const html = readText(path.join(archiveDir, "document.html"));
const text = cleanHtmlToText(html);

const targetSectors = [
  "Petroleum",
  "Chemicals",
  "Transport Engineering",
  "Total Manufacturing",
  "Manufacturing output",
  "month-on-month",
  "year-on-year"
];

const candidates = targetSectors.map((sector) => {
  const snippet = extractCandidateAround(text, sector);
  const numbers = extractNumbers(snippet);

  return {
    sector_or_term: sector,
    found: Boolean(snippet),
    candidate_snippet: snippet,
    candidate_numbers: numbers,
    extraction_confidence:
      snippet && numbers.length > 0 ? "candidate_value_possible" :
      snippet ? "term_found_no_clear_number" :
      "not_found",
    governance: {
      verified: false,
      graph_use_allowed: false,
      requires_human_review: true,
      promotion_allowed_without_review: false
    }
  };
});

const output = {
  package_version: "official-statistics-table-extractor-v0.1",
  generated_at: new Date().toISOString(),
  source_document: {
    document_id: metadata.document_id,
    title: metadata.title,
    url: metadata.url,
    publication_date: metadata.publication_date,
    summary: metadata.summary,
    content_hash: metadata.content_hash
  },
  extraction_mode: "html_text_candidate_scan",
  extraction_summary: {
    targets: targetSectors.length,
    found_terms: candidates.filter((c) => c.found).length,
    candidate_values_possible: candidates.filter(
      (c) => c.extraction_confidence === "candidate_value_possible"
    ).length
  },
  candidates,
  governance: {
    extractor_is_candidate_only: true,
    may_write_verified_registry: false,
    may_update_sector_input: false,
    human_review_required: true,
    note:
      "This extractor discovers possible values from archived official-source text. It does not verify or promote values automatically."
  },
  next_actions: [
    "Review candidate snippets.",
    "If official values are clearly present, manually update inputs/article-generator/sector-performance-input-v0.1.json.",
    "If values are not present, use TableBuilder or official PDF/API source.",
    "Rerun sector registry and institutional graph bridge after manual verification."
  ]
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "official-statistics-table-extractor-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: metadata.title,
  found_terms: output.extraction_summary.found_terms,
  candidate_values_possible: output.extraction_summary.candidate_values_possible,
  output: outPath
});
