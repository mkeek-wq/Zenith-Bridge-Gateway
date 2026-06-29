import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INVESTIGATION_DIR = "data/investigations";

const SEARCH_LIBRARY =
  "data/intelligence-driver-library/evidence-search-library-v0.1.json";

async function main() {
  const searchLibrary = JSON.parse(
    await readFile(SEARCH_LIBRARY, "utf8"),
  );

  const files = await readdir(INVESTIGATION_DIR);

  const hypothesisFiles = files.filter(
    (f) =>
      f.endsWith("-hypotheses-v0.1.json") &&
      !f.startsWith("undefined"),
  );

  let generated = 0;

  for (const file of hypothesisFiles) {
    const hypothesisPackage = JSON.parse(
      await readFile(
        path.join(INVESTIGATION_DIR, file),
        "utf8",
      ),
    );

    const searchPackages =
      hypothesisPackage.hypotheses.map(
        (hypothesis: any) => ({
          hypothesis_id: hypothesis.hypothesis_id,
          hypothesis_name: hypothesis.name,

          recommended_searches:
            searchLibrary.hypothesis_searches[
              hypothesis.hypothesis_id
            ] ?? [],
        }),
      );

    const output = {
      evidence_search_package_version:
        "evidence-search-package-v0.2",

      generated_at: new Date().toISOString(),

      case_id: hypothesisPackage.case_id,

      confidence:
        hypothesisPackage.confidence,

      search_packages: searchPackages,
    };

    const outputFile =
      `${hypothesisPackage.case_id}` +
      "-evidence-search-package-v0.2.json";

    await writeFile(
      path.join(
        INVESTIGATION_DIR,
        outputFile,
      ),
      JSON.stringify(output, null, 2),
      "utf8",
    );

    generated++;
  }

  console.log({
    evidence_search_package_version:
      "v0.2",
    files_generated: generated,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
