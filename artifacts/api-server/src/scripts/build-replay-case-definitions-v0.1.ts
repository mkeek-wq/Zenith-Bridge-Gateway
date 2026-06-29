import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-expansion-queue-v0.1.json";

const OUTPUT =
  "data/replay/replay-case-definitions-v0.1.json";

function defaultSignals(domain: string): string[] {
  const d = domain.toLowerCase();

  if (d.includes("tourism") || d.includes("air")) {
    return ["visitor_arrivals", "mobility", "services_output", "employment"];
  }

  if (d.includes("construction") || d.includes("labour")) {
    return ["construction_output", "foreign_worker_constraints", "employment", "policy_support"];
  }

  if (d.includes("policy")) {
    return ["policy_announcement", "fiscal_support", "business_cost", "employment"];
  }

  if (d.includes("electronics") || d.includes("semiconductor")) {
    return ["electronics_exports", "semiconductor_sales", "global_pmi", "nodx"];
  }

  if (d.includes("inflation") || d.includes("monetary")) {
    return ["cpi", "core_inflation", "exchange_rate", "interest_rates"];
  }

  if (d.includes("trade")) {
    return ["nodx", "goods_exports", "global_trade_volume", "global_pmi"];
  }

  if (d.includes("finance")) {
    return ["credit_conditions", "interest_rates", "market_volatility", "business_activity"];
  }

  if (d.includes("real_estate")) {
    return ["property_transactions", "interest_rates", "construction_output", "employment"];
  }

  if (d.includes("biomedical")) {
    return ["pharmaceutical_output", "biomedical_exports", "global_demand", "production_volatility"];
  }

  if (d.includes("employment")) {
    return ["unemployment_rate", "resident_employment", "retrenchments", "policy_support"];
  }

  if (d.includes("retail") || d.includes("food") || d.includes("services")) {
    return ["retail_sales", "services_output", "mobility", "employment"];
  }

  return ["global_pmi", "nodx", "sector_output", "employment"];
}

function defaultMechanisms(domain: string): string[] {
  const d = domain.toLowerCase();

  if (d.includes("policy")) return ["MKT_006", "MKT_007"];
  if (d.includes("labour") || d.includes("employment")) return ["MKT_005", "MKT_006"];
  if (d.includes("tourism") || d.includes("air")) return ["MKT_010", "MKT_005"];
  if (d.includes("construction")) return ["MKT_005", "MKT_006", "MKT_010"];
  if (d.includes("inflation") || d.includes("monetary")) return ["MKT_007", "MKT_010"];
  if (d.includes("electronics") || d.includes("semiconductor")) return ["MKT_002", "MKT_010"];
  if (d.includes("trade")) return ["MKT_010"];
  if (d.includes("biomedical")) return ["MKT_010", "MKT_006"];
  if (d.includes("finance") || d.includes("real_estate")) return ["MKT_007", "MKT_010"];

  return ["MKT_010"];
}

function main() {
  const queueData = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const definitions = (queueData.queue ?? []).map((q: any) => ({
    case_id: q.case_id,
    domain: q.domain,
    period: q.period,
    priority: q.priority,
    replay_status: "definition_created",
    replay_mode: "historical_replay_candidate",
    evidence_rule:
      "Use only evidence available at or before the replay period. No future-data leakage.",
    expected_signals: defaultSignals(q.domain),
    candidate_mechanisms: defaultMechanisms(q.domain),
    source_requirements: [
      "official_statistics_preferred",
      "publication_date_required",
      "historical_period_alignment_required",
      "lineage_required_before_replay_execution",
    ],
    readiness_status: "definition_ready_needs_evidence_mapping",
    rationale: q.rationale,
  }));

  const output = {
    definition_version: "replay-case-definitions-v0.1",
    generated_at: new Date().toISOString(),
    source_queue: INPUT,
    definitions_created: definitions.length,
    definitions,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    definition_version: output.definition_version,
    definitions_created: output.definitions_created,
    output: OUTPUT,
  });

  for (const d of definitions.slice(0, 20)) {
    console.log(
      `${d.priority} | ${d.case_id} | mechanisms=${d.candidate_mechanisms.join(",")}`
    );
  }
}

main();
