import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const dashboard = readJson("data/replay/papa-replay-dashboard-package-v0.1.json");

function band(score: number | null) {
  if (score === null) return "unknown";
  if (score >= 0.75) return "strong";
  if (score >= 0.5) return "moderate";
  if (score >= 0.25) return "weak";
  return "very_weak";
}

const envelopes = (dashboard.top_analogues ?? []).map((item: any) => {
  const score = item.similarity_score ?? null;

  return {
    replay_record_id: item.replay_record_id,
    metric_name: item.metric_name,
    period: item.period,
    top_analogue: {
      case_id: item.top_case_id,
      title: item.top_title,
      similarity_score: score,
      mechanism_similarity: item.mechanism_similarity,
      confidence_band: band(score)
    },
    scenario_envelope: {
      doctrine: "historical_range_not_prediction",
      stress_case: {
        label: "Stress case",
        basis: "Lower-confidence historical analogue outcome range",
        confidence_modifier: -0.2
      },
      base_case: {
        label: "Base case",
        basis: "Closest available historical analogue",
        confidence_modifier: 0
      },
      upside_case: {
        label: "Upside case",
        basis: "Recovery or favourable historical analogue path",
        confidence_modifier: 0.15
      }
    }
  };
});

const output = {
  version: "replay-forecast-envelope-v0.1",
  generated_at: new Date().toISOString(),
  source_dashboard_package: "data/replay/papa-replay-dashboard-package-v0.1.json",
  doctrine: {
    forecast_envelopes_are_not_predictions: true,
    based_on_historical_analogue_ranges: true,
    requires_human_interpretation: true
  },
  envelope_count: envelopes.length,
  envelopes
};

const outputPath = path.join(apiRoot, "data/replay/replay-forecast-envelope-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(output);
