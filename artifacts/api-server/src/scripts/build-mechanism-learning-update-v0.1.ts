import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT =
  "data/intelligence/experience-registry-promotion-gate-v0.1.json";

const OUTPUT =
  "data/intelligence/mechanism-learning-update-v0.1.json";

function main() {
  const gate = JSON.parse(fs.readFileSync(path.join(ROOT, INPUT), "utf8"));

  const promoted = (gate.gate_items ?? []).filter(
    (g: any) => g.resulting_status === "promoted_to_experience_memory"
  );

  const mechanismMap = new Map<string, any>();

  for (const item of promoted) {
    for (const mechanismId of item.mechanism_ids ?? []) {
      if (!mechanismMap.has(mechanismId)) {
        mechanismMap.set(mechanismId, {
          mechanism_id: mechanismId,
          replay_experience_count: 0,
          strong_alignment_count: 0,
          moderate_alignment_count: 0,
          learning_adjustment: 0,
        });
      }

      const m = mechanismMap.get(mechanismId);
      m.replay_experience_count += 1;

      if (item.alignment_band === "strong_alignment") {
        m.strong_alignment_count += 1;
        m.learning_adjustment += 0.03;
      }

      if (item.alignment_band === "moderate_alignment") {
        m.moderate_alignment_count += 1;
        m.learning_adjustment += 0.015;
      }
    }
  }

  const updates = Array.from(mechanismMap.values()).map((m: any) => ({
    ...m,
    learning_adjustment: Number(m.learning_adjustment.toFixed(3)),
    updated_status:
      m.replay_experience_count >= 3
        ? "experience_strengthening_detected"
        : "early_experience_signal_only",
    governance_note:
      "Learning update adjusts experience reputation only. It does not validate the mechanism.",
  }));

  const output = {
    update_version: "mechanism-learning-update-v0.1",
    generated_at: new Date().toISOString(),
    source_gate: INPUT,
    promoted_experience_items: promoted.length,
    mechanisms_updated: updates.length,
    updates,
    doctrine: {
      learning_update_is_not_validation: true,
      minimum_replay_experience_for_validation_review: 3,
      mechanism_validation_requires_separate_gate: true,
    },
  };

  fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(output, null, 2));

  console.log({
    update_version: output.update_version,
    promoted_experience_items: output.promoted_experience_items,
    mechanisms_updated: output.mechanisms_updated,
    output: OUTPUT,
  });

  for (const update of updates) {
    console.log(
      `${update.mechanism_id} | ${update.updated_status} | adjustment=${update.learning_adjustment}`
    );
  }
}

main();
