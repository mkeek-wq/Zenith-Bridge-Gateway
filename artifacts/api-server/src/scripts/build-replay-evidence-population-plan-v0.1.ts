import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/replay/wave-1/replay-evidence-file-index-v0.1.json";

const OUTPUT =
  "data/replay/wave-1/replay-evidence-population-plan-v0.1.json";

function main() {
  const index = JSON.parse(
    fs.readFileSync(path.join(ROOT, INPUT), "utf8")
  );

  const plans = index.files.map((file: any) => ({
    case_id: file.case_id,
    domain: file.domain,
    period: file.period,
    evidence_file: file.evidence_file,
    population_tasks: [
      "identify_authoritative_sources",
      "collect_historical_observations",
      "record_publication_dates",
      "record_observed_periods",
      "attach_lineage_notes",
      "validate_no_future_leakage"
    ],
    completion_status: "pending_population"
  }));

  const output = {
    plan_version: "replay-evidence-population-plan-v0.1",
    generated_at: new Date().toISOString(),
    source_index: INPUT,
    cases_planned: plans.length,
    pending_population: plans.length,
    completed_population: 0,
    plans
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT),
    JSON.stringify(output, null, 2)
  );

  console.log({
    plan_version: output.plan_version,
    cases_planned: output.cases_planned,
    output: OUTPUT
  });

  for (const p of plans) {
    console.log(`${p.case_id} | pending_population`);
  }
}

main();
