import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DISCOVERY_VERSION = "document-discovery-v0.2";

const projectRoot = process.cwd();
const inputPath = path.join(projectRoot, "data", "monitoring-runs", "latest-content.html");
const outputDir = path.join(projectRoot, "data", "document-candidates");
const outputPath = path.join(outputDir, "singstat-latest-candidates.json");

type Candidate = {
  discovery_version: string;
  institution_id: string;
  feed_id: string;
  title: string;
  slug: string;
  url: string;
  publication_date: string | null;
  resource_type: string | null;
  summary: string | null;
  discovered_at: string;
};

function decodePage(value: string): string {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\n/g, " ");
}

function cleanText(value: string | null): string | null {
  if (!value) return null;

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildUrl(slug: string): string {
  return `https://www.singstat.gov.sg/news/${slug}`;
}

function findField(block: string, field: string): string | null {
  const regex = new RegExp(`"${field}":"([^"]*)"`);
  return regex.exec(block)?.[1] ?? null;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const rawHtml = await readFile(inputPath, "utf8");
  const normalized = decodePage(rawHtml);

  const slugRegex = /"slug":"([^"]+)"/g;
  const discoveredAt = new Date().toISOString();

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const match of normalized.matchAll(slugRegex)) {
    const slug = match[1];
    const index = match.index ?? 0;

    if (!slug || slug === "news") continue;
    if (!/^[a-z0-9-]+$/.test(slug)) continue;

    const blockStart = Math.max(0, index - 1200);
    const blockEnd = Math.min(normalized.length, index + 2200);
    const block = normalized.slice(blockStart, blockEnd);

    const title = findField(block, "title");
    const publicationDate = findField(block, "published_date");
    const resourceType = findField(block, "resource_type");
    const summary = findField(block, "summary");

    if (!title) continue;
    if (!publicationDate) continue;

    const key = `${slug}|${publicationDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      discovery_version: DISCOVERY_VERSION,
      institution_id: "SG_SINGSTAT",
      feed_id: "SINGSTAT_RELEASES",
      title: cleanText(title) ?? title,
      slug,
      url: buildUrl(slug),
      publication_date: publicationDate,
      resource_type: cleanText(resourceType),
      summary: cleanText(summary),
      discovered_at: discoveredAt,
    });
  }

  candidates.sort((a, b) => {
    const dateA = a.publication_date ?? "";
    const dateB = b.publication_date ?? "";
    return dateB.localeCompare(dateA);
  });

  await writeFile(outputPath, JSON.stringify(candidates, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        discovery_version: DISCOVERY_VERSION,
        input: inputPath,
        output: outputPath,
        candidates_discovered: candidates.length,
        first_candidate: candidates[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Document discovery failed:", error);
  process.exit(1);
});
