import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT_PATH =
  "data/intelligence/driver-diversity-engine-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/macro-specificity-hardening-queue-v0.1.json";

function recommendationsForDomain(domain: string): string[] {
  const d = domain.toLowerCase();

  if (d.includes("manufacturing")) {
    return [
      "Add manufacturing output indicators",
      "Add electronics export indicators",
      "Add inventory/restocking indicators",
      "Add sector-specific production cycle evidence",
    ];
  }

  if (d.includes("petroleum")) {
    return [
      "Add Brent crude and regional oil price indicators",
      "Add refining margin indicators",
      "Add petrochemical spread indicators",
      "Add energy demand indicators",
    ];
  }

  if (d.includes("semiconductor")) {
    return [
      "Add global semiconductor sales indicators",
      "Add chip-cycle indicators",
      "Add electronics export indicators",
      "Add wafer/fab utilization indicators",
    ];
  }

  if (d.includes("biomedical")) {
    return [
      "Add pharmaceutical output indicators",
      "Add biomedical export indicators",
      "Add healthcare demand indicators",
      "Add funding/rates context indicators",
    ];
  }

  return [
    "Add sector-specific macro indicators",
    "Add policy-specific indicators",
    "Add mechanism-specific indicators",
  ];
}

function priorityFromBand(band: string): "critical" | "high" | "medium" {
  if (band === "over_concentrated") return "critical";
  if (band === "thin_diversity") return "high";
  return "medium";
}

function main() {
  const inputAbs = path.join(ROOT, INPUT_PATH);

  if (!fs.existsSync(inputAbs)) {
    throw new Error(`Missing input: ${INPUT_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(inputAbs, "utf8"));

  const queue = (data.case_diversity ?? [])
    .filter((c: any) =>
      ["over_concentrated", "thin_diversity"].includes(c.diversity_band)
    )
    .map((c: any) => ({
      case_id: c.case_id,
      case_label: c.case_label,
      domain: c.domain,
      priority: priorityFromBand(c.diversity_band),
      trigger_band: c.diversity_band,
      diversity_score: c.diversity_score,
      dominant_or_high_driver_share: c.dominant_or_high_driver_share,
      missing_dimension:
        c.sector_specific_driver_count === 0
          ? "sector_specific_macro_context"
          : "macro_driver_balance",
      recommended_hardening_actions: recommendationsForDomain(c.domain),
      governance_note:
        "Hardening queue is diagnostic only. It identifies cases requiring better macro specificity before stronger learning or synthesis is attempted.",
    }))
    .sort((a: any, b: any) => {
      const rank: any = { critical: 0, high: 1, medium: 2 };
      return rank[a.priority] - rank[b.priority];
    });

  const output = {
    queue_version: "macro-specificity-hardening-queue-v0.1",
    generated_at: new Date().toISOString(),
    input: INPUT_PATH,
    cases_reviewed: data.cases_assessed,
    queue_count: queue.length,
    critical_count: queue.filter((q: any) => q.priority === "critical").length,
    high_count: queue.filter((q: any) => q.priority === "high").length,
    medium_count: queue.filter((q: any) => q.priority === "medium").length,
    doctrine:
      "Macro specificity hardening prevents broad indicators from becoming universal explanations.",
    hardening_queue: queue,
  };

  const outAbs = path.join(ROOT, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(output, null, 2));

  console.log({
    queue_version: output.queue_version,
    cases_reviewed: output.cases_reviewed,
    queue_count: output.queue_count,
    critical_count: output.critical_count,
    high_count: output.high_count,
    output: OUTPUT_PATH,
  });

  for (const q of queue) {
    console.log(
      `${q.priority} | ${q.case_id} | ${q.domain} | ${q.trigger_band}`
    );
  }
}

main();
