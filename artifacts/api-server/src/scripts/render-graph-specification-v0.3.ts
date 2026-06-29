import fs from "fs";
import path from "path";

const root = process.cwd();

const specFile = path.join(
  root,
  "data/intelligence/graph-specification-package-v0.1.json"
);

const outputDir =
  "/var/www/zenith-admin/intelligence-data/assets/generated-graphs";

const PALETTE = {
  navy: "#0B3A67",
  blue: "#2563EB",
  orange: "#E67E22",
  slate: "#475569",
  grey: "#94A3B8",
  grid: "#CBD5E1",
  lightGrid: "#E5E7EB",
  text: "#0F172A",
  muted: "#64748B",
  red: "#DC2626",
  green: "#16A34A",
  bg: "#FFFFFF",
};

const LINE_COLORS = [
  PALETTE.navy,
  PALETTE.orange,
  PALETTE.blue,
  PALETTE.slate,
];

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

function wrapText(value: string, maxChars = 56, maxLines = 2) {
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
  return lines.slice(0, maxLines);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(1);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
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

  const padding = (rawMax - rawMin || 1) * 0.12;
  const min = minOverride ?? rawMin - padding;
  const max = rawMax + padding;
  const span = max - min || 1;

  return { min, max, span };
}

function renderTitle(lines: string[]) {
  return lines
    .map(
      (line, index) =>
        `<text x="52" y="${44 + index * 34}" font-family="Arial, sans-serif" font-size="${index === 0 ? 31 : 25}" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n");
}

function renderKpiCard(params: {
  x: number;
  y: number;
  title: string;
  value: string;
  subValue?: string;
}) {
  return `
    <rect x="${params.x}" y="${params.y}" width="230" height="82" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <text x="${params.x + 16}" y="${params.y + 27}" font-family="Arial, sans-serif" font-size="14" font-weight="800" fill="${PALETTE.muted}">${escapeXml(params.title)}</text>
    <text x="${params.x + 16}" y="${params.y + 56}" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="${PALETTE.navy}">${escapeXml(params.value)}</text>
    <text x="${params.x + 16}" y="${params.y + 75}" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${PALETTE.slate}">${escapeXml(params.subValue ?? "")}</text>
  `;
}

function renderLineChart(spec: any, mode: "line" | "indexed_line") {
  const width = 1280;
  const height = 800;

  const left = 110;
  const right = 90;
  const top = 235;
  const bottom = 150;

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
  const titleLines = wrapText(spec.placeholder, 64, 2);

  function xy(values: any[], index: number, value: number) {
    const x = left + (index / Math.max(values.length - 1, 1)) * chartWidth;
    const y = top + chartHeight - ((value - min) / span) * chartHeight;
    return { x, y };
  }

  const ticks = [0, 1, 2, 3, 4].map((i) => {
    const value = max - (span * i) / 4;
    const y = top + (chartHeight * i) / 4;
    return { value, y };
  });

  const grid = ticks
    .map(
      (tick) => `
        <line x1="${left}" y1="${tick.y.toFixed(1)}" x2="${width - right}" y2="${tick.y.toFixed(1)}" stroke="${PALETTE.lightGrid}" stroke-width="1.5" />
        <text x="${left - 18}" y="${(tick.y + 6).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${PALETTE.muted}">${formatNumber(tick.value)}</text>
      `
    )
    .join("\n");

    const legend = series
    .map((s: any, index: number) => {
      const color = LINE_COLORS[index % LINE_COLORS.length];
      return `
        <g>
          <rect x="${left}" y="${148 + index * 30}" width="28" height="8" rx="4" fill="${color}" />
          <text x="${left + 40}" y="${158 + index * 30}" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${PALETTE.text}">${escapeXml(s.title)}</text>
        </g>
      `;
    })
    .join("\n");

  const lines = series
    .map((s: any, seriesIndex: number) => {
      const color = LINE_COLORS[seriesIndex % LINE_COLORS.length];

      const pathData = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");

      const circles = s.renderValues
        .map((v: any, index: number) => {
          const p = xy(s.renderValues, index, Number(v.value));
          return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="#ffffff" stroke="${color}" stroke-width="4" />`;
        })
        .join("\n");

      return `
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
        ${circles}
      `;
    })
    .join("\n");

  const periods = series[0]?.renderValues ?? [];
  const xLabels = periods
    .filter((_v: any, index: number) => {
      if (periods.length <= 7) return true;
      return index === 0 || index === periods.length - 1 || index % 2 === 0;
    })
    .map((v: any, index: number) => {
      const originalIndex = periods.findIndex((p: any) => p.period === v.period);
      const p = xy(periods, originalIndex >= 0 ? originalIndex : index, Number(v.value));
      return `<text x="${p.x.toFixed(1)}" y="${height - 108}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${PALETTE.slate}">${escapeXml(v.period)}</text>`;
    })
    .join("\n");

  const latest = series[0];
  const latestValue = Number(latest?.latest_value ?? 0);

  const latestCard = renderKpiCard({
    x: width - right - 245,
    y: 140,
    title: isIndexed ? "Latest index" : `Latest ${latest?.latest_period ?? ""}`,
    value: isIndexed
      ? `${formatNumber(Number(latest?.renderValues?.at?.(-1)?.value ?? 0))}`
      : formatNumber(latestValue),
    subValue: isIndexed
      ? "2016 = 100"
      : `YoY ${formatPercent(Number(latest?.latest_yoy_percent ?? 0))}`,
  });

  const footer = `Source: ${latest?.source_metadata?.datasource ?? latest?.source_name ?? "Source"} · ${latest?.source_metadata?.table_id ?? ""} · ${latest?.coverage_start ?? ""}-${latest?.coverage_end ?? ""} · Human review required`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${PALETTE.bg}"/>
  <rect x="0" y="0" width="${width}" height="126" fill="${PALETTE.navy}"/>
  ${renderTitle(titleLines)}
  <text x="52" y="106" font-family="Arial, sans-serif" font-size="19" font-weight="600" fill="#DBEAFE">${escapeXml(spec.purpose)}</text>

  ${legend}
  ${latestCard}

  <text x="${left}" y="${top - 18}" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${PALETTE.text}">${escapeXml(isIndexed ? "Index, 2016 = 100" : latest?.unit ?? "")}</text>

  ${grid}
  <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" stroke="${PALETTE.grid}" stroke-width="2" />
  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="${PALETTE.grid}" stroke-width="2" />

  ${lines}
  ${xLabels}

  <line x1="52" y1="${height - 82}" x2="${width - 52}" y2="${height - 82}" stroke="${PALETTE.lightGrid}" stroke-width="1.5"/>
  <text x="52" y="${height - 24}" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="${PALETTE.muted}">${escapeXml(footer)}</text>
  <text x="${width - 52}" y="${height - 24}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="${PALETTE.navy}">ZNBW Intelligence</text>
