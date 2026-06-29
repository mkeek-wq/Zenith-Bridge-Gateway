import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const metricRegistryPath = path.join(projectRoot, "config", "metric-registry.json");

export type MetricDefinition = {
  metric_code: string;
  metric_label: string;
  domain: string;
  unit: string;
  default_comparison_basis: string;
  keywords: string[];
};

export type MetricRegistry = {
  registry_version: string;
  governance_principle: string;
  naming_convention: {
    style: string;
    pattern: string;
    examples: string[];
  };
  fallback_metric: {
    metric_code: string;
    metric_label: string;
    use_when: string;
  };
  metrics: MetricDefinition[];
};

export async function loadMetricRegistry(): Promise<MetricRegistry> {
  const raw = await readFile(metricRegistryPath, "utf8");
  return JSON.parse(raw) as MetricRegistry;
}

async function main() {
  const registry = await loadMetricRegistry();

  console.log(
    JSON.stringify(
      {
        registry_version: registry.registry_version,
        metrics_total: registry.metrics.length,
        fallback_metric: registry.fallback_metric.metric_code,
        first_metric: registry.metrics[0] ?? null,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Metric registry load failed:", error);
    process.exit(1);
  });
}
