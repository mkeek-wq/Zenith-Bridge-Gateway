import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/experience-registry-promotion-gate-v0.1.json";

const OUTPUT =
  "data/intelligence/replay-experience-accumulator-v0.1.json";

function main() {
  const gate = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const promoted = (gate.gate_items ?? []).filter(
    (item: any) => item.resulting_status === "promoted_to_experience_memory"
  );

  const mechanismMap = new Map<string, any>();

  for (const item of promoted) {
    for (const mechanismId of item.mechanism_ids ?? []) {
      if (!mechanismMap.has(mechanismId)) {
        mechanismMap.set(mechanismId, {
          mechanism_id: mechanismId,
          experience_count: 0,
          strong_alignment: 0,
          moderate_alignment: 0,
          weak_alignment: 0,
          contradictory: 0,
          cases: [],
        });
      }

      const record = mechanismMap.get(mechanismId);

      record.experience_count += 1;
      record.cases.push({
        case_id: item.case_id,
        alignment_score: item.alignment_score,
        alignment_band: item.alignment_band,
      });

      if (item.alignment_band === "strong_alignment") record.strong_alignment += 1;
      else if (item.alignment_band === "moderate_alignment") record.moderate_alignment += 1;
      else if (item.alignment_band === "weak_alignment") record.weak_alignment += 1;
      else if (item.alignment_band === "contradictory") record.contradictory += 1;
    }
  }

  const mechanisms = Array.from(mechanismMap.values()).map((m: any) => ({
    ...m,
    strong_alignment_ratio:
      m.experience_count === 0
        ? 0
        : Number((m.strong_alignment / m.experience_count).toFixed(3)),
    positive_alignment_ratio:
      m.experience_count === 0
        ? 0
        : Number(((m.strong_alignment + m.moderate_alignment) / m.experience_count).toFixed(3)),
  }));

  const output = {
    accumulator_version: "replay-experience-accumulator-v0.1",
    generated_at: new Date().toISOString(),
    source_gate: INPUT,
    promoted_experience_items: promoted.length,
    mechanisms_tracked: mechanisms.length,
    mechanisms,
    governance_note:
      "Accumulator aggregates promoted replay experience only. It does not validate mechanisms.",
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    accumulator_version: output.accumulator_version,
    promoted_experience_items: output.promoted_experience_items,
    mechanisms_tracked: output.mechanisms_tracked,
    output: OUTPUT,
  });

  for (const m of mechanisms) {
    console.log(
      `${m.mechanism_id} | experiences=${m.experience_count} | positive_ratio=${m.positive_alignment_ratio}`
    );
  }
}

main();
