import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CASE_DIR = "data/cases";

const DRIVER_LIBRARY =
  "data/intelligence-driver-library/manufacturing-driver-library-v0.1.json";

const OUTPUT_DIR = "data/investigations";

function buildHypotheses(caseFile: any, drivers: any[]) {
  const yoy =
    Math.abs(caseFile.observation?.year_on_year_change_pct ?? 0);

  const hypotheses: any[] = [];

  if (yoy >= 100) {
    hypotheses.push(
      drivers.find((d) => d.driver_id === "MKT_001"),
      drivers.find((d) => d.driver_id === "OPS_001"),
      drivers.find((d) => d.driver_id === "MKT_002"),
    );
  } else if (yoy >= 50) {
    hypotheses.push(
      drivers.find((d) => d.driver_id === "MKT_001"),
      drivers.find((d) => d.driver_id === "PORT_001"),
    );
  } else {
    hypotheses.push(
      drivers.find((d) => d.driver_id === "PORT_001"),
    );
  }

  return hypotheses
    .filter(Boolean)
    .map((driver) => ({
      hypothesis_id: driver.driver_id,
      name: driver.name,
      bucket: driver.bucket,
      status: "candidate",
      reason:
        `Generated from manufacturing driver library based on YoY movement (${yoy.toFixed(2)}%).`,
    }));
}

async function main() {
  const library = JSON.parse(
    await readFile(DRIVER_LIBRARY, "utf8"),
  );

  const files = await readdir(CASE_DIR);

  const caseFiles = files.filter(
    (f) => f.startsWith("case-SG-") && f.endsWith(".json"),
  );

  let generated = 0;

  for (const file of caseFiles) {
    const caseFile = JSON.parse(
      await readFile(path.join(CASE_DIR, file), "utf8"),
    );

    const hypotheses = buildHypotheses(
      caseFile,
      library.drivers,
    );

    const output = {
      hypothesis_version: "hypothesis-engine-v0.1",
      generated_at: new Date().toISOString(),

      case_id: caseFile.case_id,

      observation: caseFile.observation,

      confidence: caseFile.confidence,

      hypotheses,
    };

    await writeFile(
      path.join(
        OUTPUT_DIR,
        `${caseFile.case_id}-hypotheses-v0.1.json`,
      ),
      JSON.stringify(output, null, 2),
      "utf8",
    );

    generated++;
  }

  console.log({
    hypothesis_engine_version: "v0.1",
    files_generated: generated,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
