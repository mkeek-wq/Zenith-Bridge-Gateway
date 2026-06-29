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

const registry =
  readJsonSafe(path.join(ROOT, "data/maintenance/module-registry-v0.1.json")) || {};

const compatibility =
  readJsonSafe(path.join(ROOT, "data/maintenance/compatibility-check-engine-v0.1.json")) || {};

const modules: any[] = registry.modules || [];
const checks: any[] = compatibility.checks || [];

const activeModules = modules.filter((m) => m.status === "active");
const missingModules = modules.filter((m) => m.status === "missing");
const incompatibleChecks = checks.filter((c) => c.compatibility_status !== "compatible");

const safeToRunStandard =
  compatibility.summary?.system_compatibility === "compatible_for_standard_operations";

const safeToRunReplay =
  safeToRunStandard &&
  incompatibleChecks.length === 0 &&
  missingModules.filter((m) => ["critical", "high"].includes(m.risk_level)).length === 0;

const lines: string[] = [];

lines.push("# SMURF Maintenance Report v0.1");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## System Status");
lines.push("");
lines.push(`- Modules registered: ${registry.summary?.modules_registered ?? 0}`);
lines.push(`- Active modules: ${activeModules.length}`);
lines.push(`- Missing modules: ${missingModules.length}`);
lines.push(`- Compatible modules: ${compatibility.summary?.compatible_modules ?? 0}`);
lines.push(`- Not compatible modules: ${compatibility.summary?.not_compatible_modules ?? 0}`);
lines.push(`- System compatibility: ${compatibility.summary?.system_compatibility ?? "unknown"}`);
lines.push("");
lines.push("## Operational Gates");
lines.push("");
lines.push(`- Safe for standard operations: ${safeToRunStandard ? "YES" : "NO"}`);
lines.push(`- Safe to wake replay dragon: ${safeToRunReplay ? "YES" : "NO"}`);
lines.push("");
lines.push("## Missing Modules");
lines.push("");

if (missingModules.length) {
  for (const m of missingModules) {
    lines.push(`- ${m.module_id} | ${m.module_name} | risk: ${m.risk_level}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("## Incompatible Modules");
lines.push("");

if (incompatibleChecks.length) {
  for (const c of incompatibleChecks) {
    lines.push(`- ${c.module_id} | ${c.module_name} | risk: ${c.risk_level}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("## Maintenance Recommendation");
lines.push("");

if (safeToRunReplay) {
  lines.push("System is maintenance-compatible for standard operations and replay preparation.");
} else if (safeToRunStandard) {
  lines.push("System is compatible for standard operations, but replay should wait until all high/critical modules are clean.");
} else {
  lines.push("System is not ready for standard operations. Resolve critical or high module issues first.");
}

lines.push("");
lines.push("## Doctrine");
lines.push("");
lines.push("Stable core. Replaceable modules. Versioned outputs. Dependency visibility. Rollback before scale.");

const markdown = lines.join("\n");

const output = {
  registry_version: "maintenance-report-generator-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    maintenance_report_is_operational_not_analytical: true,
    replay_requires_clean_system_state: true,
    modules_should_be_replaceable: true,
    core_should_remain_stable: true,
  },
  summary: {
    safe_for_standard_operations: safeToRunStandard,
    safe_to_wake_replay_dragon: safeToRunReplay,
    active_modules: activeModules.length,
    missing_modules: missingModules.length,
    incompatible_modules: incompatibleChecks.length,
  },
  markdown,
};

ensureDir(path.join(ROOT, "data/maintenance"));
ensureDir(path.join(ROOT, "exports/maintenance-reports"));

fs.writeFileSync(
  path.join(ROOT, "data/maintenance/maintenance-report-generator-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/maintenance-reports/smurf-maintenance-report-v0.1.md"),
  markdown
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output_json: "data/maintenance/maintenance-report-generator-v0.1.json",
  output_markdown: "exports/maintenance-reports/smurf-maintenance-report-v0.1.md",
});

console.log("\n--- Maintenance Report Preview ---\n");
console.log(markdown);
