import fs from "node:fs";
import path from "node:path";

const sourcePath = "data/intelligence/driver-observatory-v0.1.json";
const outputPath = "data/intelligence/signal-watchlist-registry-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cadenceFor(signalStrength: string) {
  if (signalStrength === "high") return "weekly";
  if (signalStrength === "medium_high") return "biweekly";
  if (signalStrength === "medium") return "monthly";
  return "quarterly";
}

function signalType(indicator: string) {
  const x = indicator.toLowerCase();

  if (
    x.includes("sales") ||
    x.includes("orders") ||
    x.includes("exports") ||
    x.includes("demand") ||
    x.includes("traffic") ||
    x.includes("utilization")
  ) {
    return "quantitative_indicator";
  }

  if (
    x.includes("schedule") ||
    x.includes("launch") ||
    x.includes("expansion") ||
    x.includes("maintenance")
  ) {
    return "event_indicator";
  }

  return "qualitative_indicator";
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const observatory = source.observatory ?? [];

const watchlistItems: any[] = [];

for (const driver of observatory) {
  for (const indicator of driver.leading_indicators ?? []) {
    watchlistItems.push({
      watchlist_item_version: "signal-watchlist-item-v0.1",
      watchlist_id: `WATCH-${driver.driver_id}-${indicator
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`,
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      indicator,
      signal_type: signalType(indicator),
      monitoring_cadence: cadenceFor(driver.signal_strength),
      monitoring_priority: driver.monitoring_priority,
      signal_strength: driver.signal_strength,
      evidence_sources: driver.evidence_sources ?? [],
      related_search_phrases: driver.search_phrases ?? [],
      status: "watchlisted",
      governance: {
        auto_monitoring_allowed: false,
        auto_alert_allowed: false,
        human_review_required: true,
        production_mutation_allowed: false
      }
    });
  }
}

const output = {
  signal_watchlist_registry_version: "signal-watchlist-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_driver_observatory: sourcePath,
  policy: {
    principle:
      "Creates monitorable signal watchlist items from the driver observatory. No live monitoring or alerting is performed.",
    auto_monitoring_allowed: false,
    auto_alert_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false
  },
  summary: {
    drivers_processed: observatory.length,
    watchlist_items: watchlistItems.length,
    weekly_items: watchlistItems.filter(
      (x) => x.monitoring_cadence === "weekly"
    ).length,
    biweekly_items: watchlistItems.filter(
      (x) => x.monitoring_cadence === "biweekly"
    ).length,
    monthly_items: watchlistItems.filter(
      (x) => x.monitoring_cadence === "monthly"
    ).length,
    quarterly_items: watchlistItems.filter(
      (x) => x.monitoring_cadence === "quarterly"
    ).length
  },
  watchlist_items: watchlistItems
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  signal_watchlist_registry_version:
    output.signal_watchlist_registry_version,
  drivers_processed: output.summary.drivers_processed,
  watchlist_items: output.summary.watchlist_items,
  weekly_items: output.summary.weekly_items,
  biweekly_items: output.summary.biweekly_items,
  monthly_items: output.summary.monthly_items,
  quarterly_items: output.summary.quarterly_items,
  output: outputPath
});

for (const item of watchlistItems.slice(0, 30)) {
  console.log(
    `${item.monitoring_cadence} | ${item.driver_id} | ${item.indicator}`
  );
}
