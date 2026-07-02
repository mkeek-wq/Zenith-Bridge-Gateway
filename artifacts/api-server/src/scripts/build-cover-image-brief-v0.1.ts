import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const visualPackagePath = path.join(root, "exports/article-generator/concept-visual-package-v0.1.json");
const visualPackage = fs.existsSync(visualPackagePath)
  ? JSON.parse(fs.readFileSync(visualPackagePath, "utf8"))
  : null;

const snapshot = publication.smurf_snapshot ?? {};
const evidence = publication.smurf_evidence ?? {};

const driverName =
  snapshot.primary_driver ??
  evidence.source_driver?.driver_name ??
  publication.article?.primary_driver ??
  "Singapore economic signal";

const sectors = evidence.affected_sectors ?? [];

const output = {
  package_version: "cover-image-brief-v0.1",
  generated_at: new Date().toISOString(),
  source_publication_package: publication.package_version,

  article_identity: publication.publication_identity,

  cover_image_brief: {
    title: publication.publication_identity.title,
    visual_direction:
      "Create a consulting-grade ASEAN intelligence cover image with a Bloomberg-lite feel: clean, data-driven, modern, calm, institutional, and evidence-first.",
    core_message:
      `Singapore's ${driverName} exposure can be interpreted through recurring SMURF evidence patterns and historical case signals.`,
    scene:
      "Abstract Singapore economic intelligence dashboard showing petroleum, refining, logistics, and energy-cycle signals. Use layered charts, subtle map/grid elements, trade-flow lines, and structured data panels rather than literal oil imagery.",
    style_keywords: [
      "Bloomberg-lite",
      "consulting-grade",
      "ASEAN intelligence aesthetic",
      "evidence-first",
      "institutional",
      "calm executive tone",
      "premium research publication",
      "data visualization inspired",
    ],
    avoid: [
      "cartoon style",
      "sensational crisis imagery",
      "fake numbers",
      "unverified charts",
      "overly glossy stock-photo look",
      "oil-rig cliché",
      "explosion or disaster imagery",
    ],
    suggested_elements: [
      "Singapore skyline silhouette",
      "subtle port and logistics lines",
      "abstract refinery/petroleum signal nodes",
      "clean dashboard panels",
      "evidence confidence markers",
      "muted ASEAN map grid",
    ],
    color_mood:
      "Deep navy, steel blue, muted teal, soft amber highlights, white data lines.",
    sectors,
    driver: driverName,
    confidence_tier: snapshot.confidence_tier ?? null,
  },

  prompt_for_image_model:
    `Consulting-grade ASEAN intelligence cover image for an article titled "${publication.publication_identity.title}". Bloomberg-lite, evidence-first, institutional research aesthetic. Abstract Singapore dashboard with petroleum, refining, logistics, and energy-cycle signals. Include subtle Singapore skyline, port/trade-flow lines, structured chart panels, confidence markers, and muted data-grid background. Deep navy, steel blue, muted teal, soft amber highlights. Avoid fake numbers, sensational imagery, cartoons, oil-rig clichés, and stock-photo style.`,

  visual_dependencies: {
    concept_visual_package: visualPackage?.package_version ?? null,
    concept_visuals_available: visualPackage?.visual_summary?.total ?? 0,
  },

  publish_status: "ready_for_concept_cover_generation",
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "cover-image-brief-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  driver: output.cover_image_brief.driver,
  status: output.publish_status,
  output: outPath,
});
