import fs from "node:fs";

const discoveryPath =
  "data/intelligence/prioritized-evidence-discovery-queue-v0.1.json";

const outputPath =
  "data/intelligence/investigation-pack-registry-v0.1.json";

const discovery =
  JSON.parse(fs.readFileSync(discoveryPath, "utf8"));

const tasks =
  discovery.prioritized_tasks ?? [];

const packs: Record<string, any> = {};

for (const task of tasks) {
  const driverId = task.driver_id;

  if (!packs[driverId]) {
    packs[driverId] = {
      investigation_pack_version:
        "investigation-pack-v0.1",

      driver_id:
        driverId,

      driver_name:
        task.driver_name,

      priority_score:
        task.priority_score ?? 0,

      review_priority:
        task.review_priority ?? "normal",

      signal_strength:
        task.signal_strength ?? "unknown",

      evidence_sources:
        new Set(),

      mechanisms:
        new Set(),

      search_phrases:
        new Set(),
    };
  }

  packs[driverId].evidence_sources.add(
    task.evidence_source
  );

  for (const mechanism of task.mechanisms ?? []) {
    packs[driverId].mechanisms.add(
      mechanism
    );
  }

  packs[driverId].search_phrases.add(
    task.search_phrase
  );
}

const investigationPacks =
  Object.values(packs)
    .map((pack: any) => ({
      ...pack,

      evidence_sources:
        [...pack.evidence_sources],

      mechanisms:
        [...pack.mechanisms],

      search_phrases:
        [...pack.search_phrases],

      status:
        "awaiting_research",

      research_questions: [
        "What evidence supports this driver?",
        "What evidence contradicts this driver?",
        "Which institutions mention this mechanism?",
        "Can the mechanism explain the observed output movement?",
        "Would an analyst classify this attribution as high confidence?"
      ]
    }))
    .sort(
      (a: any, b: any) =>
        b.priority_score -
        a.priority_score
    );

const output = {
  investigation_pack_registry_version:
    "investigation-pack-registry-v0.1",

  generated_at:
    new Date().toISOString(),

  source_prioritized_queue:
    discoveryPath,

  policy: {
    principle:
      "Investigation packs consolidate evidence discovery into analyst review packages.",

    auto_research_allowed:
      false,

    auto_ingestion_allowed:
      false,

    production_mutation_allowed:
      false,
  },

  summary: {
    investigation_packs:
      investigationPacks.length,
  },

  investigation_packs:
    investigationPacks,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  investigation_pack_registry_version:
    output.investigation_pack_registry_version,

  packs_generated:
    investigationPacks.length,

  output:
    outputPath,
});

for (const pack of investigationPacks) {
  console.log(
    `${pack.priority_score} | ${pack.driver_id} | ${pack.driver_name}`
  );
}
