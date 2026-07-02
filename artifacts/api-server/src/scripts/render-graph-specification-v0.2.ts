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

function wrapText(value: string, maxChars = 58) {
  const words = String(value ?? "").split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(1);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  return `${value.toFixed(1)}%`;
}

function indexedValues(values: any[]) {
  const base = Number(values[0]?.value ?? 1);
  return values.map((v) => ({
    period: v.period,
    value: (Number(v.value) / base) * 100,
  }));
}

function inferChartMode(spec: any) {
  const text = `${spec.placeholder ?? ""} ${spec.recommended_chart_type ?? ""}`.toLowerCase();

  if (
    text.includes("bar chart") ||
    text.includes("year-on-year growth comparison") ||
    text.includes("latest year-on-year growth")
  ) {
    return "bar_yoy";
  }

  if (String(spec.recommended_chart_type ?? "").includes("indexed")) {
    return "indexed_line";
  }

  return "line";
}

function scale(values: number[], minOverride?: number) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = minOverride ?? rawMin;
  const max = rawMax;
  const span = max - min || 1;
  return { min, max, span };
}

function renderTitle(lines: string[]) {
  return lines
    .map(
      (line, index) =>
        `<text x="48" y="${42 + index * 34}" font-family="Arial, sans-serif" font-size="${index === 0 ? 28 : 24}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n");
}

function renderLineChart(spec: any, mode: "line" | "indexed_line") {
  const width = 1200;
  const height = 720;
  const left = 92;
  const right = 72;
  const top = 165;
  const bottom = 135;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const isIndexed = mode === "indexed_line";
  const series = (spec.series ?? []).map((s: any) => ({
    ...s,
    renderValues: isIndexed ? indexedValues(s.values ?? []) : s.values ?? [],
  }));

  const allValues = series.flatMap((s: any) =>
    s.renderValues.map((v: any) => Number(v.value))
  );

  const { min, max, span } = scale(allValues);
  const titleLines = wrapText(spec.placeholder, 64);

  function xy(values: any[], index: number, value: number) {
    const x = left + (index / Math.max(values.length - 1, 1)) * chartWidth;
    const y = top + chartHeight - ((value - min) / span) * chartHeight;
    return { x, y };
  }

  const ticks = [0, 1, 2, 3, 4].map((i) => {
    const value = min + (span * (4 - i)) / 4;
    const y = top + (chartHeight * i) / 4;
    return {
      value,
      y,
    };
  });

  const grid = ticks
    .map(
      (tick) => `
        <line x1="${left}" y1="${tick.y.toFixed(1)}" x2="${width - right}" y2="${tick.y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1" />
        <text x="${left - 14}" y="${(tick.y + 5).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#64748b">${isIndexed ? formatNumber(tick.value) : formatNumber(tick.value)}</text>
      `
    )
    .join("\n");

  const lineColors = ["#0b3a67", "#64748b", "#2563eb"];

  const lines = series
    .map((s: any, seriesIndex: number) => {
      const color = lineColors[seriesIndex % lineColors.length];

      const pathData = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");

      const circles = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" />`;
        })
        .join("\n");

      const lastValue = s.renderValues[s.renderValues.length - 1];
      const lastPoint = lastValue
        ? xy(s.renderValues, s.renderValues.length - 1, Number(lastValue.value))
        : null;

      const endLabel = lastPoint
        ? `<text x="${Math.min(lastPoint.x + 10, width - 210).toFixed(1)}" y="${(lastPoint.y - 8).toFixed(1)}" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${color}">${escapeXml(s.title)} · ${isIndexed ? formatNumber(Number(lastValue.value)) : formatNumber(Number(lastValue.value))}</text>`
        : "";

      return `
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        ${circles}
        ${endLabel}
      `;
    })
    .join("\n");

  const periods = series[0]?.renderValues ?? [];
  const xLabels = periods
    .map((v: any, index: number) => {
      const p = xy(periods, index, Number(v.value));
      return `<text x="${p.x.toFixed(1)}" y="${height - 92}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#475569">${escapeXml(v.period)}</text>`;
    })
    .join("\n");

  const legend = series
    .map((s: any, index: number) => {
      const color = lineColors[index % lineColors.length];
      return `
        <rect x="${left + index * 380}" y="${height - 58}" width="18" height="18" rx="4" fill="${color}" />
        <text x="${left + 28 + index * 380}" y="${height - 43}" font-family="Arial, sans-serif" font-size="16" fill="#1f2937">${escapeXml(s.title)}</text>
      `;
    })
    .join("\n");

  const latest = series[0];
  const latestValue = Number(latest?.latest_value ?? 0);
  const latestText = isIndexed
    ? `Indexed trend · 2016 = 100`
    : `Latest ${latest?.latest_period ?? ""}: ${formatNumber(latestValue)} · YoY ${latest?.latest_yoy_percent ?? "n/a"}%`;

  const footer = `Source: ${latest?.source_metadata?.datasource ?? latest?.source_name ?? "Source"} · ${latest?.source_metadata?.table_id ?? ""} · ${latest?.coverage_start ?? ""}-${latest?.coverage_end ?? ""} · Human review required`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="118" fill="#0b3a67"/>
  ${renderTitle(titleLines)}
  <text x="48" y="102" font-family="Arial, sans-serif" font-size="17" fill="#dbeafe">${escapeXml(spec.purpose)}</text>

  <text x="${left}" y="142" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111827">${escapeXml(isIndexed ? "Index, 2016 = 100" : latest?.unit ?? "")}</text>
  <text x="${width - right}" y="142" text-anchor="end" font-family="Arial, sans-serif" font-size="15" fill="#475569">${escapeXml(latestText)}</text>

  ${grid}
  <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" stroke="#cbd5e1" />
  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="#cbd5e1" />

  ${lines}
  ${xLabels}
  ${legend}

  <line x1="48" y1="${height - 78}" x2="${width - 48}" y2="${height - 78}" stroke="#e5e7eb"/>
  <text x="48" y="${height - 20}" font-family="Arial, sans-serif" font-size="14" fill="#4b5563">${escapeXml(footer)}</text>
  <text x="${width - 48}" y="${height - 20}" text-anchor="end" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0b3a67">ZNBW Intelligence</text>
