import type { MetricDefinition } from "./load-metric-registry.js";

export type MetricMatch = {
  metric_code: string;
  metric_label: string;
  score: number;
  matched_keywords: string[];
};

export function matchMetricFromRegistry(
  text: string,
  metrics: Array<{
    metric_code: string;
    metric_label: string;
    keywords: string[];
  }>,
)
 : MetricMatch | null {
  const lowerText = text.toLowerCase();

  let bestMatch: MetricMatch | null = null;

  for (const metric of metrics) {
    const matchedKeywords = metric.keywords.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase()),
    );

    const score = matchedKeywords.length;

    if (score === 0) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        metric_code: metric.metric_code,
        metric_label: metric.metric_label,
        score,
        matched_keywords: matchedKeywords,
      };
    }
  }

  return bestMatch;
}
