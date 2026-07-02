import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/intelligence/investigation-pack-registry-v0.1.json";

const outputPath =
  "data/intelligence/driver-observatory-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const packs = source.investigation_packs ?? [];

function leadingIndicators(driverId: string) {
  switch (driverId) {
    case "MKT_008":
      return [
        "global semiconductor sales",
        "chip demand",
        "electronics exports",
        "wafer fab utilization",
      ];

    case "MKT_009":
      return [
        "pharmaceutical production schedules",
        "biologics demand",
        "vaccine manufacturing",
        "healthcare demand",
      ];

    case "MKT_010":
      return [
        "global PMI",
        "export orders",
        "trade volumes",
        "manufacturing sentiment",
      ];

    case "MKT_011":
      return [
        "chemical demand",
        "feedstock prices",
        "petrochemical margins",
        "plant utilization",
      ];

    case "MKT_012":
      return [
        "capital expenditure",
        "machinery orders",
        "automation investment",
        "equipment demand",
      ];

    case "MKT_013":
      return [
        "IATA traffic",
        "aircraft utilization",
        "MRO demand",
        "fleet expansion",
      ];

    default:
      return [
        "industrial production",
        "business sentiment",
        "sector demand",
      ];
  }
}

function expectedEvents(driverId: string) {
  switch (driverId) {
    case "MKT_008":
      return [
        "chip cycle recovery",
        "electronics demand surge",
        "fab expansion",
      ];

    case "MKT_009":
      return [
        "major batch production",
        "drug launch",
        "plant expansion",
      ];

    case "MKT_011":
      return [
        "petrochemical turnaround",
        "feedstock shock",
        "chemical demand surge",
      ];

    case "MKT_013":
      return [
        "aviation recovery",
        "fleet maintenance cycle",
        "MRO expansion",
      ];

    default:
      return [
        "demand shift",
        "capacity change",
        "sector cycle change",
      ];
  }
}

const observatory = packs.map((pack: any) => ({
  observatory_version: "driver-observatory-v0.1",

  driver_id: pack.driver_id,
  driver_name: pack.driver_name,

  monitoring_priority: pack.review_priority,

  signal_strength: pack.signal_strength,

  leading_indicators:
    leadingIndicators(pack.driver_id),

  evidence_sources:
    pack.evidence_sources ?? [],

  expected_events:
    expectedEvents(pack.driver_id),

  search_phrases:
    pack.search_phrases ?? [],

  monitoring_status:
    "watchlist",

  governance: {
    auto_monitoring_allowed: false,
    auto_attribution_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
  },
}));

observatory.sort(
  (a: any, b: any) =>
    (a.monitoring_priority === "top_review" ? -1 : 1)
);

const output = {
  driver_observatory_version:
    "driver-observatory-v0.1",

  generated_at:
    new Date().toISOString(),

  source_investigation_pack_registry:
    sourcePath,

  summary: {
    drivers:
      observatory.length,
  },

  observatory,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  driver_observatory_version:
    output.driver_observatory_version,

  drivers:
    observatory.length,

  output:
    outputPath,
});

for (const item of observatory) {
  console.log(
    `${item.driver_id} | ${item.driver_name} | ${item.monitoring_status}`
  );
}
