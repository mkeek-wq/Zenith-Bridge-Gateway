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

const manifest = readJson(path.join(root, "exports/article-generator/smurf-bi-candidate-manifest-v0.1.json"));

const cards = manifest.candidates.map((c: any) => `
  <div class="card">
    <div class="badge">${esc(c.publication_grade)}</div>
    <h2>${esc(c.title)}</h2>
    <p class="meta">${esc(c.country)} · ${esc(c.category)}</p>

    <div class="grid">
      <div><strong>Status</strong><br>${esc(c.cms_status)}</div>
      <div><strong>Authority</strong><br>${esc(c.authority_score)} / ${esc(c.authority_band)}</div>
      <div><strong>Graph</strong><br>${c.graph_ready ? "Ready" : "Not ready"}</div>
      <div><strong>Metrics</strong><br>${esc(c.verified_metrics_count)} verified</div>
    </div>

    <p><strong>Promotion status:</strong> ${esc(c.promotion_status)}</p>

    <div class="actions">
      <a href="${esc(c.preview_url)}" target="_blank">Open Preview</a>
      <a href="${esc(c.graph_url)}" target="_blank">Open Graph</a>
    </div>
  </div>
`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SMURF BI Engine Output</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin:0; background:#f3f4f6; font-family:Arial,sans-serif; color:#111827; }
    header { background:#12355b; color:white; padding:28px 40px; }
    header h1 { margin:0; font-size:30px; }
    header p { margin:8px 0 0; opacity:.9; }
    main { max-width:1100px; margin:30px auto; padding:0 24px; }
    .section-title { margin:0 0 18px; color:#12355b; }
    .card { background:white; border:1px solid #e5e7eb; border-radius:14px; padding:26px; box-shadow:0 8px 24px rgba(0,0,0,.04); margin-bottom:22px; }
    .badge { display:inline-block; background:#e0f2fe; color:#075985; padding:6px 10px; border-radius:999px; font-size:13px; font-weight:700; }
    h2 { margin:14px 0 6px; }
    .meta { color:#4b5563; }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:20px 0; }
    .grid div { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px; }
    .actions a { display:inline-block; margin-right:12px; background:#12355b; color:white; text-decoration:none; padding:10px 14px; border-radius:8px; font-weight:700; }
  </style>
</head>
<body>
  <header>
    <h1>SMURF BI Engine Output</h1>
    <p>Sandbox intelligence output · pre-draft review · manual CMS copy stage</p>
  </header>
  <main>
    <h2 class="section-title">Candidate Articles</h2>
    ${cards}
  </main>
</body>
</html>`;

const outDir = path.join(root, "exports/article-generator/smurf-bi");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "index.html");
fs.writeFileSync(outPath, html);

console.log({
  page_version: "smurf-bi-index-html-v0.1",
  candidates: manifest.candidates.length,
  output: outPath
});
