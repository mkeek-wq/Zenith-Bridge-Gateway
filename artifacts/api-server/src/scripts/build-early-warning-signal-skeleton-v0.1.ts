import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/intelligence/signal-watchlist-registry-v0.1.json";

const outputPath =
  "data/intelligence/early-warning-signal-skeleton-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function defaultTriggerCondition(signalType: string) {
  if (signalType === "quantitative_indicator") {
    return {
      trigger_type: "threshold_or_change_detection",
      placeholder_rule:
        "Trigger when indicator moves materially versus prior period, historical average, or expected range.",
      numeric_threshold_required: true,
    };
  }

  if (signalType === "event_indicator") {
    return {
      trigger_type: "event_detection",
      placeholder_rule:
        "Trigger when a relevant event is observed in a reviewed source.",
      numeric_threshold_required: false,
    };
  }

  return {
    trigger_type: "qualitative_signal_detection",
    placeholder_rule:
      "Trigger when reviewed evidence indicates a meaningful directional change.",
    numeric_threshold_required: false,
  };
}

function alertSeverity(signalStrength: string, cadence: string) {
  if (signalStrength === "high" && cadence === "weekly") return "high";
  if (signalStrength === "medium_high") return "medium_high";
  if (signalStrength === "medium") return "medium";
  return "watch";
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const watchlist = source.watchlist_items ?? [];

const earlyWarnings = watchlist.map((item: any) => ({
  early_warning_signal_version: "early-warning-signal-v0.1",
  early_warning_id: `EWS-${item.watchlist_id.replace(/^WATCH-/, "")}`,

  driver_id: item.driver_id,
  driver_name: item.driver_name,

  indicator: item.indicator,
  signal_type: item.signal_type,
  monitoring_cadence: item.monitoring_cadence,
  signal_strength: item.signal_strength,
  alert_severity: alertSeverity(
    item.signal_strength,
    item.monitoring_cadence
  ),

  trigger_condition: defaultTriggerCondition(item.signal_type),

  evidence_sources: item.evidence_sources ?? [],
  related_search_phrases: item.related_search_phrases ?? [],

  alert_status: "inactive_skeleton",
  review_status: "requires_rule_definition",

  future_fields: {
    latest_observation: null,
    previous_observation: null,
    historical_baseline: null,
    trigger_result: null,
    reviewed_evidence_items: [],
    analyst_notes: "",
  },

  governance: {
    auto_alert_allowed: false,
    auto_publish_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
  },
}));

const output = {
  early_warning_signal_skeleton_version:
    "early-warning-signal-skeleton-v0.1",
  generated_at: new Date().toISOString(),
  source_signal_watchlist_registry: sourcePath,
  policy: {
    principle:
      "Creates inactive early-warning signal shells from the signal watchlist. These are trigger templates only and do not perform live monitoring.",
    auto_monitoring_allowed: false,
    auto_alert_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
  },
  summary: {
    watchlist_items_processed: watchlist.length,
    early_warning_signals_created: earlyWarnings.length,
    high_severity: earlyWarnings.filter((x) => x.alert_severity === "high")
      .length,
    medium_high_severity: earlyWarnings.filter(
      (x) => x.alert_severity === "medium_high"
    ).length,
    medium_severity: earlyWarnings.filter((x) => x.alert_severity === "medium")
      .length,
    watch_severity: earlyWarnings.filter((x) => x.alert_severity === "watch")
      .length,
  },
  early_warning_signals: earlyWarnings,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  early_warning_signal_skeleton_version:
    output.early_warning_signal_skeleton_version,
  watchlist_items_processed: output.summary.watchlist_items_processed,
  early_warning_signals_created: output.summary.early_warning_signals_created,
  high_severity: output.summary.high_severity,
  medium_high_severity: output.summary.medium_high_severity,
  medium_severity: output.summary.medium_severity,
  watch_severity: output.summary.watch_severity,
  output: outputPath,
});

for (const signal of earlyWarnings.slice(0, 30)) {
  console.log(
    `${signal.alert_severity} | ${signal.driver_id} | ${signal.indicator} | ${signal.trigger_condition.trigger_type}`
  );
}
