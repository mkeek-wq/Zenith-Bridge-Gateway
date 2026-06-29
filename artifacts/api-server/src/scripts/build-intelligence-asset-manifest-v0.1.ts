import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const graphReport = readJson(
  path.join(root, "exports/article-generator/institutional-graph-renderer-report-v0.1.json")
);

const cms = readJson(
  path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json")
);

const slug = cms.article_payload.slug;

const manifest = {
  manifest_version: "intelligence-asset-manifest-v0.1",
  generated_at: new Date().toISOString(),
  public_name: "ZNBW Intelligence Assets",
  internal_source: "ZNBW_BI_Engine",
  assets: [
    {
      asset_id: "IA_PETROLEUM_SECTOR_COMPARISON_V0_1",
      title: "Singapore Manufacturing Output Growth by Sector",
      article_slug: slug,
      asset_type: "institutional_graph",
      file_type: "svg",
      source_path: graphReport.svg_output,
      public_url: "/znbw-previews/petroleum-sector-comparison-v0.1.svg",
      source_package: graphReport.source_render_spec,
      verification_status: "verified",
      publication_allowed: true,
      asset_source: "intelligence_engine",
      cms_use_allowed: true
    }
  ]
};

const outPath = path.join(root, "exports/article-generator/intelligence-asset-manifest-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log({
  manifest_version: manifest.manifest_version,
  assets: manifest.assets.length,
  output: outPath
});
