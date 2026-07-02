#!/usr/bin/env bash
set -u

ROOT="/opt/Zenith-Bridge-Gateway"
OUT_DIR="$ROOT/artifacts/api-server/data/maintenance"
OUT_FILE="$OUT_DIR/overall-health-v0.1.json"

mkdir -p "$OUT_DIR"
cd "$ROOT" || exit 1

export HS_NOW="$(date -Iseconds)"
export HS_BRANCH="$(git branch --show-current 2>/dev/null || echo unknown)"
export HS_DIRTY_COUNT="$(git status --porcelain | wc -l | tr -d ' ')"
export HS_DISK_USED="$(df / | awk 'NR==2 {print $5}' | tr -d '%')"
export HS_MEM_AVAILABLE_MB="$(free -m | awk '/Mem:/ {print $7}')"

export HS_WEBSITE_CODE="$(curl -s -o /dev/null -w '%{http_code}' https://zenithnovabridgewave.com || echo 000)"
export HS_ADMIN_CODE="$(curl -s -o /dev/null -w '%{http_code}' https://zenithnovabridgewave.com/admin/login || echo 000)"
export HS_API_HEALTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' https://zenithnovabridgewave.com/api/v1/health || echo 000)"
export HS_FEATURED_CODE="$(curl -s -o /dev/null -w '%{http_code}' https://zenithnovabridgewave.com/api/v1/articles/featured || echo 000)"

export HS_PREVIEW_EXISTS="false"
export HS_GRAPH_EXISTS="false"

[ -f "$ROOT/artifacts/api-server/data/intelligence/article-preview-package-v0.1.json" ] && export HS_PREVIEW_EXISTS="true"
[ -f "$ROOT/artifacts/api-server/data/intelligence/article-graph-attachment-package-v0.1.json" ] && export HS_GRAPH_EXISTS="true"

node <<'NODE'
const fs = require("fs");

const num = (v) => Number(v || 0);
const bool = (v) => v === "true";

const warnings = [];
const criticals = [];

const website = num(process.env.HS_WEBSITE_CODE);
const admin = num(process.env.HS_ADMIN_CODE);
const apiHealth = num(process.env.HS_API_HEALTH_CODE);
const featured = num(process.env.HS_FEATURED_CODE);
const dirty = num(process.env.HS_DIRTY_COUNT);
const disk = num(process.env.HS_DISK_USED);
const mem = num(process.env.HS_MEM_AVAILABLE_MB);

if (website !== 200) criticals.push(`website_http_${website}`);
if (admin !== 200) criticals.push(`admin_http_${admin}`);
if (apiHealth !== 200) criticals.push(`api_health_http_${apiHealth}`);
if (featured !== 200) warnings.push(`featured_http_${featured}`);

if (dirty > 100) criticals.push(`git_dirty_count_${dirty}`);
else if (dirty > 25) warnings.push(`git_dirty_count_${dirty}`);
if (disk > 80) warnings.push(`disk_used_${disk}%`);
if (mem < 300) warnings.push(`low_memory_${mem}mb`);
if (!bool(process.env.HS_PREVIEW_EXISTS)) warnings.push("missing_article_preview_package");
if (!bool(process.env.HS_GRAPH_EXISTS)) warnings.push("missing_graph_attachment_package");

const overall_status =
  criticals.length > 0 ? "red" : warnings.length > 0 ? "amber" : "green";

const report = {
  report_version: "hygiene-smurf-overall-health-v0.1",
  generated_at: process.env.HS_NOW,
  overall_status,
  branch: process.env.HS_BRANCH,
  checks: {
    git: { dirty_count: dirty },
    resources: {
      disk_used_percent: disk,
      memory_available_mb: mem
    },
    endpoints: {
      website,
      admin_login: admin,
      api_health: apiHealth,
      featured_articles: featured
    },
    intelligence_packages: {
      article_preview_exists: bool(process.env.HS_PREVIEW_EXISTS),
      graph_attachment_exists: bool(process.env.HS_GRAPH_EXISTS)
    }
  },
  warnings,
  criticals
};

fs.writeFileSync(
  "/opt/Zenith-Bridge-Gateway/artifacts/api-server/data/maintenance/overall-health-v0.1.json",
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
NODE
