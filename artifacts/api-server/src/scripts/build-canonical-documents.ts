import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CANONICAL_VERSION = "document-canonical-v0.1";

const projectRoot = process.cwd();
const registryPath = path.join(projectRoot, "data", "document-registry", "latest.json");
const classificationPath = path.join(projectRoot, "data", "document-classification", "latest.json");
const outputDir = path.join(projectRoot, "data", "document-canonical");
const latestOutputPath = path.join(outputDir, "latest.json");

type RegistryDocument = {
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
  documents_total: number;
  documents: RegistryDocument[];
};

type ClassificationRecord = {
  document_id: string;
  archive_type: string;
  redirect_url: string | null;
};

type ClassificationFile = {
  records: ClassificationRecord[];
};

type CanonicalDocument = {
  canonical_version: string;
  canonical_document_id: string;
  canonical_basis: "redirect_url" | "self_url";

  originating_authority: string;
  canonical_url: string;

  primary_document_id: string;
  title: string;
  publication_date: string | null;
  resource_type: string | null;

  discovered_documents: Array<{
    document_id: string;
    publishing_institution: string;
    feed_id: string;
    url: string;
    archive_type: string | null;
    redirect_url: string | null;
  }>;

  duplicate_count: number;
};

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function authorityFromUrl(url: string): string {
  const lower = url.toLowerCase();

  if (lower.includes("mas.gov.sg")) return "SG_MAS";
  if (lower.includes("edb.gov.sg")) return "SG_EDB";
  if (lower.includes("mti.gov.sg")) return "SG_MTI";
  if (lower.includes("mom.gov.sg")) return "SG_MOM";
  if (lower.includes("iras.gov.sg")) return "SG_IRAS";
  if (lower.includes("acra.gov.sg")) return "SG_ACRA";
  if (lower.includes("enterprisesg.gov.sg")) return "SG_ENTERPRISESG";
  if (lower.includes("singstat.gov.sg")) return "SG_SINGSTAT";

  return "UNKNOWN_AUTHORITY";
}

function normalizeUrl(url: string): string {
  return url
    .replace(/\\+$/g, "")
    .replace(/\/+$/g, "")
    .trim();
}

function buildCanonicalId(authority: string, url: string): string {
  const normalized = normalizeUrl(url);
  const slug = normalized.split("/").filter(Boolean).at(-1) ?? "unknown";
  return `${authority}_${slug}`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const generatedAtDate = new Date();
  const generatedAt = generatedAtDate.toISOString();
  const timestamp = safeTimestamp(generatedAtDate);

  const registry = JSON.parse(await readFile(registryPath, "utf8")) as RegistryFile;
  const classification = JSON.parse(await readFile(classificationPath, "utf8")) as ClassificationFile;

  const classificationById = new Map<string, ClassificationRecord>();
  for (const record of classification.records ?? []) {
    classificationById.set(record.document_id, record);
  }

  const grouped = new Map<string, CanonicalDocument>();

  for (const document of registry.documents) {
    const classificationRecord = classificationById.get(document.document_id);
    const redirectUrl = classificationRecord?.redirect_url
      ? normalizeUrl(classificationRecord.redirect_url)
      : null;

    const canonicalUrl = redirectUrl ?? normalizeUrl(document.url);
    const canonicalBasis = redirectUrl ? "redirect_url" : "self_url";
    const originatingAuthority = authorityFromUrl(canonicalUrl);
    const canonicalDocumentId = buildCanonicalId(originatingAuthority, canonicalUrl);

    const existing = grouped.get(canonicalDocumentId);

    const discovered = {
      document_id: document.document_id,
      publishing_institution: document.institution_id,
      feed_id: document.feed_id,
      url: document.url,
      archive_type: classificationRecord?.archive_type ?? null,
      redirect_url: redirectUrl,
    };

    if (!existing) {
      grouped.set(canonicalDocumentId, {
        canonical_version: CANONICAL_VERSION,
        canonical_document_id: canonicalDocumentId,
        canonical_basis: canonicalBasis,
        originating_authority: originatingAuthority,
        canonical_url: canonicalUrl,
        primary_document_id: document.document_id,
        title: document.title,
        publication_date: document.publication_date,
        resource_type: document.resource_type,
        discovered_documents: [discovered],
        duplicate_count: 0,
      });
    } else {
      existing.discovered_documents.push(discovered);
      existing.duplicate_count = existing.discovered_documents.length - 1;
    }
  }

  const canonical_documents = [...grouped.values()].sort((a, b) => {
    const dateA = a.publication_date ?? "";
    const dateB = b.publication_date ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.canonical_document_id.localeCompare(b.canonical_document_id);
  });

  const output = {
    canonical_version: CANONICAL_VERSION,
    generated_at: generatedAt,
    source_registry_file: registryPath,
    source_classification_file: classificationPath,
    registry_documents_total: registry.documents.length,
    canonical_documents_total: canonical_documents.length,
    duplicates_detected_total: canonical_documents.reduce(
      (sum, item) => sum + item.duplicate_count,
      0,
    ),
    authority_counts: canonical_documents.reduce<Record<string, number>>((acc, item) => {
      acc[item.originating_authority] = (acc[item.originating_authority] ?? 0) + 1;
      return acc;
    }, {}),
    canonical_documents,
  };

  const timestampOutputPath = path.join(outputDir, `${timestamp}.json`);

  await writeFile(latestOutputPath, JSON.stringify(output, null, 2), "utf8");
  await writeFile(timestampOutputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        canonical_version: CANONICAL_VERSION,
        latest_output_file: latestOutputPath,
        timestamp_output_file: timestampOutputPath,
        registry_documents_total: output.registry_documents_total,
        canonical_documents_total: output.canonical_documents_total,
        duplicates_detected_total: output.duplicates_detected_total,
        authority_counts: output.authority_counts,
        first_canonical_document: canonical_documents[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Canonical document build failed:", error);
  process.exit(1);
});
