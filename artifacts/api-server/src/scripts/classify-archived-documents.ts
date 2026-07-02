import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CLASSIFICATION_VERSION = "document-classification-v0.1";

const projectRoot = process.cwd();
const archiveRoot = path.join(projectRoot, "data", "document-archive");
const outputDir = path.join(projectRoot, "data", "document-classification");
const latestOutputPath = path.join(outputDir, "latest.json");

type ArchiveMetadata = {
  archive_version: string;
  archived_at: string;
  document_id: string;
  institution_id: string;
  feed_id: string;
  title: string;
  slug: string;
  url: string;
  publication_date: string | null;
  resource_type: string | null;
  summary: string | null;
  http_status: number;
  content_length: number;
  content_hash: string;
};

type ArchiveType = "embedded_content" | "redirect" | "pdf" | "unknown";

type ClassificationRecord = {
  classification_version: string;
  classified_at: string;
  document_id: string;
  institution_id: string;
  feed_id: string;
  title: string;
  url: string;
  publication_date: string | null;
  archive_type: ArchiveType;
  redirect_url: string | null;
  confidence: "high" | "medium" | "low";
  signals: string[];
};

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function extractRedirectUrl(html: string): string | null {
  const redirectMatch =
    html.match(/"redirectUrl":"([^"]+)"/) ??
    html.match(/\\"redirectUrl\\":\\"([^"]+)/) ??
    html.match(/"redirect_link_field":"([^"]+)"/) ??
    html.match(/\\"redirect_link_field\\":\\"([^"]+)/);

  if (!redirectMatch?.[1]) return null;

  return redirectMatch[1]
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .trim();
}

function classifyHtml(html: string, metadata: ArchiveMetadata): {
  archive_type: ArchiveType;
  redirect_url: string | null;
  confidence: "high" | "medium" | "low";
  signals: string[];
} {
  const signals: string[] = [];
  const redirectUrl = extractRedirectUrl(html);

  if (redirectUrl) {
    signals.push("redirect_url_found");
    return {
      archive_type: "redirect",
      redirect_url: redirectUrl,
      confidence: "high",
      signals,
    };
  }

  if (metadata.url.toLowerCase().endsWith(".pdf")) {
    signals.push("url_ends_with_pdf");
    return {
      archive_type: "pdf",
      redirect_url: null,
      confidence: "high",
      signals,
    };
  }

  if (
    html.includes('"content":') ||
    html.includes('\\"content\\":') ||
    html.includes("placeholder-main") ||
    html.includes("serverDisplayTitle")
  ) {
    signals.push("nextjs_payload_or_content_markers_found");
    return {
      archive_type: "embedded_content",
      redirect_url: null,
      confidence: "medium",
      signals,
    };
  }

  signals.push("no_known_content_markers_found");

  return {
    archive_type: "unknown",
    redirect_url: null,
    confidence: "low",
    signals,
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const classifiedAt = new Date();
  const timestamp = safeTimestamp(classifiedAt);

  const documentDirs = await readdir(archiveRoot, { withFileTypes: true });
  const records: ClassificationRecord[] = [];

  for (const dirent of documentDirs) {
    if (!dirent.isDirectory()) continue;

    const documentDir = path.join(archiveRoot, dirent.name);
    const metadataPath = path.join(documentDir, "metadata.json");
    const documentPath = path.join(documentDir, "document.html");

    try {
      const metadataRaw = await readFile(metadataPath, "utf8");
      const html = await readFile(documentPath, "utf8");
      const metadata = JSON.parse(metadataRaw) as ArchiveMetadata;

      const classification = classifyHtml(html, metadata);

      records.push({
        classification_version: CLASSIFICATION_VERSION,
        classified_at: classifiedAt.toISOString(),
        document_id: metadata.document_id,
        institution_id: metadata.institution_id,
        feed_id: metadata.feed_id,
        title: metadata.title,
        url: metadata.url,
        publication_date: metadata.publication_date,
        archive_type: classification.archive_type,
        redirect_url: classification.redirect_url,
        confidence: classification.confidence,
        signals: classification.signals,
      });
    } catch (error) {
      records.push({
        classification_version: CLASSIFICATION_VERSION,
        classified_at: classifiedAt.toISOString(),
        document_id: dirent.name,
        institution_id: "unknown",
        feed_id: "unknown",
        title: "unknown",
        url: "unknown",
        publication_date: null,
        archive_type: "unknown",
        redirect_url: null,
        confidence: "low",
        signals: [
          `classification_failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      });
    }
  }

  records.sort((a, b) => {
    const dateA = a.publication_date ?? "";
    const dateB = b.publication_date ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.document_id.localeCompare(b.document_id);
  });

  const output = {
    classification_version: CLASSIFICATION_VERSION,
    generated_at: classifiedAt.toISOString(),
    archive_root: archiveRoot,
    documents_classified: records.length,
    counts: {
      embedded_content: records.filter((item) => item.archive_type === "embedded_content").length,
      redirect: records.filter((item) => item.archive_type === "redirect").length,
      pdf: records.filter((item) => item.archive_type === "pdf").length,
      unknown: records.filter((item) => item.archive_type === "unknown").length,
    },
    records,
  };

  const timestampOutputPath = path.join(outputDir, `${timestamp}.json`);

  await writeFile(latestOutputPath, JSON.stringify(output, null, 2), "utf8");
  await writeFile(timestampOutputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        classification_version: CLASSIFICATION_VERSION,
        latest_output_file: latestOutputPath,
        timestamp_output_file: timestampOutputPath,
        documents_classified: output.documents_classified,
        counts: output.counts,
        first_record: records[0] ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Document classification failed:", error);
  process.exit(1);
});
