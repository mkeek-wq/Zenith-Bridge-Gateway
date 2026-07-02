import { readFile, writeFile } from "node:fs/promises";

const INPUT =
  "data/investigations/m355381-investigation-candidates-v0.1.json";

const OUTPUT =
  "data/investigations/m355381-evidence-search-packages-v0.1.json";

function buildQueries(seriesName: string) {
  return {
    institution_queries: [
      `Singapore ${seriesName} April 2026`,
      `EDB ${seriesName} April 2026`,
      `SingStat ${seriesName} April 2026`,
      `MTI ${seriesName} April 2026`,
    ],

    industry_queries: [
      `${seriesName} industry April 2026`,
      `${seriesName} production April 2026`,
      `${seriesName} demand April 2026`,
    ],

    operational_queries: [
      `${seriesName} maintenance April 2026`,
      `${seriesName} outage April 2026`,
      `${seriesName} disruption April 2026`,
    ],

    global_queries: [
      `global ${seriesName} market April 2026`,
      `${seriesName} global demand April 2026`,
    ],
  };
}

async function main() {
  const input = JSON.parse(
    await readFile(INPUT, "utf8")
  );

  const packages = input.candidates.map((c: any) => ({
    investigation_version:
      "evidence-search-v0.1",

    status:
      "awaiting_evidence",

    series_no:
      c.series_no,

    series_name:
      c.series_name,

    latest_value:
      c.latest_value,

    month_on_month_change_pct:
      c.month_on_month_change_pct,

    year_on_year_change_pct:
      c.year_on_year_change_pct,

    ...buildQueries(c.series_name),
  }));

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        generated_at:
          new Date().toISOString(),

        source:
          INPUT,

        packages,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        packages_created:
          packages.length,
      },
      null,
      2,
    ),
  );
}

main().catch(console.error);
