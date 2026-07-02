import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-fleet-registry-v0.2.json";

const OUTPUT =
  "data/replay/replay-expansion-queue-v0.1.json";

const candidateCases = [
  {
    case_id: "SG-SERVICES-RECOVERY-2021",
    domain: "services",
    period: "2021",
    priority: "critical",
    rationale: "Adds services-side recovery comparison after manufacturing replay."
  },
  {
    case_id: "SG-RETAIL-2020",
    domain: "retail",
    period: "2020",
    priority: "high",
    rationale: "Adds domestic-demand shock case."
  },
  {
    case_id: "SG-FOOD-SERVICES-2020",
    domain: "food_services",
    period: "2020",
    priority: "high",
    rationale: "Adds lockdown-sensitive service-sector replay."
  },
  {
    case_id: "SG-TOURISM-2020",
    domain: "tourism",
    period: "2020",
    priority: "critical",
    rationale: "Adds extreme external mobility shock case."
  },
  {
    case_id: "SG-AIR-TRANSPORT-2020",
    domain: "air_transport",
    period: "2020",
    priority: "critical",
    rationale: "Adds aviation-linked demand collapse case."
  },
  {
    case_id: "SG-CONSTRUCTION-2020",
    domain: "construction",
    period: "2020",
    priority: "critical",
    rationale: "Adds supply/labour constraint shock case."
  },
  {
    case_id: "SG-FOREIGN-WORKER-CONSTRAINTS-2021",
    domain: "labour_policy",
    period: "2021",
    priority: "critical",
    rationale: "Adds policy/labour constraint mechanism case."
  },
  {
    case_id: "SG-JOBS-SUPPORT-SCHEME-2020",
    domain: "policy",
    period: "2020",
    priority: "critical",
    rationale: "Adds fiscal support/policy intervention replay case."
  },
  {
    case_id: "SG-CARBON-TAX-2019",
    domain: "policy",
    period: "2019",
    priority: "high",
    rationale: "Adds structural policy cost pass-through case."
  },
  {
    case_id: "SG-ELECTRONICS-EXPORTS-2021",
    domain: "electronics",
    period: "2021",
    priority: "high",
    rationale: "Adds electronics export cycle replay."
  },
  {
    case_id: "SG-SEMICONDUCTOR-SLOWDOWN-2022",
    domain: "semiconductors",
    period: "2022",
    priority: "high",
    rationale: "Adds post-recovery semiconductor slowdown comparison."
  },
  {
    case_id: "SG-INFLATION-2022",
    domain: "inflation",
    period: "2022",
    priority: "high",
    rationale: "Adds inflation/rates macro transmission replay."
  },
  {
    case_id: "SG-MONETARY-TIGHTENING-2022",
    domain: "monetary_policy",
    period: "2022",
    priority: "high",
    rationale: "Adds exchange-rate/rates policy response case."
  },
  {
    case_id: "SG-GOODS-EXPORTS-2020",
    domain: "trade",
    period: "2020",
    priority: "medium",
    rationale: "Adds broad goods trade cycle replay."
  },
  {
    case_id: "SG-NODX-2023",
    domain: "trade",
    period: "2023",
    priority: "high",
    rationale: "Adds NODX downturn/rebound comparison."
  },
  {
    case_id: "SG-FINANCE-2020",
    domain: "finance",
    period: "2020",
    priority: "medium",
    rationale: "Adds finance-sector resilience comparison."
  },
  {
    case_id: "SG-REAL-ESTATE-2020",
    domain: "real_estate",
    period: "2020",
    priority: "medium",
    rationale: "Adds property-sector shock/recovery case."
  },
  {
    case_id: "SG-MARINE-OFFSHORE-2020",
    domain: "marine_offshore",
    period: "2020",
    priority: "medium",
    rationale: "Adds oil-linked industrial sector comparison."
  },
  {
    case_id: "SG-BIOMEDICAL-VOLATILITY-2020",
    domain: "biomedical",
    period: "2020",
    priority: "high",
    rationale: "Adds biomedical volatility comparison."
  },
  {
    case_id: "SG-LABOUR-MARKET-2020",
    domain: "employment",
    period: "2020",
    priority: "critical",
    rationale: "Adds labour market outcome replay case."
  }
];

function main() {
  const fleet = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const existingIds = new Set(
    (fleet.fleet ?? []).map((c: any) => c.case_id)
  );

  const queue = candidateCases
    .filter((c) => !existingIds.has(c.case_id))
    .map((c) => ({
      ...c,
      status: "queued_for_replay_design",
      required_next_step: "create_replay_case_definition",
    }));

  const output = {
    queue_version: "replay-expansion-queue-v0.1",
    generated_at: new Date().toISOString(),
    source_fleet: INPUT,
    existing_cases: existingIds.size,
    candidate_cases: candidateCases.length,
    queued_cases: queue.length,
    critical_count: queue.filter((q) => q.priority === "critical").length,
    high_count: queue.filter((q) => q.priority === "high").length,
    medium_count: queue.filter((q) => q.priority === "medium").length,
    queue,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    queue_version: output.queue_version,
    existing_cases: output.existing_cases,
    queued_cases: output.queued_cases,
    critical_count: output.critical_count,
    high_count: output.high_count,
    medium_count: output.medium_count,
    output: OUTPUT,
  });

  for (const q of queue.slice(0, 20)) {
    console.log(`${q.priority} | ${q.case_id} | ${q.domain}`);
  }
}

main();
