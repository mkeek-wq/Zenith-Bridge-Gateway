import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARCHIVE_VERSION = "document-archive-v0.1";
const MAX_DOCUMENTS_TO_ARCHIVE = 5;

const projectRoot = process.cwd();
const registryPath = path.join(projectRoot, "data", "document-registry", "latest.json");
const archiveRoot = path.join(projectRoot, "data", "document-archive");

type RegistryDocument = {
  registry_version: string;
  document_id: string;
  institution_id: string;
  feed_id: string;
  slug: string;
  url: string;
  title: string;
  publication_date: string | null;
  resource_type: string | null;
  summary: string | null;
  first_discovered_at: string;
  last_seen_at: string;
  status: "active";
};

type RegistryFile = {
  registry_version: string;
  generated_at: string;
  source_candidates_file: string;
  documents_total: number;
  documents: RegistryDocument[];
};

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

async function archiveDocument(document: RegistryDocument) {
  const fetchedAt = new Date();
  const timestamp = safeTimestamp(fetchedAt);

  const documentDir = path.join(archiveRoot, document.document_id);
  await mkdir(documentDir, { recursive: true });

  const response = await fetch(document.url, {
    headers: {
      "User-Agent": "ZNBW-Document-Archiver/0.1",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = await response.text();
  const contentHash = sha256(html);

  const metadata = {
    archive_version: ARCHIVE_VERSION,
    archived_at: fetchedAt.toISOString(),

    document_id: document.document_id,
    institution_id: document.institution_id,
    feed_id: document.feed_id,

    title: document.title,
    slug: document.slug,
    url: document.url,
    publication_date: document.publication_date,
    resource_type: document.resource_type,
    summary: document.summary,

    http_status: response.status,
    content_length: html.length,
    content_hash: contentHash,

    files: {
      latest_metadata: "metadata.json",
      latest_document_html: "document.html",
      timestamp_metadata: `${timestamp}-metadata.json`,
      timestamp_document_html: `${timestamp}-document.html`,
    },
  };

  await writeFile(path.join(documentDir, "document.html"), html, "utf8");
  await writeFile(path.join(documentDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

  await writeFile(path.join(documentDir, `${timestamp}-document.html`), html, "utf8");
  await writeFile(
    path.join(documentDir, `${timestamp}-metadata.json`),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );

  return metadata;
}

async function main() {
  await mkdir(archiveRoot, { recursive: true });

  const registryRaw = await readFile(registryPath, "utf8");
  const registry = JSON.parse(registryRaw) as RegistryFile;

  const documents = registry.documents.slice(0, MAX_DOCUMENTS_TO_ARCHIVE);

  const results = [];

  for (const document of documents) {
    try {
      const metadata = await archiveDocument(document);
      results.push({
        document_id: document.document_id,
        title: document.title,
        archive_status: "archived",
        http_status: metadata.http_status,
        content_length: metadata.content_length,
        content_hash: metadata.content_hash,
      });
    } catch (error) {
      results.push({
        document_id: document.document_id,
        title: document.title,
        archive_status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        archive_version: ARCHIVE_VERSION,
        registry_file: registryPath,
        archive_root: archiveRoot,
        documents_selected: documents.length,
        documents_archived: results.filter((item) => item.archive_status === "archived").length,
        documents_failed: results.filter((item) => item.archive_status === "failed").length,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Document archive failed:", error);
  process.exit(1);
});
