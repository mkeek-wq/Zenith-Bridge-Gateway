import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function esc(v: any) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapLabel(label: string) {
  if (label.length <= 16) return [label];
  if (label === "Transport Engineering") return ["Transport", "Engineering"];
  if (label === "Total Manufacturing") return ["Total", "Manufacturing"];
  return label.split(" ");
}

const spec = readJson(
  path.join(root, "exports/article-generator/institutional-graph-render-spec-v0.1.json")
);

const data = spec.chart?.data ?? [];
if (data.length === 0) throw new Error("No chart data found.");

const outDir = path.join(root, "exports/article-generator/graphs");
fs.mkdirSync(outDir, { recursive: true });

const width = 1200;
const height = 760;
const headerH = 112;

const margin = { top: 170, right: 80, bottom: 165, left: 115 };
const chartW = width - margin.left - margin.right;
const chartH = 390;

const values = data.map((d: any) => Number(d.value));
const minValue = Math.min(0, ...values);
const maxValue = Math.max(0, ...values);
const pad = Math.max(2, (maxValue - minValue) * 0.08);
const yMin = minValue - pad;
const yMax = maxValue + pad;
const range = yMax - yMin || 1;

function yScale(v: number) {
  return margin.top + ((yMax - v) / range) * chartH;
}

const zeroY = yScale(0);
const barGap = 42;
const barW = (chartW - barGap * (data.length - 1)) / data.length;

const tickValues = [yMin, yMin + range * 0.25, 0, yMin + range * 0.75, yMax]
  .filter((v, i, arr) => i === arr.findIndex((x) => Math.abs(x - v) < 0.01))
  .sort((a, b) => a - b);

const ticks = tickValues.map((v) => {
  const y = yScale(v);
  const isZero = Math.abs(v) < 0.001;

  return `
    <line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" class="${isZero ? "zero-grid" : "grid"}"></line>
    <text x="${margin.left - 18}" y="${y + 5}" text-anchor="end" class="tick">${v.toFixed(1)}%</text>
  `;
}).join("\n");

const bars = data.map((d: any, i: number) => {
  const value = Number(d.value);
  const x = margin.left + i * (barW + barGap);
  const y = value >= 0 ? yScale(value) : zeroY;
  const h = Math.max(2, Math.abs(yScale(value) - zeroY));
  const labelY = value >= 0 ? y - 14 : y + h + 24;

  const labelLines = wrapLabel(String(d.label));
  const labelSvg = labelLines.map((line, idx) => {
    const yText = height - 96 + idx * 21;
    return `<text x="${x + barW / 2}" y="${yText}" text-anchor="middle" class="sector">${esc(line)}</text>`;
  }).join("\n");

  return `
    <rect class="bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="7"></rect>
    <text x="${x + barW / 2}" y="${labelY}" text-anchor="middle" class="value">${value.toFixed(1)}%</text>
    ${labelSvg}
    <text x="${x + barW / 2}" y="${height - 38}" text-anchor="middle" class="period">${esc(d.period)}</text>
  `;
}).join("\n");

const sources = (spec.source_panel ?? [])
  .map((s: any) => `${s.sector}: ${s.source_name}, ${s.period}`)
  .join(" | ");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: 700 34px Arial, sans-serif; fill: white; }
    .subtitle { font: 400 20px Arial, sans-serif; fill: white; opacity: 0.92; }

    .plot-bg { fill: #ffffff; }
    .grid { stroke: #e5e7eb; stroke-width: 1; }
    .zero-grid { stroke: #111827; stroke-width: 1.7; }

    .axis { stroke: #111827; stroke-width: 1.7; }
    .bar { fill: #1f4e79; }
    .value { font: 700 21px Arial, sans-serif; fill: #111827; }
    .sector { font: 700 17px Arial, sans-serif; fill: #111827; }
    .period { font: 400 14px Arial, sans-serif; fill: #4b5563; }
    .tick { font: 14px Arial, sans-serif; fill: #374151; }

    .source { font: 12px Arial, sans-serif; fill: #374151; }
    .note { font: 12px Arial, sans-serif; fill: #374151; }
    .frame { fill: none; stroke: #d1d5db; stroke-width: 1; }
  </style>

  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="${headerH}" fill="#12355b"/>

  <text x="48" y="45" class="title">${esc(spec.chart.title)}</text>
  <text x="48" y="78" class="subtitle">${esc(spec.chart.subtitle)}</text>

  <rect x="40" y="${headerH + 22}" width="${width - 80}" height="${height - headerH - 42}" rx="10" class="plot-bg"/>
  <rect x="40" y="${headerH + 22}" width="${width - 80}" height="${height - headerH - 42}" rx="10" class="frame"/>

  ${ticks}

  <line x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${margin.top + chartH}" class="axis"></line>

  ${bars}

  <text x="${margin.left}" y="${height - 18}" class="source">Source: ${esc(sources)}</text>
  <text x="${margin.left}" y="${height - 4}" class="note">${esc(spec.verification_note)}</text>
</svg>
`;

const svgPath = path.join(outDir, "petroleum-sector-comparison-v0.1.svg");
fs.writeFileSync(svgPath, svg);

const report = {
  renderer_version: "institutional-graph-renderer-v0.2",
  generated_at: new Date().toISOString(),
  source_render_spec: spec.render_spec_version,
  svg_output: svgPath,
  data_points: data.length,
  status: "svg_rendered",
  note: "v0.2 improves contrast, plot background, labels, and institutional styling."
};

const reportPath = path.join(root, "exports/article-generator/institutional-graph-renderer-report-v0.1.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log({
  renderer_version: report.renderer_version,
  status: report.status,
  data_points: report.data_points,
  svg_output: svgPath,
  report: reportPath
});
