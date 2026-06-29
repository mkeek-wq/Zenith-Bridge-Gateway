import { readFile, writeFile } from "node:fs/promises";

const INPUT =
  "data/investigations/m355381-internal-evidence-v0.1.json";

const OUTPUT =
  "data/investigations/m355381-evidence-relevance-v0.1.json";

const POSITIVE = [
  "manufacturing",
  "industrial",
  "production",
  "output",
  "electronics",
  "semiconductor",
  "cluster",
  "factory",
  "industry",
  "edb",
];

const NEGATIVE = [
  "consumer price",
  "cpi",
  "inflation",
  "household",
  "retail sales",
  "housing",
  "property",
  "income",
  "population",
];

function scoreTitle(title: string) {
  const t = title.toLowerCase();

  let score = 0;

  for (const p of POSITIVE) {
    if (t.includes(p)) score += 2;
  }

  for (const n of NEGATIVE) {
    if (t.includes(n)) score -= 5;
  }

  return score;
}

async function main() {
  const input = JSON.parse(
    await readFile(INPUT, "utf8")
  );

  const packages = input.packages.map((pkg: any) => {
    const ranked = pkg.internal_evidence
      .map((e: any) => ({
        ...e,
        relevance_score: scoreTitle(e.title),
      }))
      .filter((e: any) => e.relevance_score > 0)
      .sort(
        (a: any, b: any) =>
          b.relevance_score - a.relevance_score
      );

    return {
      ...pkg,

      relevant_evidence_count:
        ranked.length,

      relevant_evidence:
        ranked,

      evidence_quality:
        ranked.length === 0
          ? "poor"
          : ranked.length < 3
          ? "limited"
          : "good",
    };
  });

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        relevance_version:
          "evidence-relevance-v0.1",

        generated_at:
          new Date().toISOString(),

        packages,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        packages_processed:
          packages.length,
      },
      null,
      2
    )
  );
}

main().catch(console.error);