</svg>`;
}

function renderYoYBarChart(spec: any) {
  const width = 1280;
  const height = 800;

  const left = 120;
  const right = 90;
  const top = 210;
  const bottom = 155;

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
  const titleLines = wrapText(spec.placeholder, 64, 2);

  const barWidth = Math.min(250, chartWidth / Math.max(bars.length * 2.2, 1));
  const gap = chartWidth / Math.max(bars.length, 1);

  const grid = [0, 1, 2, 3, 4]
    .map((i) => {
      const value = max - (span * i) / 4;
      const y = top + (chartHeight * i) / 4;

      return `
        <line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}" stroke="${PALETTE.lightGrid}" stroke-width="1.5" />
        <text x="${left - 18}" y="${(y + 6).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${PALETTE.muted}">${formatPercent(value)}</text>
      `;
    })
    .join("\n");

  const barSvg = bars
    .map((bar: any, index: number) => {
      const x = left + index * gap + gap / 2 - barWidth / 2;
      const y = top + chartHeight - ((bar.value - min) / span) * chartHeight;
      const h = Math.abs(zeroY - y);
      const color =
        bar.value < 0
          ? PALETTE.red
          : index === 0
            ? PALETTE.navy
            : PALETTE.orange;

      const labelLines = wrapText(bar.label, 24, 2);

      return `
        <rect x="${x.toFixed(1)}" y="${Math.min(y, zeroY).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(h, 4).toFixed(1)}" rx="14" fill="${color}" />
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(Math.min(y, zeroY) - 16).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="${color}">${formatPercent(bar.value)}</text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 118}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${PALETTE.text}">${escapeXml(labelLines[0] ?? bar.label)}</text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 94}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${PALETTE.text}">${escapeXml(labelLines[1] ?? "")}</text>
      `;
    })
    .join("\n");

  const first = series[0];

  const latestCard = renderKpiCard({
    x: width - right - 245,
    y: 140,
    title: "Primary YoY",
    value: formatPercent(Number(first?.latest_yoy_percent ?? 0)),
    subValue: `${first?.latest_period ?? ""}`,
  });

  const footer = `Source: ${first?.source_metadata?.datasource ?? first?.source_name ?? "Source"} · ${first?.source_metadata?.table_id ?? ""} · ${first?.latest_period ?? ""} · Human review required`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${PALETTE.bg}"/>
  <rect x="0" y="0" width="${width}" height="126" fill="${PALETTE.navy}"/>
  ${renderTitle(titleLines)}
  <text x="52" y="106" font-family="Arial, sans-serif" font-size="19" font-weight="600" fill="#DBEAFE">${escapeXml(spec.purpose)}</text>

  ${latestCard}

  <text x="${left}" y="${top - 18}" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${PALETTE.text}">Latest year-on-year growth</text>

  ${grid}
  <line x1="${left}" y1="${zeroY.toFixed(1)}" x2="${width - right}" y2="${zeroY.toFixed(1)}" stroke="${PALETTE.grid}" stroke-width="2" />
  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="${PALETTE.grid}" stroke-width="2" />

  ${barSvg}

  <line x1="52" y1="${height - 82}" x2="${width - 52}" y2="${height - 82}" stroke="${PALETTE.lightGrid}" stroke-width="1.5"/>
  <text x="52" y="${height - 24}" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="${PALETTE.muted}">${escapeXml(footer)}</text>
  <text x="${width - 52}" y="${height - 24}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="${PALETTE.navy}">ZNBW Intelligence</text>
</svg>`;
}

function renderSvg(spec: any) {
  const mode = inferChartMode(spec);

  if (mode === "bar_yoy") return renderYoYBarChart(spec);
  if (mode === "indexed_line") return renderLineChart(spec, "indexed_line");

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
    render_engine_version: "render-graph-specification-v0.3",
    rendered_at: new Date().toISOString(),
  };
});

const manifest = {
  manifest_version: "rendered-graph-assets-v0.3",
  generated_at: new Date().toISOString(),
  asset_count: rendered.length,
  assets: rendered,
};

fs.writeFileSync(
  path.join(outputDir, "rendered-graph-assets-v0.3.json"),
  JSON.stringify(manifest, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, "rendered-graph-assets-v0.1.json"),
  JSON.stringify(
    {
      ...manifest,
      manifest_version: "rendered-graph-assets-v0.1",
      compatibility_note:
        "Compatibility manifest written by render-graph-specification-v0.3.",
    },
    null,
    2
  )
);

console.log({
  rendered_count: rendered.length,
  output_dir: outputDir,
  manifest: "rendered-graph-assets-v0.3.json",
});
