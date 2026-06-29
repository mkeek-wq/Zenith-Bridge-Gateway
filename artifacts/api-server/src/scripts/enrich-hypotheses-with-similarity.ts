import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INVESTIGATION_DIR = "data/investigations";
const SIMILARITY_FILE = "data/intelligence/case-similarity-v0.1.json";

const TOP_N = 5;

async function main() {
  const similarityData = JSON.parse(
    await readFile(SIMILARITY_FILE, "utf8"),
  );

  const similarityByCase = new Map(
    similarityData.similarities.map((item: any) => [
      item.case_id,
      item.similar_cases.slice(0, TOP_N),
    ]),
  );

  const files = await readdir(INVESTIGATION_DIR);

  const hypothesisFiles = files
    .filter((file) => file.endsWith("-hypotheses-v0.1.json"))
    .filter((file) => !file.startsWith("undefined"))
    .sort();

  let enriched = 0;

  for (const file of hypothesisFiles) {
    const inputPath = path.join(INVESTIGATION_DIR, file);

    const hypothesisPackage = JSON.parse(
      await readFile(inputPath, "utf8"),
    );

    const similarCases =
      similarityByCase.get(hypothesisPackage.case_id) ?? [];

    const output = {
      hypothesis_version: "hypothesis-engine-v0.2",
      generated_at: new Date().toISOString(),

      source_hypothesis_file: inputPath,
      source_similarity_file: SIMILARITY_FILE,

      case_id: hypothesisPackage.case_id,
      observation: hypothesisPackage.observation,
      confidence: hypothesisPackage.confidence,

      similar_cases: similarCases,

      hypotheses: hypothesisPackage.hypotheses,
    };

    const outputFile = file.replace(
      "-hypotheses-v0.1.json",
      "-hypotheses-v0.2.json",
    );

    await writeFile(
      path.join(INVESTIGATION_DIR, outputFile),
      JSON.stringify(output, null, 2),
      "utf8",
    );

    enriched++;
  }

  console.log({
    hypothesis_enrichment_version: "hypothesis-engine-v0.2",
    files_enriched: enriched,
    top_similar_cases_per_file: TOP_N,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
