import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const registryPath = path.join(
  apiRoot,
  "data/replay/cases/replay-historical-case-registry-v0.1.json"
);

const taxonomyPath = path.join(
  apiRoot,
  "data/replay/taxonomy/replay-mechanism-taxonomy-v0.1.json"
);

const outputDir = path.join(apiRoot, "data/replay/coverage");
fs.mkdirSync(outputDir, { recursive: true });

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

const cases = registry.cases ?? [];
const families = taxonomy.families ?? [];

const outputFamilies = families.map((family: any) => {
  const familyMechanisms = new Set(family.mechanisms ?? []);

  const matchingCases = cases.filter((c: any) =>
    (c.mechanisms ?? []).some((m: string) => familyMechanisms.has(m))
  );

  const mechanismsFound = new Set<string>();

  for (const c of matchingCases) {
    for (const m of c.mechanisms ?? []) {
      if (familyMechanisms.has(m)) mechanismsFound.add(m);
    }
  }

  return {
    family_id: family.family_id,
    label: family.label,
    case_count: matchingCases.length,
    mechanism_count: mechanismsFound.size,
    expected_mechanism_count: familyMechanisms.size,
    coverage_ratio: Number((mechanismsFound.size / Math.max(familyMechanisms.size, 1)).toFixed(3)),
    cases: matchingCases.map((c: any) => c.case_id)
  };
});

const output = {
  version: "replay-mechanism-taxonomy-coverage-v0.1",
  generated_at: new Date().toISOString(),
  historical_case_count: cases.length,
  family_count: outputFamilies.length,
  families: outputFamilies
};

const outputPath = path.join(
  outputDir,
  "replay-mechanism-taxonomy-coverage-v0.1.json"
);

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  taxonomy_coverage: output.version,
  historical_case_count: output.historical_case_count,
  family_count: output.family_count,
  output: outputPath
});
