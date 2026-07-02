import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REGISTRY_PATH =
  "data/maintenance/module-registry-v0.1.json";

const MODULES_TO_ADD = [
  {
    module_id: "macro-driver-concentration-engine-v0.1",
    module_type: "diagnostic_engine",
    layer: "macro_governance",
    path: "src/scripts/build-macro-driver-concentration-engine-v0.1.ts",
    output: "data/intelligence/macro-driver-concentration-engine-v0.1.json",
    status: "operational",
    governance_role:
      "Detects macro drivers that appear across too many replay cases.",
  },
  {
    module_id: "macro-driver-concentration-report-v0.1",
    module_type: "report_generator",
    layer: "macro_governance",
    path: "src/scripts/build-macro-driver-concentration-report-v0.1.ts",
    output: "exports/macro-reports/macro-driver-concentration-report-v0.1.md",
    status: "operational",
    governance_role:
      "Summarizes concentration risks in broad macro drivers.",
  },
  {
    module_id: "driver-diversity-engine-v0.1",
    module_type: "diagnostic_engine",
    layer: "macro_governance",
    path: "src/scripts/build-driver-diversity-engine-v0.1.ts",
    output: "data/intelligence/driver-diversity-engine-v0.1.json",
    status: "operational",
    governance_role:
      "Checks whether replay cases rely on sufficiently diverse macro drivers.",
  },
  {
    module_id: "driver-diversity-report-v0.1",
    module_type: "report_generator",
    layer: "macro_governance",
    path: "src/scripts/build-driver-diversity-report-v0.1.ts",
    output: "exports/macro-reports/driver-diversity-report-v0.1.md",
    status: "operational",
    governance_role:
      "Summarizes driver diversity weaknesses and replay hardening needs.",
  },
  {
    module_id: "macro-specificity-hardening-queue-v0.1",
    module_type: "hardening_queue",
    layer: "macro_governance",
    path: "src/scripts/build-macro-specificity-hardening-queue-v0.1.ts",
    output: "data/intelligence/macro-specificity-hardening-queue-v0.1.json",
    status: "operational",
    governance_role:
      "Converts driver diversity weaknesses into actionable hardening tasks.",
  },
  {
    module_id: "macro-specificity-hardening-report-v0.1",
    module_type: "report_generator",
    layer: "macro_governance",
    path: "src/scripts/build-macro-specificity-hardening-report-v0.1.ts",
    output: "exports/macro-reports/macro-specificity-hardening-report-v0.1.md",
    status: "operational",
    governance_role:
      "Produces a readable hardening report for macro specificity improvements.",
  },
];

function main() {
  const registryAbs = path.join(ROOT, REGISTRY_PATH);

  if (!fs.existsSync(registryAbs)) {
    throw new Error(`Missing registry: ${REGISTRY_PATH}`);
  }

  const registry = JSON.parse(fs.readFileSync(registryAbs, "utf8"));

  const moduleArray =
    Array.isArray(registry.modules)
      ? registry.modules
      : Array.isArray(registry.registered_modules)
      ? registry.registered_modules
      : Array.isArray(registry.items)
      ? registry.items
      : null;

  if (!moduleArray) {
    throw new Error(
      `Could not find module array. Top-level keys: ${Object.keys(registry).join(", ")}`
    );
  }

  const existingIds = new Set(
    moduleArray.map((m: any) => m.module_id ?? m.id).filter(Boolean)
  );

  let added = 0;

  for (const mod of MODULES_TO_ADD) {
    if (existingIds.has(mod.module_id)) continue;
    moduleArray.push(mod);
    added++;
  }

  registry.updated_at = new Date().toISOString();
  registry.modules_registered =
    moduleArray.length;

  fs.writeFileSync(registryAbs, JSON.stringify(registry, null, 2));

  console.log({
    registry: REGISTRY_PATH,
    added,
    total_modules: moduleArray.length,
  });
}

main();
