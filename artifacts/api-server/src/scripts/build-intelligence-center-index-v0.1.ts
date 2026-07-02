import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function esc(v: any) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const candidates = readJson(path.join(root, "exports/article-generator/smurf-bi-candidate-manifest-v0.1.json"));
const assets = readJson(path.join(root, "exports/article-generator/intelligence-asset-manifest-v0.1.json"));

const candidateCards = candidates.candidates.map((c: any) => `
  <div class="card candidate">
    <span class="badge pre">PRE-DRAFT</span>
    <h2>${esc(c.title)}</h2>
    <p>${esc(c.country)} · ${esc(c.category)}</p>
    <p><strong>Grade:</strong> ${esc(c.publication_grade)}</p>
    <p><strong>Authority:</strong> ${esc(c.authority_score)} / ${esc(c.authority_band)}</p>
    <a href="${esc(c.preview_url)}" target="_blank">Open preview</a>
  </div>
`).join("");

const assetCards = assets.assets.map((a: any) => `
  <div class="card asset">
    <span class="badge asset-badge">INTELLIGENCE ASSET</span>
    <h2>${esc(a.title)}</h2>
    <p><strong>Type:</strong> ${esc(a.asset_type)} · ${esc(a.file_type)}</p>
    <p><strong>Status:</strong> ${esc(a.verification_status)} · CMS allowed: ${a.cms_use_allowed ? "Yes" : "No"}</p>
    <a href="${esc(a.public_url)}" target="_blank">Open asset</a>
  </div>
`).join("");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>ZNBW Intelligence Center</title>
  <style>
    body { margin:0; font-family:Arial,sans-serif; background:#0f172a; color:#e5e7eb; }
    header { padding:32px 42px; background:#020617; border-bottom:1px solid #334155; }
    h1 { margin:0; color:#fff; }
    main { max-width:1120px; margin:32px auto; padding:0 24px; }
    h2.section { color:#67e8f9; margin-top:36px; }
    .card { background:#111827; border:1px solid #334155; border-radius:14px; padding:22px; margin-bottom:18px; }
    .candidate { border-left:6px solid #f59e0b; }
    .asset { border-left:6px solid #14b8a6; }
    .badge { display:inline-block; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; }
    .pre { background:#fef3c7; color:#92400e; }
    .asset-badge { background:#ccfbf1; color:#115e59; }
    a { color:#67e8f9; font-weight:700; }
  </style>
</head>
<body>
  <header>
    <h1>ZNBW Intelligence Center</h1>
    <p>Read-only intelligence output · separated from CMS production articles</p>
  </header>
  <main>
    <h2 class="section">Candidate Articles</h2>
    ${candidateCards}
    <h2 class="section">Intelligence Assets</h2>
    ${assetCards}
  </main>
</body>
</html>`;

const outDir = path.join(root, "exports/article-generator/intelligence-center");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "index.html");
fs.writeFileSync(outPath, html);

console.log({
  page_version: "intelligence-center-index-v0.1",
  candidates: candidates.candidates.length,
  assets: assets.assets.length,
  output: outPath
});
