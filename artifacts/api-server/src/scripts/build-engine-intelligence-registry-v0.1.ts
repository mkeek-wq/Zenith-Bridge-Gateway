import fs from "fs";
import path from "path";

type DependencyScript = {
  script_name: string;
  script_path: string;
  ecosystem: string;
  reads: string[];
  writes: string[];
  read_count: number;
  write_count: number;
  upstream_scripts: string[];
  downstream_scripts: string[];
  fan_in: number;
  fan_out: number;
};

type DependencyRegistry = {
  registry_version: string;
  generated_at: string;
  scripts: DependencyScript[];
};

type WarehouseEngine = {
  name: string;
  path: string;
  capability: string;
};

type WarehouseRegistry = {
  version: string;
  generated_at: string;
  engines: WarehouseEngine[];
};

const ROOT = process.cwd();
const INTELLIGENCE_DIR = path.join(ROOT, "data/intelligence");

const DEPENDENCY_REGISTRY_PATH = path.join(
  INTELLIGENCE_DIR,
  "dependency-registry-v0.1.json"
);

const WAREHOUSE_REGISTRY_PATH = path.join(
  INTELLIGENCE_DIR,
  "intelligence-warehouse-registry-v0.1.json"
);

const OUTPUT_FILE_NAME = "engine-intelligence-registry-v0.1.json";
const OUTPUT_PATH = path.join(INTELLIGENCE_DIR, OUTPUT_FILE_NAME);

const RUNTIME_OUTPUT_DIR = "/var/www/zenith-admin/intelligence-data";
const RUNTIME_OUTPUT_PATH = path.join(RUNTIME_OUTPUT_DIR, OUTPUT_FILE_NAME);

const surfacedScripts = new Set([
  "build-article-workbench-package-v0.2.ts",
  "build-openai-article-package-v0.4.ts",
  "build-cms-publication-package-v0.1.ts",
  "build-publication-readiness-summary-v0.1.ts",
  "build-article-preview-package-v0.1.ts",
]);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function productSurfaceFor(ecosystem: string) {
  if (ecosystem === "replay") return "Replay Dashboard";
  if (ecosystem === "forecast") return "Forecast Dashboard";
  if (ecosystem === "decision") return "Decision Dashboard";
  if (ecosystem === "macro") return "Macro Intelligence Dashboard";
  if (ecosystem === "article_publication") return "Editorial Intelligence";
  if (ecosystem === "evidence") return "Evidence Explorer";
  if (ecosystem === "dataset") return "Dataset Governance";
  if (ecosystem === "mechanism") return "Mechanism Explorer";
  return null;
}

function strategicValueFor(ecosystem: string, productCandidate: boolean) {
  if (["decision", "forecast", "replay"].includes(ecosystem)) return "very_high";
  if (["macro", "article_publication", "evidence"].includes(ecosystem)) return "high";
  if (productCandidate) return "medium";
  return "low";
}

function technicalRiskFor(dormant: boolean, orphanLike: boolean, missingInputCount: number) {
  if (missingInputCount > 0) return "high";
  if (orphanLike) return "medium";
  if (dormant) return "unknown";
  return "low";
}

function recommendedActionFor(args: {
  surfaced: boolean;
  dormant: boolean;
  productCandidate: boolean;
  strategicValue: string;
  technicalRisk: string;
}) {
  if (args.dormant) return "investigate";
  if (args.technicalRisk === "high") return "repair";
  if (!args.surfaced && args.productCandidate && ["very_high", "high"].includes(args.strategicValue)) {
    return "surface";
  }
  if (args.surfaced && args.productCandidate) return "productize";
  return "monitor";
}

function usageScore(script: DependencyScript) {
  return script.fan_in + script.fan_out + script.read_count + script.write_count;
}

function qualityEngine(scriptName: string) {
  return /audit|quality|readiness|validation|compatibility|review|gate/i.test(scriptName);
}

function productCandidate(scriptName: string, ecosystem: string) {
  return (
    /replay|forecast|decision|macro|article|workbench|client|evidence|dataset/i.test(scriptName) ||
    ["replay", "forecast", "decision", "macro", "article_publication", "evidence", "dataset"].includes(ecosystem)
  );
}

const dependencyRegistry = readJson<DependencyRegistry>(DEPENDENCY_REGISTRY_PATH);
const warehouseRegistry = readJson<WarehouseRegistry>(WAREHOUSE_REGISTRY_PATH);

const warehouseByName = new Map(
  warehouseRegistry.engines.map((engine) => [engine.name, engine])
);

