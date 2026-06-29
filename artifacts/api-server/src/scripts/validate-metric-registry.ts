import { loadMetricRegistry } from "./load-metric-registry.js";

const VALID_COMPARISON_BASIS = new Set([
  "year_on_year",
  "month_on_month",
  "quarter_on_quarter",
  "contextual",
  "level",
]);

function isUpperSnakeCase(value: string): boolean {
  return /^[A-Z0-9_]+$/.test(value);
}

async function main() {
  const registry = await loadMetricRegistry();

  const errors: string[] = [];
  const warnings: string[] = [];

  const seenMetricCodes = new Set<string>();

  if (!registry.registry_version) {
    errors.push("Missing registry_version.");
  }

  if (registry.fallback_metric.metric_code !== "UNCLASSIFIED_PERCENTAGE") {
    errors.push("Fallback metric must be UNCLASSIFIED_PERCENTAGE.");
  }

  for (const metric of registry.metrics) {
    if (seenMetricCodes.has(metric.metric_code)) {
      errors.push(`Duplicate metric_code: ${metric.metric_code}`);
    }

    seenMetricCodes.add(metric.metric_code);

    if (!isUpperSnakeCase(metric.metric_code)) {
      errors.push(`Metric code is not UPPER_SNAKE_CASE: ${metric.metric_code}`);
    }

    if (!metric.metric_label) {
      errors.push(`Missing metric_label for ${metric.metric_code}`);
    }

    if (!metric.domain) {
      errors.push(`Missing domain for ${metric.metric_code}`);
    }

    if (metric.unit !== "%") {
      warnings.push(`Non-percentage unit found for ${metric.metric_code}: ${metric.unit}`);
    }

    if (!VALID_COMPARISON_BASIS.has(metric.default_comparison_basis)) {
      errors.push(
        `Invalid default_comparison_basis for ${metric.metric_code}: ${metric.default_comparison_basis}`,
      );
    }

    if (!Array.isArray(metric.keywords) || metric.keywords.length === 0) {
      errors.push(`Missing keywords for ${metric.metric_code}`);
    }

    const uniqueKeywords = new Set(metric.keywords.map((item) => item.toLowerCase().trim()));
    if (uniqueKeywords.size !== metric.keywords.length) {
      warnings.push(`Duplicate or near-duplicate keywords for ${metric.metric_code}`);
    }
  }

  const result = {
    validation_version: "metric-registry-validation-v0.1",
    registry_version: registry.registry_version,
    metrics_total: registry.metrics.length,
    errors_total: errors.length,
    warnings_total: warnings.length,
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    warnings,
  };

  console.log(JSON.stringify(result, null, 2));

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Metric registry validation failed:", error);
  process.exit(1);
});