</svg>`;
}

function renderYoYBarChart(spec: any) {
  const width = 1200;
  const height = 720;
  const left = 110;
  const right = 80;
  const top = 170;
  const bottom = 135;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const series = spec.series ?? [];
  const bars = series.map((s: any) => ({
    label: s.title,
    value: Number(s.latest_yoy_percent ?? 0),
    latest_period: s.latest_period,
    source_name: s.source_name,
    source_metadata: s.source_metadata,
  }));

  const values = bars.map((b: any) => b.value);
  const minBase = Math.min(0, ...values);
  const { min, max, span } = scale(values, minBase);
  const zeroY = top + chartHeight - ((0 - min) / span) * chartHeight;

  const titleLines = wrapText(spec.placeholder, 64);
  const barWidth = Math.min(220, chartWidth / Math.max(bars.length * 1.8, 1));
  const gap = chartWidth / Math.max(bars.length, 1);
  const colors = ["#0b3a67", "#64748b", "#2563eb"];

  const grid = [0, 1, 2, 3, 4].map((i) => {
    const value = min + (span * (4 - i)) / 4;
    const y = top + (chartHeight * i) / 4;
    return `
      <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1" />
      <text x="${left - 14}" y="${(y + 5).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#64748b">${formatPercent(value)}</text>
    `;
  }).join("\n");

  const barSvg = bars.map((bar: any, index: number) => {
    const x = left + index * gap + gap / 2 - barWidth / 2;
    const y = top + chartHeight - ((bar.value - min) / span) * chartHeight;
    const h = Math.abs(zeroY - y);
    const color = colors[index % colors.length];

    return `
      <rect x="${x.toFixed(1)}" y="${Math.min(y, zeroY).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="10" fill="${color}" />
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(Math.min(y, zeroY) - 12).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${color}">${formatPercent(bar.value)}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 100}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#334155">${escapeXml(wrapText(bar.label, 22)[0] ?? bar.label)}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 78}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#334155">${escapeXml(wrapText(bar.label, 22)[1] ?? "")}</text>
    `;
  }).join("\n");

  const first = series[0];
  const footer = `Source: ${first?.source_metadata?.datasource ?? first?.source_name ?? "Source"} · ${first?.source_metadata?.table_id ?? ""} · ${first?.latest_period ?? ""} · Human review required`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="118" fill="#0b3a67"/>
  ${renderTitle(titleLines)}
  <text x="48" y="102" font-family="Arial, sans-serif" font-size="17" fill="#dbeafe">${escapeXml(spec.purpose)}</text>

  <text x="${left}" y="142" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111827">Latest year-on-year growth</text>

  ${grid}
  <line x1="${left}" y1="${zeroY.toFixed(1)}" x2="${width - right}" y2="${zeroY.toFixed(1)}" stroke="#94a3b8" stroke-width="1.5" />
  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="#cbd5e1" />

  ${barSvg}

  <line x1="48" y1="${height - 78}" x2="${width - 48}" y2="${height - 78}" stroke="#e5e7eb"/>
  <text x="48" y="${height - 20}" font-family="Arial, sans-serif" font-size="14" fill="#4b5563">${escapeXml(footer)}</text>
  <text x="${width - 48}" y="${height - 20}" text-anchor="end" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0b3a67">ZNBW Intelligence</text>
</svg>`;
}

function renderSvg(spec: any) {
  const mode = inferChartMode(spec);

  if (mode === "bar_yoy") {
    return renderYoYBarChart(spec);
  }

  if (mode === "indexed_line") {
    return renderLineChart(spec, "indexed_line");
  }

  return renderLineChart(spec, "line");
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
    render_engine_version: "render-graph-specification-v0.2",
    rendered_at: new Date().toISOString(),
  };
});

const manifest = {
  manifest_version: "rendered-graph-assets-v0.2",
  generated_at: new Date().toISOString(),
  asset_count: rendered.length,
  assets: rendered,
};

fs.writeFileSync(
  path.join(outputDir, "rendered-graph-assets-v0.2.json"),
  JSON.stringify(manifest, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, "rendered-graph-assets-v0.1.json"),
  JSON.stringify(
    {
      ...manifest,
      manifest_version: "rendered-graph-assets-v0.1",
      compatibility_note:
        "Compatibility manifest written by render-graph-specification-v0.2.",
    },
    null,
    2
  )
);

console.log({
  rendered_count: rendered.length,
  output_dir: outputDir,
  manifest: "rendered-graph-assets-v0.2.json",
});
