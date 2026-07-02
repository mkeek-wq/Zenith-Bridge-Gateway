import { readFile, writeFile } from "node:fs/promises";

const EVIDENCE_INPUT =
  "data/investigations/m355381-evidence-packages-v0.1.json";

const DOCUMENT_INPUT =
  "data/document-candidates/singstat-latest-candidates.json";

const OUTPUT =
  "data/investigations/m355381-internal-evidence-v0.1.json";

function normalize(text: string): string {
  return text.toLowerCase();
}

function scoreMatch(
  seriesName: string,
  title: string,
): number {
  const s = normalize(seriesName);
  const t = normalize(title);

  let score = 0;

  const words = s
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const w of words) {
    if (w.length < 4) continue;

    if (t.includes(w)) {
      score += 1;
    }
  }

  return score;
}

async function main() {
  const evidence = JSON.parse(
    await readFile(EVIDENCE_INPUT, "utf8"),
  );

  const docs = JSON.parse(
    await readFile(DOCUMENT_INPUT, "utf8"),
  );

  const packages = evidence.evidence_packages.map(
    (pkg: any) => {
      const matches = docs
        .map((d: any) => ({
          publication_date:
            d.publication_date,

          title:
            d.title,

          score:
            scoreMatch(
              pkg.series_name,
              d.title || "",
            ),
        }))
        .filter((m: any) => m.score > 0)
        .sort(
          (a: any, b: any) =>
            b.score - a.score,
        )
        .slice(0, 10);

      return {
        series_no:
          pkg.series_no,

        series_name:
          pkg.series_name,

        internal_evidence_count:
          matches.length,

        internal_evidence:
          matches,

        external_search_required:
          matches.length < 3,
      };
    },
  );

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        evidence_collection_version:
          "internal-evidence-v0.1",

        generated_at:
          new Date().toISOString(),

        packages,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        packages_processed:
          packages.length,
      },
      null,
      2,
    ),
  );
}

main().catch(console.error);
