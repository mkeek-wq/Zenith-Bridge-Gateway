import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/replay-case-definitions-v0.1.json";

const OUTPUT =
  "data/replay/replay-evidence-mapping-queue-v0.1.json";

function mappingNeeds(domain: string): string[] {
  const d = domain.toLowerCase();

  if (d.includes("policy") || d.includes("labour_policy")) {
    return [
      "policy_source_mapping",
      "publication_date_mapping",
      "affected_sector_mapping",
      "outcome_metric_mapping",
    ];
  }

  if (
    d.includes("tourism") ||
    d.includes("air_transport") ||
    d.includes("retail") ||
    d.includes("food_services") ||
    d.includes("services")
  ) {
    return [
      "sector_output_mapping",
      "mobility_or_activity_mapping",
      "employment_mapping",
      "policy_restriction_mapping",
    ];
  }

  if (
    d.includes("electronics") ||
    d.includes("semiconductor") ||
    d.includes("biomedical") ||
    d.includes("marine")
  ) {
    return [
      "sector_output_mapping",
      "export_mapping",
      "global_demand_mapping",
      "production_cycle_mapping",
    ];
  }

  if (d.includes("inflation") || d.includes("monetary")) {
    return [
      "price_index_mapping",
      "policy_rate_or_fx_mapping",
      "global_price_pressure_mapping",
      "domestic_demand_mapping",
    ];
  }

  if (d.includes("trade")) {
    return [
      "nodx_mapping",
      "goods_export_mapping",
      "global_trade_mapping",
      "sector_export_mapping",
    ];
  }

  if (d.includes("finance")) {
    return [
      "credit_condition_mapping",
      "market_volatility_mapping",
      "interest_rate_mapping",
      "business_activity_mapping",
    ];
  }

  if (d.includes("real_estate")) {
    return [
      "property_transaction_mapping",
      "price_index_mapping",
      "interest_rate_mapping",
      "construction_linkage_mapping",
    ];
  }

  if (d.includes("employment")) {
    return [
      "unemployment_mapping",
      "resident_employment_mapping",
      "retrenchment_mapping",
      "wage_or_hours_mapping",
    ];
  }

  return [
    "sector_output_mapping",
    "macro_context_mapping",
    "mechanism_mapping",
    "outcome_metric_mapping",
  ];
}

function readinessBand(needs: string[]): string {
  if (needs.includes("policy_source_mapping")) return "needs_policy_source_mapping";
  if (needs.includes("sector_output_mapping")) return "needs_sector_source_mapping";
  if (needs.includes("price_index_mapping")) return "needs_macro_source_mapping";
  return "ready_for_evidence_mapping";
}

function main() {
  const defs = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const queue = (defs.definitions ?? []).map((d: any) => {
    const needs = mappingNeeds(d.domain);

    return {
      case_id: d.case_id,
      domain: d.domain,
      period: d.period,
      priority: d.priority,
      candidate_mechanisms: d.candidate_mechanisms,
      expected_signals: d.expected_signals,
      mapping_needs: needs,
      mapping_status: readinessBand(needs),
      required_next_step: "map_sources_and_publication_dates",
    };
  });

  const output = {
    queue_version: "replay-evidence-mapping-queue-v0.1",
    generated_at: new Date().toISOString(),
    source_definitions: INPUT,
    cases_assessed: queue.length,
    needs_policy_source_mapping: queue.filter(
      (q: any) => q.mapping_status === "needs_policy_source_mapping"
    ).length,
    needs_sector_source_mapping: queue.filter(
      (q: any) => q.mapping_status === "needs_sector_source_mapping"
    ).length,
    needs_macro_source_mapping: queue.filter(
      (q: any) => q.mapping_status === "needs_macro_source_mapping"
    ).length,
    ready_for_evidence_mapping: queue.filter(
      (q: any) => q.mapping_status === "ready_for_evidence_mapping"
    ).length,
    queue,
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    queue_version: output.queue_version,
    cases_assessed: output.cases_assessed,
    needs_policy_source_mapping: output.needs_policy_source_mapping,
    needs_sector_source_mapping: output.needs_sector_source_mapping,
    needs_macro_source_mapping: output.needs_macro_source_mapping,
    ready_for_evidence_mapping: output.ready_for_evidence_mapping,
    output: OUTPUT,
  });

  for (const q of queue) {
    console.log(`${q.mapping_status} | ${q.case_id}`);
  }
}

main();
