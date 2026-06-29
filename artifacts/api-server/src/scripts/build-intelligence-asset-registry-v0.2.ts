import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const cms = readJson(path.join(root, "exports/article-generator/cms-finalization-package-v0.1.json"));
const graphPackage = readJson(path.join(root, "exports/article-generator/institutional-graph-package-v0.1.json"));
const graphSpec = readJson(path.join(root, "exports/article-generator/institutional-graph-render-spec-v0.1.json"));
const graphReport = readJson(path.join(root, "exports/article-generator/institutional-graph-renderer-report-v0.1.json"));
const gate = readJson(path.join(root, "exports/article-generator/publication-readiness-gate-v0.1.json"));
const authority = readJson(path.join(root, "exports/article-generator/publication-source-authority-review-v0.1.json"));

const slug = cms.article_payload.slug;
const svgPath = graphReport.svg_output;
const svgPublicPath = "/znbw-previews/petroleum-sector-comparison-v0.1.svg";

const assetId = "IA_PETROLEUM_SECTOR_COMPARISON_V0_2";
const dedupeKey = crypto
  .createHash("sha256")
  .update(`${slug}|institutional_graph|${graphSpec.chart.title}|${graphSpec.chart.data.length}`)
  .digest("hex");

const registry = {
  registry_version: "intelligence-asset-registry-v0.2",
  generated_at: new Date().toISOString(),
  public_name: "ZNBW Intelligence Assets",
  internal_source: "ZNBW_BI_Engine",
  governance: {
    public_naming_required: true,
    internal_codename_blocked_publicly: true,
    cms_reads_registry_only: true,
    direct_engine_access_from_cms: false,
    duplicate_uploads_discouraged: true
  },
  assets: [
    {
      asset_id: assetId,
      asset_version: "v0.2",
      display_title: "Singapore Manufacturing Output Growth by Sector",
      short_title: "Manufacturing output growth by sector",
      description:
        "Institutional comparison graph showing verified year-on-year manufacturing output growth across petroleum, chemicals, transport engineering, and total manufacturing.",
      asset_type: "institutional_graph",
      file_type: "svg",
      asset_source: "intelligence_engine",
      publication_allowed: gate.decision?.publish_allowed === true,
      cms_use_allowed: true,
      verification_status: "verified",
      integrity_status: "passed",
      authority_band: authority.band,
      authority_score: authority.scores?.authority_score,

      concept_origin: {
        article_slug: slug,
        article_title: cms.article_payload.title,
        country: cms.article_payload.country,
        category: cms.article_payload.category,
        intelligence_question:
          "What does petroleum output reveal about Singapore's exposure to global energy and manufacturing cycles?",
        concept_type: "sector_comparison",
        primary_signal: "Petroleum output",
        related_sectors: graphPackage.series.map((s: any) => s.sector),
        publication_grade: cms.article_payload.publication_grade
      },

      lineage: {
        cms_finalization_package: "exports/article-generator/cms-finalization-package-v0.1.json",
        publication_gate: "exports/article-generator/publication-readiness-gate-v0.1.json",
        graph_package: "exports/article-generator/institutional-graph-package-v0.1.json",
        render_spec: "exports/article-generator/institutional-graph-render-spec-v0.1.json",
        renderer_report: "exports/article-generator/institutional-graph-renderer-report-v0.1.json",
        source_metrics: graphPackage.series.map((s: any) => ({
          sector: s.sector,
          period: s.period,
          metric: s.metric,
          value: s.value,
          unit: s.unit,
          source_name: s.source_name,
          source_url: s.source_url,
          verification_status: s.verification_status
        }))
      },

      files: {
        svg: {
          absolute_path: svgPath,
          relative_path: "exports/article-generator/graphs/petroleum-sector-comparison-v0.1.svg",
          public_preview_url: svgPublicPath,
          sha256: sha256File(svgPath)
        },
        png: null
      },

      cms: {
        selectable: true,
        picker_label: "Select Intelligence Asset",
        recommended_placement: "after_opening_section",
        allowed_contexts: ["article_body", "editorial_graph", "transparency_panel"],
        dedupe_key: dedupeKey,
        duplicate_policy: "reuse_existing_asset_reference_do_not_upload_copy",
        alt_text:
          "Bar chart comparing year-on-year manufacturing output growth across petroleum, chemicals, transport engineering, and total manufacturing in Singapore.",
        caption:
          "Verified sector output growth comparison. Synthetic and replay data are excluded from published visuals.",
        credit:
          "ZNBW Intelligence Framework, based on verified public source data."
      },

      lifecycle: {
        status: "candidate_asset_ready_for_cms_selection",
        created_at: new Date().toISOString(),
        last_rendered_at: graphReport.generated_at,
        supersedes: "IA_PETROLEUM_SECTOR_COMPARISON_V0_1",
        superseded_by: null
      }
    }
  ]
};

const outPath = path.join(root, "exports/article-generator/intelligence-asset-registry-v0.2.json");
fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));

console.log({
  registry_version: registry.registry_version,
  assets: registry.assets.length,
  output: outPath
});
