import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(path.join(root, "exports/article-generator/intelligence-asset-registry-v0.2.json"));

const feed = {
  feed_version: "cms-asset-picker-feed-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Provide CMS editor with selectable Intelligence Assets without duplicating uploads.",
  source_registry: registry.registry_version,
  asset_source_options: [
    {
      label: "Upload from computer",
      source_type: "manual_upload",
      creates_new_asset: true
    },
    {
      label: "Select Intelligence Asset",
      source_type: "intelligence_asset_registry",
      creates_new_asset: false
    }
  ],
  selectable_assets: registry.assets
    .filter((a: any) => a.cms?.selectable === true && a.cms_use_allowed === true)
    .map((a: any) => ({
      asset_id: a.asset_id,
      display_title: a.display_title,
      description: a.description,
      asset_type: a.asset_type,
      file_type: a.file_type,
      preview_url: a.files.svg.public_preview_url,
      source_path: a.files.svg.relative_path,
      alt_text: a.cms.alt_text,
      caption: a.cms.caption,
      credit: a.cms.credit,
      recommended_placement: a.cms.recommended_placement,
      dedupe_key: a.cms.dedupe_key,
      duplicate_policy: a.cms.duplicate_policy,
      concept_origin: a.concept_origin,
      verification_status: a.verification_status,
      authority_score: a.authority_score,
      authority_band: a.authority_band
    }))
};

const outPath = path.join(root, "exports/article-generator/cms-asset-picker-feed-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(feed, null, 2));

console.log({
  feed_version: feed.feed_version,
  selectable_assets: feed.selectable_assets.length,
  output: outPath
});
