import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SCRIPT_DIR = path.join(ROOT, "src/scripts");
const OUTPUT_PATH = path.join(
  ROOT,
  "data/intelligence/dependency-registry-v0.1.json"
);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile() && /\.(ts|js|mjs)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function unique(values: string[]) {
  return [...new Set(values)].sort();
}

function extractIntelligencePaths(source: string): string[] {
  const matches = source.match(/data\/intelligence\/[^"'`\s,)]+/g) ?? [];
  return unique(matches.map((m) => m.replace(/[;,.]+$/, "")));
}

function classifyEcosystem(scriptName: string): string {
  const name = scriptName.toLowerCase();

  if (name.includes("replay")) return "replay";
  if (name.includes("forecast")) return "forecast";
  if (name.includes("decision")) return "decision";
  if (name.includes("evidence")) return "evidence";
  if (name.includes("mechanism")) return "mechanism";
  if (name.includes("article") || name.includes("publication") || name.includes("cms")) return "article_publication";
  if (name.includes("dataset") || name.includes("singstat")) return "dataset";
  if (name.includes("macro") || name.includes("sector")) return "macro";
  if (name.includes("graph")) return "graph";
  if (name.includes("registry")) return "registry";
  return "general";
}

const scriptFiles = walk(SCRIPT_DIR);

const scripts = scriptFiles.map((filePath) => {
  const relativeScriptPath = path.relative(ROOT, filePath);
  const scriptName = path.basename(filePath);
  const source = fs.readFileSync(filePath, "utf8");

  const intelligencePaths = extractIntelligencePaths(source);

  const writes = unique(
    intelligencePaths.filter((p) => {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const writePattern = new RegExp(`writeFileSync\\([^\\n]*${escaped}`);
      const outputConstPattern = new RegExp(
        `(OUTPUT|OUTPUT_PATH|OUTPUT_FILE|outPath|outputPath)[^\\n]*${escaped}`
      );

      return writePattern.test(source) || outputConstPattern.test(source);
    })
  );

  const reads = unique(intelligencePaths.filter((p) => !writes.includes(p)));

  return {
    script_name: scriptName,
    script_path: relativeScriptPath,
    ecosystem: classifyEcosystem(scriptName),
    reads,
    writes,
    read_count: reads.length,
    write_count: writes.length,
  };
});

const producers = new Map<string, string[]>();
const consumers = new Map<string, string[]>();

for (const script of scripts) {
  for (const output of script.writes) {
    producers.set(output, [...(producers.get(output) ?? []), script.script_name]);
  }

  for (const input of script.reads) {
    consumers.set(input, [...(consumers.get(input) ?? []), script.script_name]);
  }
}

const scriptsWithGraph = scripts.map((script) => {
  const upstreamScripts = unique(
    script.reads.flatMap((input) => producers.get(input) ?? [])
  ).filter((name) => name !== script.script_name);

  const downstreamScripts = unique(
    script.writes.flatMap((output) => consumers.get(output) ?? [])
  ).filter((name) => name !== script.script_name);

  return {
    ...script,
    upstream_scripts: upstreamScripts,
    downstream_scripts: downstreamScripts,
    fan_in: upstreamScripts.length,
    fan_out: downstreamScripts.length,
  };
});

const allPackages = unique([
  ...Array.from(producers.keys()),
  ...Array.from(consumers.keys()),
]);

const packages = allPackages.map((packagePath) => ({
  package_path: packagePath,
  producers: unique(producers.get(packagePath) ?? []),
  consumers: unique(consumers.get(packagePath) ?? []),
  producer_count: unique(producers.get(packagePath) ?? []).length,
  consumer_count: unique(consumers.get(packagePath) ?? []).length,
  status:
    fs.existsSync(path.join(ROOT, packagePath))
      ? "exists"
      : "referenced_missing",
}));

const output = {
  registry_version: "dependency-registry-v0.1",
  generated_at: new Date().toISOString(),
  doctrine: {
    dependencies_are_inferred_from_filesystem_references: true,
    registry_is_discovery_not_truth: true,
    manual_module_registry_remains_authoritative_for_curated_modules: true,
    dependency_visibility_precedes_orchestration: true,
  },
  inputs: {
    script_directory: "src/scripts",
    scripts_scanned: scriptFiles.length,
  },
  summary: {
    scripts_scanned: scriptFiles.length,
    scripts_with_reads: scriptsWithGraph.filter((s) => s.read_count > 0).length,
    scripts_with_writes: scriptsWithGraph.filter((s) => s.write_count > 0).length,
    packages_referenced: packages.length,
    packages_with_producers: packages.filter((p) => p.producer_count > 0).length,
    packages_with_consumers: packages.filter((p) => p.consumer_count > 0).length,
    orphan_outputs: packages.filter(
      (p) => p.producer_count > 0 && p.consumer_count === 0
    ).length,
    referenced_missing_packages: packages.filter(
      (p) => p.status === "referenced_missing"
    ).length,
  },
  ecosystems: Object.fromEntries(
    unique(scriptsWithGraph.map((s) => s.ecosystem)).map((ecosystem) => [
      ecosystem,
      scriptsWithGraph.filter((s) => s.ecosystem === ecosystem).length,
    ])
  ),
  scripts: scriptsWithGraph,
  packages,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  output: "data/intelligence/dependency-registry-v0.1.json",
  summary: output.summary,
});