const engines = dependencyRegistry.scripts.map((script) => {
  const warehouseEngine = warehouseByName.get(script.script_name);
  const capability = warehouseEngine?.capability ?? script.ecosystem;

  const dormant =
    script.read_count === 0 &&
    script.write_count === 0 &&
    script.fan_in === 0 &&
    script.fan_out === 0;

  const orphanLike = script.write_count > 0 && script.fan_out === 0;
  const surfaced = surfacedScripts.has(script.script_name);
  const quality = qualityEngine(script.script_name);
  const product = productCandidate(script.script_name, script.ecosystem);
  const operational = script.read_count > 0 || script.write_count > 0;
  const integrated = script.fan_in > 0 || script.fan_out > 0;
  const productSurfaceCandidate = productSurfaceFor(script.ecosystem);
  const missingInputCount = script.reads.filter((input) => input.includes("${")).length;

  const strategicValue = strategicValueFor(script.ecosystem, product);
  const technicalRisk = technicalRiskFor(dormant, orphanLike, missingInputCount);

  const scores = {
    usage_score: usageScore(script),
    quality_score: quality ? 70 : operational ? 40 : 10,
    product_readiness_score:
      surfaced && integrated ? 75 :
      integrated && product ? 60 :
      operational && product ? 45 :
      product ? 30 :
      10,
    risk_score:
      technicalRisk === "high" ? 80 :
      technicalRisk === "medium" ? 50 :
      technicalRisk === "unknown" ? 40 :
      15,
  };

  return {
    script_name: script.script_name,
    script_path: script.script_path,
    ecosystem: script.ecosystem,
    capability,

    usage: {
      fan_in: script.fan_in,
      fan_out: script.fan_out,
      read_count: script.read_count,
      write_count: script.write_count,
      upstream_count: script.upstream_scripts.length,
      downstream_count: script.downstream_scripts.length,
    },

    classification: {
      surfaced,
      hidden: !surfaced,
      dormant,
      orphan_like: orphanLike,
      quality_engine: quality,
      product_candidate: product,
    },

    maturity: {
      operational,
      integrated,
      surfaced,
      productized: false,
    },

    scores,
    strategic_value: strategicValue,
    technical_risk: technicalRisk,
    recommended_action: recommendedActionFor({
      surfaced,
      dormant,
      productCandidate: product,
      strategicValue,
      technicalRisk,
    }),
    product_surface_candidate: productSurfaceCandidate,
  };
});

const summary = {
  total_engines: engines.length,
  operational: engines.filter((engine) => engine.maturity.operational).length,
  integrated: engines.filter((engine) => engine.maturity.integrated).length,
  surfaced: engines.filter((engine) => engine.classification.surfaced).length,
  hidden: engines.filter((engine) => engine.classification.hidden).length,
  dormant: engines.filter((engine) => engine.classification.dormant).length,
  orphan_like: engines.filter((engine) => engine.classification.orphan_like).length,
  quality_engines: engines.filter((engine) => engine.classification.quality_engine).length,
  product_candidates: engines.filter((engine) => engine.classification.product_candidate).length,
  recommended_actions: {
    surface: engines.filter((engine) => engine.recommended_action === "surface").length,
    productize: engines.filter((engine) => engine.recommended_action === "productize").length,
    repair: engines.filter((engine) => engine.recommended_action === "repair").length,
    investigate: engines.filter((engine) => engine.recommended_action === "investigate").length,
    monitor: engines.filter((engine) => engine.recommended_action === "monitor").length,
  },
};

const output = {
  registry_version: "engine-intelligence-registry-v0.1",
  generated_at: new Date().toISOString(),
  doctrine: {
    usage_is_inferred_from_dependency_registry: true,
    quality_is_heuristic_not_truth: true,
    maturity_is_discovery_not_final_classification: true,
    registry_prioritizes_visibility_productization_and_risk: true,
  },
  inputs: {
    dependency_registry: "data/intelligence/dependency-registry-v0.1.json",
    warehouse_registry: "data/intelligence/intelligence-warehouse-registry-v0.1.json",
  },
  summary,
  engines: engines.sort((a, b) => b.scores.product_readiness_score - a.scores.product_readiness_score),
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

if (fs.existsSync("/var/www/zenith-admin")) {
  fs.mkdirSync(RUNTIME_OUTPUT_DIR, { recursive: true });
  fs.copyFileSync(OUTPUT_PATH, RUNTIME_OUTPUT_PATH);
}

console.log({
  registry_version: output.registry_version,
  output: "data/intelligence/engine-intelligence-registry-v0.1.json",
  runtime_output: fs.existsSync(RUNTIME_OUTPUT_PATH) ? RUNTIME_OUTPUT_PATH : null,
  summary,
});
