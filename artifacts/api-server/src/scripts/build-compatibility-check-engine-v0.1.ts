import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function validJson(relativePath: string | null): boolean {
  if (!relativePath) return true;

  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
    return true;
  } catch {
    return false;
  }
}

function fileExists(relativePath: string | null): boolean {
  if (!relativePath) return true;
  return fs.existsSync(path.join(ROOT, relativePath));
}

function normalizeStatus(status: string | undefined): string {
  if (!status) return "unknown";
  if (status === "operational") return "active";
  return status;
}

function getScriptPath(module: any): string | null {
  return (
    module.script_path ??
    module.path ??
    module.module_path ??
    module.file_path ??
    null
  );
}

function getOutputPath(module: any): string | null {
  return (
    module.output_path ??
    module.output ??
    module.expected_output_path ??
    null
  );
}

const registry =
  readJsonSafe(path.join(ROOT, "data/maintenance/module-registry-v0.1.json")) || {};

const modules: any[] =
  Array.isArray(registry.modules)
    ? registry.modules
    : Array.isArray(registry.registered_modules)
    ? registry.registered_modules
    : Array.isArray(registry.items)
    ? registry.items
    : [];

const moduleById = new Map(modules.map((m) => [m.module_id ?? m.id, m]));

const checks = modules.map((module) => {
  const moduleId = module.module_id ?? module.id;
  const moduleStatus = normalizeStatus(module.status);

  const scriptPath = getScriptPath(module);
  const outputPath = getOutputPath(module);

  const dependencyResults = (module.dependencies || []).map((depId: string) => {
    const dep = moduleById.get(depId);
    const depStatus = normalizeStatus(dep?.status);

    return {
      dependency_id: depId,
      found: Boolean(dep),
      active: depStatus === "active",
      status: !dep
        ? "missing_dependency"
        : depStatus === "active"
        ? "ok"
        : "dependency_not_active",
    };
  });

  const scriptExists = fileExists(scriptPath);
  const outputExists = fileExists(outputPath);
  const outputValidJson =
    outputPath && outputPath.endsWith(".json")
      ? validJson(outputPath)
      : true;

  const failedDependencies = dependencyResults.filter(
    (d: any) => d.status !== "ok"
  );

  const compatible =
    moduleStatus === "active" &&
    scriptExists &&
    outputExists &&
    outputValidJson &&
    failedDependencies.length === 0;

  return {
    module_id: moduleId,
    module_name: module.module_name ?? module.module_id ?? module.id,
    module_type: module.module_type ?? "unknown",
    version: module.version ?? null,
    risk_level: module.risk_level ?? module.risk ?? "medium",
    status: moduleStatus,
    script_path: scriptPath,
    script_exists: scriptExists,
    output_path: outputPath,
    output_exists: outputExists,
    output_valid_json: outputValidJson,
    dependency_results: dependencyResults,
    failed_dependencies: failedDependencies,
    compatibility_status: compatible ? "compatible" : "not_compatible",
  };
});

const criticalFailures = checks.filter(
  (c) => c.compatibility_status !== "compatible" && c.risk_level === "critical"
);

const highFailures = checks.filter(
  (c) => c.compatibility_status !== "compatible" && c.risk_level === "high"
);

const systemCompatibility =
  criticalFailures.length === 0 && highFailures.length === 0
    ? "compatible_for_standard_operations"
    : criticalFailures.length > 0
    ? "not_compatible_critical_failures"
    : "compatible_with_high_risk_warnings";

const output = {
  registry_version: "compatibility-check-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    compatibility_checks_dependencies_not_truth: true,
    broken_modules_should_block_major_runs: true,
    replay_requires_clean_compatibility: true,
    mixed_registry_schema_supported: true,
  },
  inputs: {
    modules_checked: modules.length,
  },
  summary: {
    compatible_modules: checks.filter(
      (c) => c.compatibility_status === "compatible"
    ).length,
    not_compatible_modules: checks.filter(
      (c) => c.compatibility_status !== "compatible"
    ).length,
    critical_failures: criticalFailures.length,
    high_failures: highFailures.length,
    system_compatibility: systemCompatibility,
  },
  checks,
};

ensureDir(path.join(ROOT, "data/maintenance"));

fs.writeFileSync(
  path.join(ROOT, "data/maintenance/compatibility-check-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/maintenance/compatibility-check-engine-v0.1.json",
});

console.table(
  checks.map((c) => ({
    module_id: c.module_id,
    compatible: c.compatibility_status,
    risk: c.risk_level,
    failed_deps: c.failed_dependencies.length,
  }))
);
