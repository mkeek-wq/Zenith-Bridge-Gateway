import fs from "fs";
import path from "path";

const root = process.cwd();

const specFile = path.join(
  root,
  "data/intelligence/graph-specification-package-v0.1.json"
);

const outputDir =
  "/var/www/zenith-admin/intelligence-data/assets/generated-graphs";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatValue(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}B`;
  return `${value.toFixed(1)}`;
}

function buildLinePath(values: any[], width: number, height: number, pad: number) {
  const nums = values.map((v) => Number(v.value));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;

  return values
    .map((point, index) => {
      const x = pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2);
      const y = height - pad - ((Number(point.value) - min) / span) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function indexedValues(values: any[]) {
  const base = Number(values[0]?.value ?? 1);
  return values.map((v) => ({
    period: v.period,
    value: (Number(v.value) / base) * 100,
  }));
}

function renderSvg(spec: any) {
  const width = 1100;
  const height = 680;
  const pad = 90;
  const chartTop = 150;
  const chartHeight = 390;
  const chartPad = 70;

  const isIndexed = spec.recommended_chart_type.includes("indexed");
  const series = spec.series ?? [];

  const preparedSeries = series.map((s: any) => ({
    ...s,
    renderValues: isIndexed ? indexedValues(s.values ?? []) : s.values ?? [],
  }));

  const allValues = preparedSeries.flatMap((s: any) =>
    s.renderValues.map((v: any) => Number(v.value))
  );

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;

  function xy(values: any[], index: number, value: number) {
    const x = pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2);
    const y =
      chartTop +
      chartHeight -
      chartPad -
      ((value - min) / span) * (chartHeight - chartPad * 1.5);
    return { x, y };
  }

  const gridLines = [0, 1, 2, 3, 4].map((i) => {
    const y = chartTop + 35 + i * 75;
    return `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" stroke="#d8dee9" stroke-width="1" />`;
  });

  const lines = preparedSeries
    .map((s: any, seriesIndex: number) => {
      const points = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");

      const stroke = seriesIndex === 0 ? "#0b3a67" : "#7a8899";

      const circles = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${stroke}" />`;
        })
        .join("\n");

      return `
        <path d="${points}" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        ${circles}
      `;
    })
    .join("\n");

  const xLabels = (preparedSeries[0]?.renderValues ?? [])
    .map((v: any, index: number) => {
      const p = xy(preparedSeries[0].renderValues, index, Number(v.value));
      return `<text x="${p.x.toFixed(1)}" y="${height - 95}" text-anchor="middle" font-size="18" fill="#374151">${v.period}</text>`;
    })
    .join("\n");

  const legend = preparedSeries
    .map((s: any, index: number) => {
      const color = index === 0 ? "#0b3a67" : "#7a8899";
      return `
        <rect x="${pad + index * 380}" y="${height - 58}" width="18" height="18" fill="${color}" />
        <text x="${pad + 28 + index * 380}" y="${height - 43}" font-size="18" fill="#1f2937">${escapeXml(s.title)}</text>
      `;
    })
    .join("\n");

  const latest = preparedSeries[0];
  const footer = `Source: ${latest?.source_metadata?.datasource ?? latest?.source_name ?? "Source"} · ${latest?.source_metadata?.table_id ?? ""} · ${latest?.coverage_start ?? ""}-${latest?.coverage_end ?? ""} · Human review required`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>

  <rect x="0" y="0" width="${width}" height="108" fill="#0b3a67"/>
  <text x="48" y="48" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${escapeXml(spec.placeholder)}</text>
  <text x="48" y="82" font-family="Arial, sans-serif" font-size="18" fill="#dbeafe">${escapeXml(spec.purpose)}</text>

  <text x="48" y="135" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">${isIndexed ? "Indexed output, 2016 = 100" : escapeXml(latest?.unit ?? "")}</text>

  ${gridLines.join("\n")}

  ${lines}

  ${xLabels}

  <text x="${width - 48}" y="135" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#374151">
    Latest: ${latest?.latest_period ?? ""} · ${formatValue(Number(latest?.latest_value ?? 0))} · YoY ${latest?.latest_yoy_percent ?? "n/a"}%
  </text>

  ${legend}

  <line x1="48" y1="${height - 78}" x2="${width - 48}" y2="${height - 78}" stroke="#e5e7eb"/>
  <text x="48" y="${height - 20}" font-family="Arial, sans-serif" font-size="14" fill="#4b5563">${escapeXml(footer)}</text>
  <text x="${width - 48}" y="${height - 20}" text-anchor="end" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0b3a67">ZNBW Intelligence</text>
</svg>`;
}

const specs = readJson(specFile);
fs.mkdirSync(outputDir, { recursive: true });

const rendered = (specs.graph_specs ?? []).map((spec: any) => {
  const fileName = `${safeFileName(spec.graph_spec_id)}.svg`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, renderSvg(spec));

  return {
    graph_spec_id: spec.graph_spec_id,
    file_name: fileName,
    public_path: `/admin/intelligence-data/assets/generated-graphs/${fileName}`,
    output_path: outputPath,
    rendered_at: new Date().toISOString(),
  };
});

const manifest = {
  manifest_version: "rendered-graph-assets-v0.1",
  generated_at: new Date().toISOString(),
  asset_count: rendered.length,
  assets: rendered,
};

fs.writeFileSync(
  path.join(outputDir, "rendered-graph-assets-v0.1.json"),
  JSON.stringify(manifest, null, 2)
);

console.log({
  rendered_count: rendered.length,
  output_dir: outputDir,
});
