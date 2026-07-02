import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const assets = readJson(path.join(root, "exports/article-generator/intelligence-asset-manifest-v0.1.json"));
const cms = readJson(path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json"));

const output = {
  package_version: "cms-intelligence-asset-export-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Allow CMS editor to select verified Intelligence Engine assets without direct engine access.",
  article_slug: cms.article_payload.slug,
  article_title: cms.article_payload.title,
  asset_sources: {
    manual_uploads: {
      label: "Upload from computer",
      source_type: "user_laptop",
      cms_allowed: true
    },
    intelligence_assets: {
      label: "Select Intelligence Asset",
      source_type: "ZNBW_BI_Engine",
      cms_allowed: true,
      manifest: "exports/article-generator/intelligence-asset-manifest-v0.1.json"
    }
  },
  cms_selectable_assets: assets.assets.filter((a: any) => a.cms_use_allowed === true),
  governance: {
    public_naming_required: true,
    internal_codename_blocked_publicly: true,
    cms_must_not_access_engine_directly: true,
    cms_reads_export_packages_only: true
  }
};

const outPath = path.join(root, "exports/article-generator/cms-intelligence-asset-export-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  selectable_assets: output.cms_selectable_assets.length,
  output: outPath
});
