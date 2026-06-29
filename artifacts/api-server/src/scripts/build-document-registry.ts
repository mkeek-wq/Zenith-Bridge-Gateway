import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REGISTRY_VERSION = "document-registry-v0.1";

const projectRoot = process.cwd();
const candidatesPath = path.join(
  projectRoot,
  "data",
  "document-candidates",
  "singstat-latest-candidates.json",
);
const registryDir = path.join(projectRoot, "data", "document-registry");
const latestRegistryPath = path.join(registryDir, "latest.json");

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

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function buildDocumentId(candidate: Candidate): string {
  return `${candidate.institution_id}_${candidate.slug}`;
}

async function readExistingRegistry(): Promise<RegistryFile | null> {
  try {
    const raw = await readFile(latestRegistryPath, "utf8");
    return JSON.parse(raw) as RegistryFile;
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(registryDir, { recursive: true });

  const now = new Date();
  const generatedAt = now.toISOString();
  const timestamp = safeTimestamp(now);

  const candidatesRaw = await readFile(candidatesPath, "utf8");
  const candidates = JSON.parse(candidatesRaw) as Candidate[];

  const existingRegistry = await readExistingRegistry();
  const existingById = new Map<string, RegistryDocument>();

  for (const doc of existingRegistry?.documents ?? []) {
    existingById.set(doc.document_id, doc);
  }

  let documentsNew = 0;
  let documentsExisting = 0;

  const documents: RegistryDocument[] = candidates.map((candidate) => {
    const documentId = buildDocumentId(candidate);
    const existing = existingById.get(documentId);

    if (existing) {
      documentsExisting += 1;
    } else {
      documentsNew += 1;
    }

    return {
      registry_version: REGISTRY_VERSION,
      document_id: documentId,
      institution_id: candidate.institution_id,
      feed_id: candidate.feed_id,
      slug: candidate.slug,
      url: candidate.url,
      title: candidate.title,
      publication_date: candidate.publication_date,
      resource_type: candidate.resource_type,
      summary: candidate.summary,
      first_discovered_at: existing?.first_discovered_at ?? generatedAt,
      last_seen_at: generatedAt,
      status: "active",
    };
  });

  documents.sort((a, b) => {
    const dateA = a.publication_date ?? "";
    const dateB = b.publication_date ?? "";

    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.document_id.localeCompare(b.document_id);
  });

  const registry: RegistryFile = {
    registry_version: REGISTRY_VERSION,
    generated_at: generatedAt,
    source_candidates_file: candidatesPath,
    documents_total: documents.length,
    documents,
  };

  const timestampPath = path.join(registryDir, `${timestamp}.json`);

  await writeFile(latestRegistryPath, JSON.stringify(registry, null, 2), "utf8");
  await writeFile(timestampPath, JSON.stringify(registry, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        registry_version: REGISTRY_VERSION,
        source_candidates_file: candidatesPath,
        latest_registry_file: latestRegistryPath,
        timestamp_registry_file: timestampPath,
        documents_processed: candidates.length,
        documents_total: documents.length,
        documents_new: documentsNew,
        documents_existing: documentsExisting,
        first_document: documents[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Document registry build failed:", error);
  process.exit(1);
});
