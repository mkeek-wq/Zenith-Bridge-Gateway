import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MONITORING_RUN_VERSION = "monitoring-run-v0.4";

const feed = {
  institution_id: "SG_SINGSTAT",
  feed_id: "SINGSTAT_RELEASES",
  authority_id: "A100",
  url: "https://www.singstat.gov.sg/news",
};

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "data", "monitoring-runs");

function safeTimestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readPreviousLatest(): Promise<any | null> {
  try {
    const latestPath = path.join(outputDir, "latest.json");
    const raw = await readFile(latestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const observedAt = new Date();
  const timestamp = safeTimestamp(observedAt);

  const previous = await readPreviousLatest();

  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": "ZNBW-Intelligence-Monitor/0.4",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = await response.text();
  const contentHash = sha256(html);

  const previousHash = previous?.content_hash ?? null;
  const firstObservation = previousHash === null;
  const changeDetected = !firstObservation && previousHash !== contentHash;

  const run = {
    monitoring_run_version: MONITORING_RUN_VERSION,
    run_status: changeDetected ? "completed_change_detected" : "completed_no_change",
    observed_at: observedAt.toISOString(),

    institution_id: feed.institution_id,
    feed_id: feed.feed_id,
    authority_id: feed.authority_id,
    url: feed.url,

    http_status: response.status,
    content_length: html.length,
    content_hash: contentHash,

    previous_content_hash: previousHash,
    first_observation: firstObservation,
    change_detected: changeDetected,

    snapshot_files: {
      latest_json: "latest.json",
      latest_content_html: "latest-content.html",
      timestamp_json: `${timestamp}.json`,
      timestamp_content_html: `${timestamp}-content.html`,
    },

    documents_discovered: 0,
    documents_new: 0,
    documents_updated: 0,
  };

  await writeFile(
    path.join(outputDir, `${timestamp}.json`),
    JSON.stringify(run, null, 2),
    "utf8",
  );

  await writeFile(
    path.join(outputDir, "latest.json"),
    JSON.stringify(run, null, 2),
    "utf8",
  );

  await writeFile(path.join(outputDir, `${timestamp}-content.html`), html, "utf8");
  await writeFile(path.join(outputDir, "latest-content.html"), html, "utf8");

  console.log(JSON.stringify(run, null, 2));
}

main().catch((error) => {
  console.error("Monitoring run failed:", error);
  process.exit(1);
});
