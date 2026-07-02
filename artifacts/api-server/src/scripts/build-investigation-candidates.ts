import { readFile, writeFile } from "node:fs/promises";

const INPUT =
  "data/dataset-context-pilots/m355381-latest-context-v0.2.json";

const OUTPUT =
  "data/investigations/m355381-investigation-candidates-v0.1.json";

async function main() {
  const context = JSON.parse(
    await readFile(INPUT, "utf8")
  );

  const candidates = context.observations
    .filter((o: any) => {
      const mom = Math.abs(o.month_on_month_change_pct ?? 0);
      const yoy = Math.abs(o.year_on_year_change_pct ?? 0);

      return mom >= 10 || yoy >= 25;
    })
    .map((o: any) => ({
      status: "investigation_required",

      series_no: o.series_no,
      series_name: o.series_name,

      latest_value: o.latest_value,

      month_on_month_change_pct:
        o.month_on_month_change_pct,

      year_on_year_change_pct:
        o.year_on_year_change_pct,

      evidence_found: [],

      hypotheses: [],

      confidence: "unknown",
    }));

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        investigation_version:
          "investigation-layer-v0.1",

        generated_at:
          new Date().toISOString(),

        table_id:
          context.table_id,

        period:
          context.latest_period,

        candidates,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        candidates_found:
          candidates.length,
      },
      null,
      2,
    ),
  );
}

main().catch(console.error);
