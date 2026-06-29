import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const evidencePath = path.join(
  projectRoot,
  "data",
  "evidence-v5",
  "latest.json",
);

function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9]+(?:\.[0-9]+)?%?/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const raw = await readFile(evidencePath, "utf8");
  const data = JSON.parse(raw);

  const evidence = data.evidence ?? [];

  const counts: Record<
    string,
    {
      count: number;
      example: string;
      source_title: string;
    }
  > = {};

  for (const record of evidence) {
    if (record.metric_name !== "UNCLASSIFIED_PERCENTAGE") {
      continue;
    }

    const phrase = normalizePhrase(record.evidence_window);

    if (!phrase) {
      continue;
    }

    if (!counts[phrase]) {
      counts[phrase] = {
        count: 0,
        example: record.evidence_window,
        source_title: record.source_title,
      };
    }

    counts[phrase].count += 1;
  }

  const discoveries = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 50)
    .map(([phrase, info]) => ({
      occurrences: info.count,
      phrase,
      source_title: info.source_title,
      example: info.example,
    }));

  console.log(
    JSON.stringify(
      {
        discovery_version: "metric-discovery-v0.1",
        unclassified_records_scanned: evidence.filter(
          (e: any) => e.metric_name === "UNCLASSIFIED_PERCENTAGE",
        ).length,
        candidate_phrases_found: discoveries.length,
        discoveries,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
