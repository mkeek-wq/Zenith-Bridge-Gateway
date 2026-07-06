import fs from "fs";
import path from "path";

const apiRoot = process.cwd();
const repoRoot = path.resolve(apiRoot, "../..");

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFilesRecursive(fullPath);
    }

    return [fullPath];
  });
}

function toRepoRelative(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function classifyCapability(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("replay")) return "replay";
  if (lower.includes("forecast") || lower.includes("prediction")) return "forecast";
  if (lower.includes("decision")) return "decision";
  if (lower.includes("histor") || lower.includes("case-history")) return "historian";
  if (lower.includes("macro")) return "macro";
  if (lower.includes("evidence")) return "evidence";
  if (lower.includes("mechanism")) return "mechanism";
  if (lower.includes("dataset") || lower.includes("singstat")) return "dataset";
  if (lower.includes("article") || lower.includes("cms") || lower.includes("publication")) return "article_publication";
  if (lower.includes("graph")) return "graph";
  if (lower.includes("governance") || lower.includes("audit") || lower.includes("readiness") || lower.includes("gate")) return "governance";
  if (lower.includes("experience") || lower.includes("learning") || lower.includes("memory")) return "learning_memory";

  return "other";
}

function summarizeByCapability(items: { capability: string }[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.capability] = (acc[item.capability] ?? 0) + 1;
    return acc;
  }, {});
}

const scriptsDir = path.join(apiRoot, "src/scripts");
const intelligenceDataDir = path.join(apiRoot, "data/intelligence");

const scriptFiles = listFilesRecursive(scriptsDir)
  .filter((file) => file.endsWith(".ts"))
  .sort();

const intelligenceFiles = listFilesRecursive(intelligenceDataDir)
  .filter((file) => file.endsWith(".json") || file.endsWith(".csv"))
  .sort();

const engines = scriptFiles.map((file) => {
  const name = path.basename(file);
  return {
    name,
    path: toRepoRelative(file),
    capability: classifyCapability(name),
  };
});

const packages = intelligenceFiles.map((file) => {
  const name = path.basename(file);
  return {
    name,
    path: toRepoRelative(file),
    capability: classifyCapability(name),
    extension: path.extname(file).replace(".", ""),
  };
});

const registry = {
  version: "intelligence-warehouse-registry-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "Read-only discovery registry for surfacing existing intelligence assets before H5.1 implementation.",
  scope: {
    api_root: apiRoot,
    repo_root: repoRoot,
    scripts_dir: "artifacts/api-server/src/scripts",
    intelligence_data_dir: "artifacts/api-server/data/intelligence",
  },
  summary: {
    engine_count: engines.length,
    intelligence_file_count: packages.length,
    engine_capability_counts: summarizeByCapability(engines),
    package_capability_counts: summarizeByCapability(packages),
  },
  capabilities: [
    "replay",
    "forecast",
    "decision",
    "historian",
    "macro",
    "evidence",
    "mechanism",
    "dataset",
    "article_publication",
    "graph",
    "governance",
    "learning_memory",
    "other",
  ],
  engines,
  packages,
  recommended_use:
    "The Intelligence Warehouse UI should consume this registry instead of hardcoded counts.",
};

const outputFileName = "intelligence-warehouse-registry-v0.1.json";

const outputPath = path.join(
  intelligenceDataDir,
  outputFileName
);

const runtimeOutputDir = "/var/www/zenith-admin/intelligence-data";
const runtimeOutputPath = path.join(runtimeOutputDir, outputFileName);

fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

if (fs.existsSync("/var/www/zenith-admin")) {
  fs.mkdirSync(runtimeOutputDir, { recursive: true });
  fs.copyFileSync(outputPath, runtimeOutputPath);
}

console.log({
  output: outputPath,
  runtime_output: fs.existsSync(runtimeOutputPath) ? runtimeOutputPath : null,
  engine_count: registry.summary.engine_count,
  intelligence_file_count: registry.summary.intelligence_file_count,
  engine_capability_counts: registry.summary.engine_capability_counts,
  package_capability_counts: registry.summary.package_capability_counts,
});
