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

function markdownToHtml(md: string) {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("# ")) return `<h1>${esc(t.slice(2))}</h1>`;
      if (t.startsWith("## ")) return `<h2>${esc(t.slice(3))}</h2>`;
      if (t.startsWith("### ")) return `<h3>${esc(t.slice(4))}</h3>`;
      if (t.startsWith("- ")) {
        const items = t.split("\n").map((x) => `<li>${esc(x.replace(/^- /, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (t === "---") return `<hr />`;
      return `<p>${esc(t).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

const cms = readJson(path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json"));

const payload = cms.article_payload;
if (!payload?.body_markdown) throw new Error("CMS payload body_markdown is empty.");

const svgPath = path.join(root, payload.graph.svg_target);
const svg = fs.existsSync(svgPath)
  ? fs.readFileSync(svgPath, "utf8")
  : `<p><strong>Graph missing:</strong> ${esc(payload.graph.svg_target)}</p>`;

const bodyHtml = markdownToHtml(payload.body_markdown);

const sources = payload.transparency_panel.source_panel
  .map((s: any) => `
    <tr>
      <td>${esc(s.sector)}</td>
      <td>${esc(s.period)}</td>
      <td>${esc(s.source_name)}</td>
      <td><span class="status">${esc(s.verification_status)}</span></td>
    </tr>
  `)
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(payload.title)} — ZNBW Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, sans-serif;
      line-height: 1.6;
    }
    .topbar {
      background: #12355b;
      color: white;
      padding: 22px 36px;
    }
    .topbar h1 {
      margin: 0;
      font-size: 24px;
    }
    .topbar p {
      margin: 6px 0 0;
      opacity: 0.9;
    }
    .wrap {
      max-width: 1120px;
      margin: 28px auto;
      padding: 0 24px;
    }
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
    }
    .badge {
      display: inline-block;
      background: #e0f2fe;
      color: #075985;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      margin-right: 8px;
    }
    .article h1 { font-size: 34px; line-height: 1.2; }
    .article h2 { margin-top: 34px; color: #12355b; }
    .article p { font-size: 18px; }
    .graph svg {
      width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 14px;
    }
    th, td {
      border-bottom: 1px solid #e5e7eb;
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f9fafb;
      color: #374151;
    }
    .status {
      font-weight: 700;
      color: #166534;
    }
    textarea {
      width: 100%;
      min-height: 340px;
      font-family: monospace;
      font-size: 13px;
      padding: 12px;
      box-sizing: border-box;
      border-radius: 10px;
      border: 1px solid #d1d5db;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>ZNBW Article Preview</h1>
    <p>Sandbox preview only — manual CMS copy stage</p>
  </div>

  <div class="wrap">
    <div class="card">
      <span class="badge">${esc(payload.publication_grade)}</span>
      <span class="badge">CMS status: ${esc(cms.cms_status)}</span>
      <span class="badge">Gate: ${esc(cms.publication_decision.recommended_status)}</span>
    </div>

    <div class="card graph">
      <h2>Institutional Graph</h2>
      ${svg}
    </div>

    <div class="card article">
      ${bodyHtml}
    </div>

    <div class="card">
      <h2>Transparency Panel</h2>
      <p><strong>Authority band:</strong> ${esc(payload.transparency_panel.authority_band)} |
      <strong>Authority score:</strong> ${esc(payload.transparency_panel.authority_score)} |
      <strong>Data integrity:</strong> ${esc(payload.transparency_panel.data_integrity)}</p>

      <table>
        <thead>
          <tr>
            <th>Sector</th>
            <th>Period</th>
            <th>Source</th>
            <th>Verification</th>
          </tr>
        </thead>
        <tbody>${sources}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Copy Article Markdown to CMS</h2>
      <textarea readonly>${esc(payload.body_markdown)}</textarea>
    </div>
  </div>
</body>
</html>`;

const outDir = path.join(root, "exports/article-generator/previews");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(
  outDir,
  `${payload.slug}-preview-v0.1.html`
);

fs.writeFileSync(outPath, html);

console.log({
  preview_version: "article-preview-html-v0.1",
  title: payload.title,
  output: outPath
});
