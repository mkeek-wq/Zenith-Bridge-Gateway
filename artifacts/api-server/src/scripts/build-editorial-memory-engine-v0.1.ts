import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));
const article = readJson(path.join(root, "exports/article-generator/publication-article-v0.1.json"));
const thesis = readJson(path.join(root, "exports/article-generator/article-thesis-package-v0.1.json"));
const graphWorkbench = readJson(path.join(root, "exports/article-generator/graph-data-workbench-package-v0.1.json"));
const visualPackage = readJson(path.join(root, "exports/article-generator/concept-visual-package-v0.2.json"));

const identity = publication.publication_identity;
const snapshot = publication.smurf_snapshot ?? {};
const evidence = publication.smurf_evidence ?? {};

const memoryItem = {
  memory_id: `EMR_${identity.source_opportunity_id}`,
  created_at: new Date().toISOString(),

  article_identity: {
    title: identity.title,
    slug: identity.slug,
    country: identity.country,
    category: identity.category,
    source_opportunity_id: identity.source_opportunity_id,
  },

  intelligence_context: {
    primary_driver: snapshot.primary_driver ?? evidence.source_driver?.driver_name,
    driver_id: snapshot.driver_id ?? evidence.source_driver?.driver_id,
    confidence_score: snapshot.confidence_score ?? evidence.signal?.confidence_score,
    confidence_tier: snapshot.confidence_tier ?? evidence.signal?.confidence_tier,
    historical_cases: snapshot.historical_cases ?? evidence.source_cases?.length ?? 0,
    recurrence_score: snapshot.recurrence_score ?? evidence.signal?.recurrence_score,
    experience_strength: snapshot.experience_strength ?? evidence.signal?.experience_strength,
    pattern_stability: snapshot.pattern_stability ?? evidence.signal?.stability_assessment,
  },

  editorial_thesis: thesis.editorial_thesis ?? null,

  supporting_argument_map: thesis.supporting_argument_map ?? [],

  visual_memory: {
    visuals_considered: visualPackage.visual_summary?.total ?? 0,
    conceptual_ready: visualPackage.visual_summary?.conceptual_ready ?? 0,
    quantitative_ready: visualPackage.visual_summary?.quantitative_ready ?? 0,
    blocked: visualPackage.visual_summary?.blocked ?? 0,
    graph_tasks: graphWorkbench.graph_tasks ?? [],
  },

  data_memory: {
    open_data_requests: graphWorkbench.open_data_requests ?? [],
    minimum_data_for_publishable_article:
      graphWorkbench.minimum_data_for_publishable_article ?? [],
    graph_governance_rules: graphWorkbench.graph_governance_rules ?? [],
  },

  publication_memory: {
    article_package_version: publication.package_version,
    article_editor_version: article.package_version,
    publication_recommendation:
      publication.publication_status?.publication_recommendation,
    exact_figures_allowed:
      publication.publication_status?.exact_figures_allowed,
    quantitative_graphs_allowed:
      publication.publication_status?.quantitative_graphs_allowed,
    governance_note:
      publication.publication_status?.governance_note,
  },

  editorial_lessons_learned: [
    "Petroleum output should be used as the entry signal, not the full story.",
    "The stronger editorial angle is Singapore's exposure to global energy-cycle conditions.",
    "Historical cases provide useful interpretation context but should not be framed as causal proof.",
    "Conceptual visuals are publishable earlier than quantitative charts if clearly labelled.",
    "Verified data remains the main blocker for quantitative publication claims.",
  ],

  future_follow_up_signals: [
    "New petroleum-related manufacturing output movement",
    "Jet fuel demand recovery or slowdown",
    "Refining margin shifts",
    "Shipping, bunkering, or logistics activity changes",
    "Energy demand or crude oil market volatility",
  ],

  reuse_guidance: {
    use_when_driver_reappears: true,
    relevant_driver_id: snapshot.driver_id ?? evidence.source_driver?.driver_id,
    recommended_future_use:
      "When SMURF identifies future Energy Demand / Refining Cycle signals, compare the new signal against this editorial memory before generating a new article thesis.",
  },
};

const registry = {
  registry_version: "editorial-memory-registry-v0.1",
  generated_at: new Date().toISOString(),
  memory_items: [memoryItem],
};

const outDir = path.join(root, "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const registryPath = path.join(outDir, "editorial-memory-registry-v0.1.json");
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

const exportPath = path.join(root, "exports/article-generator/editorial-memory-registry-v0.1.json");
fs.writeFileSync(exportPath, JSON.stringify(registry, null, 2));

console.log({
  registry_version: registry.registry_version,
  title: memoryItem.article_identity.title,
  driver: memoryItem.intelligence_context.primary_driver,
  historical_cases: memoryItem.intelligence_context.historical_cases,
  lessons: memoryItem.editorial_lessons_learned.length,
  future_follow_up_signals: memoryItem.future_follow_up_signals.length,
  data_output: registryPath,
  export_output: exportPath,
});
