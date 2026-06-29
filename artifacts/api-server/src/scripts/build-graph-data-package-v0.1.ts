import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function pctChange(first: number, last: number) {
  if (!first) return null;
  return Number((((last - first) / first) * 100).toFixed(2));
}

function trend(values: any[]) {
  const valid = values.filter((v) => typeof v.value === "number");
  if (valid.length < 2) return "insufficient_data";

  const first = valid[0].value;
  const last = valid[valid.length - 1].value;
  const change = pctChange(first, last);

  if (change === null) return "unknown";
  if (change > 15) return "rising";
  if (change < -15) return "falling";
  return "broadly_stable";
}

const registryPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "verified-dataset-registry-v0.1.json"
);

const registry = readJson(registryPath);

const packages = (registry.datasets || [])
  .filter((dataset: any) => dataset.verification_status === "verified")
  .filter((dataset: any) => Array.isArray(dataset.values) && dataset.values.length > 0)
  .map((dataset: any) => {
    const valid = dataset.values.filter((v: any) => typeof v.value === "number");
    const latest = valid[valid.length - 1];
    const previous = valid[valid.length - 2];

    const latestYoY =
      latest && previous && previous.value
        ? Number((((latest.value - previous.value) / previous.value) * 100).toFixed(2))
        : null;

    const first = valid[0];
    const tenYearChange =
      first && latest ? pctChange(first.value, latest.value) : null;

    return {
      graph_package_id: `GDPKG_${dataset.dataset_id}`,
      dataset_id: dataset.dataset_id,
      title: dataset.name,
      country: dataset.country,
      unit: dataset.unit,
      frequency: dataset.frequency,
      source_name: dataset.preferred_sources?.[0] || "unknown",
      source_url: dataset.source_url,
      coverage_start: dataset.coverage_start,
      coverage_end: dataset.coverage_end,
      values_count: dataset.values_count,
      latest_period: latest?.period ?? null,
      latest_value: latest?.value ?? null,
      previous_period: previous?.period ?? null,
      previous_value: previous?.value ?? null,
      latest_yoy_percent: latestYoY,
      ten_year_change_percent: tenYearChange,
      trend_direction: trend(dataset.values),
      recommended_graphs: [
        "10y_line_chart",
        "latest_yoy_bar",
        "indexed_trend_chart"
      ],
      values: dataset.values,
      source_metadata: dataset.source_metadata || null,
      generated_at: new Date().toISOString(),
    };
  });

const output = {
  package_version: "graph-data-package-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Graph-ready verified dataset summaries for ZNBW article workbench.",
  package_count: packages.length,
  packages,
};

const outDir = path.join(ROOT, "data", "intelligence");
ensureDir(outDir);

const outPath = path.join(outDir, "graph-data-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  package_count: output.package_count,
  output: outPath,
});

for (const p of packages) {
  console.log(`${p.dataset_id} | latest=${p.latest_period}:${p.latest_value} | yoy=${p.latest_yoy_percent}% | trend=${p.trend_direction}`);
}
