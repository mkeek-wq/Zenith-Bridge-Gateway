import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/intelligence/investigation-pack-registry-v0.1.json";

const outputPath =
  "data/intelligence/attribution-case-registry-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const packs = source.investigation_packs ?? [];

const attributionCases = packs.map((pack: any) => ({
  attribution_case_version: "attribution-case-v0.1",
  attribution_case_id: `ATTR-${pack.driver_id}`,
  driver_id: pack.driver_id,
  driver_name: pack.driver_name,
  source_investigation_pack: pack.driver_id,

  review_status: "awaiting_research",
  review_priority: pack.review_priority,
  priority_score: pack.priority_score,
  signal_strength: pack.signal_strength,

  expected_mechanisms: pack.mechanisms ?? [],
  target_evidence_sources: pack.evidence_sources ?? [],
  target_search_phrases: pack.search_phrases ?? [],
  research_questions: pack.research_questions ?? [],

  evidence_review: {
    supporting_evidence: [],
    contradicting_evidence: [],
    neutral_evidence: [],
    missing_evidence: [],
  },

  analyst_assessment: {
    preliminary_assessment: "not_reviewed",
    confidence_after_review: "unknown",
    attribution_supported: null,
    notes: "",
  },

  source_lineage: {
    reviewed_sources: [],
    source_documents: [],
    evidence_items: [],
  },

  governance: {
    human_review_required: true,
    auto_close_allowed: false,
    auto_publish_allowed: false,
    production_mutation_allowed: false,
  },
}));

const output = {
  attribution_case_registry_version: "attribution-case-registry-v0.1",
  generated_at: new Date().toISOString(),
  source_investigation_pack_registry: sourcePath,
  policy: {
    principle:
      "Creates empty attribution case containers from investigation packs. These cases must be filled by reviewed evidence before they can influence production attribution.",
    human_review_required: true,
    auto_ingestion_allowed: false,
    auto_close_allowed: false,
    production_mutation_allowed: false,
  },
  summary: {
    source_packs: packs.length,
    attribution_cases_created: attributionCases.length,
    awaiting_research: attributionCases.filter(
      (x: any) => x.review_status === "awaiting_research"
    ).length,
  },
  attribution_cases: attributionCases,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  attribution_case_registry_version:
    output.attribution_case_registry_version,
  source_packs: output.summary.source_packs,
  attribution_cases_created: output.summary.attribution_cases_created,
  awaiting_research: output.summary.awaiting_research,
  output: outputPath,
});

for (const item of attributionCases) {
  console.log(
    `${item.attribution_case_id} | ${item.driver_id} | ${item.driver_name} | ${item.review_status}`
  );
}
