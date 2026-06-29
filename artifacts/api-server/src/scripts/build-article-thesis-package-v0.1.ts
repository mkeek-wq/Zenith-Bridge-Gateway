import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();

const workbench = readJson(path.join(root, "exports/article-generator/interpretation-workbench-package-v0.1.json"));
const graphWorkbench = readJson(path.join(root, "exports/article-generator/graph-data-workbench-package-v0.1.json"));

const ctx = workbench.interpretation_context;
const blocks = workbench.article_building_blocks;

const output = {
  package_version: "article-thesis-package-v0.1",
  generated_at: new Date().toISOString(),
  source_interpretation_workbench: workbench.package_version,
  source_graph_data_workbench: graphWorkbench.package_version,

  article_identity: workbench.article_identity,

  editorial_thesis: {
    main_thesis: blocks.likely_thesis,
    refined_angle:
      "Use Singapore petroleum output as the entry point, but make the article about energy-cycle exposure rather than petroleum alone.",
    article_promise:
      "Explain what petroleum-related manufacturing movements may reveal about Singapore's exposure to global energy, travel, logistics, and refining conditions.",
    target_reader:
      "Business leaders, investors, consultants, operators, and professionals monitoring Singapore's economic position in Asia.",
  },

  supporting_argument_map: [
    {
      argument: "The signal is recurring, not isolated.",
      support: `${ctx.historical_cases} historical cases are linked to the same driver context.`,
      caveat: "Historical recurrence does not prove causality.",
    },
    {
      argument: "The driver points to energy demand and refining-cycle exposure.",
      support: `Primary driver: ${ctx.primary_driver}.`,
      caveat: "The mechanism should be described as interpretation, not proof.",
    },
    {
      argument: "The evidence patterns are business-relevant.",
      support: "Fuel demand, jet fuel demand, refinery maintenance, refining margins, crude oil, and travel demand recur in the evidence set.",
      caveat: "Pattern frequency is not the same as measured impact.",
    },
    {
      argument: "The topic matters beyond energy.",
      support: "Affected sectors include petroleum, refining, energy, and logistics.",
      caveat: "Broader trade and logistics implications need verified data for stronger claims.",
    },
  ],

  recommended_article_structure: [
    "Opening: petroleum output as a signal, not a standalone sector story",
    "Why the signal matters for Singapore",
    "What SMURF found in the historical pattern",
    "How the energy demand / refining cycle mechanism works",
    "What businesses should watch",
    "What still needs verified data",
    "Conclusion: interpretation with governance",
  ],

  graph_placement_plan: graphWorkbench.graph_tasks.map((g: any, index: number) => ({
    placement_order: index + 1,
    chart_title: g.chart_title,
    chart_type: g.chart_type,
    recommended_article_section:
      g.publish_status === "blocked_pending_verified_metrics"
        ? "Hold for later quantitative update"
        : index === 0
        ? "Why the signal matters for Singapore"
        : "How the mechanism works",
    publication_use: g.publication_use,
    data_status: g.data_status,
  })),

  editorial_risk_controls: {
    approved_language: blocks.risk_language,
    avoid_claims: workbench.claims_we_cannot_make_yet,
    required_disclosures: [
      "Exact figures remain pending verified metrics.",
      "Historical cases support interpretation but do not prove causality.",
      "Conceptual visuals should be labelled as conceptual if used.",
    ],
  },

  human_editor_notes: [
    "The article should sound like ZNBW interpreting a signal, not SMURF explaining its internal workflow.",
    "Reduce internal system language in the final article.",
    "Use SMURF confidence and historical cases as credibility support, not as the main story.",
    "The strongest article angle is energy-cycle exposure, not Singapore as an energy hub.",
  ],

  next_recommended_build:
    "build-article-editor-v0.1.ts should consume this thesis package and produce a cleaner publication article.",
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "article-thesis-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title: output.article_identity.title,
  thesis: output.editorial_thesis.refined_angle,
  arguments: output.supporting_argument_map.length,
  graph_placements: output.graph_placement_plan.length,
  output: outPath,
});
