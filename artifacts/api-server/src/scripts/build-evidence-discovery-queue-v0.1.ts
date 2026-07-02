import fs from "node:fs";
import path from "node:path";

const sourcePath =
  "data/intelligence/attribution-evidence-registry-v0.1.json";

const outputPath =
  "data/intelligence/evidence-discovery-queue-v0.1.json";

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function priorityFor(domain: string, source: string) {
  if (
    [
      "official_statistics",
      "official_policy",
      "regulatory_notice",
      "company_disclosure",
      "commodity_market_data",
    ].includes(domain)
  ) {
    return "high";
  }

  if (
    source.toLowerCase().includes("singstat") ||
    source.toLowerCase().includes("edb") ||
    source.toLowerCase().includes("mti") ||
    source.toLowerCase().includes("iea") ||
    source.toLowerCase().includes("semi")
  ) {
    return "high";
  }

  return "medium";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const source = readJson(sourcePath);
const registry = source.registry ?? [];

const discoveryTasks: any[] = [];

for (const driver of registry) {
  for (const sourceName of driver.preferred_sources ?? []) {
    for (const phrase of driver.search_phrases ?? []) {
      const primaryDomain =
        driver.evidence_domains?.[0] ?? "unknown_domain";

      discoveryTasks.push({
        discovery_task_version: "evidence-discovery-task-v0.1",
        task_id: `EDQ-${driver.driver_id}-${slugify(sourceName)}-${slugify(
          phrase
        )}`,
        driver_id: driver.driver_id,
        driver_name: driver.driver_name,
        evidence_source: sourceName,
        evidence_domain: primaryDomain,
        search_phrase: phrase,
        mechanisms: driver.mechanisms ?? [],
        priority: priorityFor(primaryDomain, sourceName),
        status: "queued",
        governance: {
          auto_search_allowed: false,
          auto_ingestion_allowed: false,
          human_review_required: true,
          production_mutation_allowed: false,
        },
      });
    }
  }
}

const output = {
  evidence_discovery_queue_version: "evidence-discovery-queue-v0.1",
  generated_at: new Date().toISOString(),
  source_attribution_evidence_registry: sourcePath,
  policy: {
    principle:
      "Creates deterministic evidence discovery tasks from the attribution evidence registry. This queue does not perform live searches or automated ingestion.",
    auto_search_allowed: false,
    auto_ingestion_allowed: false,
    human_review_required: true,
    production_mutation_allowed: false,
  },
  summary: {
    drivers_processed: registry.length,
    discovery_tasks_generated: discoveryTasks.length,
    high_priority_tasks: discoveryTasks.filter((x) => x.priority === "high")
      .length,
    medium_priority_tasks: discoveryTasks.filter((x) => x.priority === "medium")
      .length,
  },
  discovery_tasks: discoveryTasks,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  evidence_discovery_queue_version: output.evidence_discovery_queue_version,
  drivers_processed: output.summary.drivers_processed,
  discovery_tasks_generated: output.summary.discovery_tasks_generated,
  high_priority_tasks: output.summary.high_priority_tasks,
  medium_priority_tasks: output.summary.medium_priority_tasks,
  output: outputPath,
});

for (const task of discoveryTasks.slice(0, 30)) {
  console.log(
    `${task.driver_id} | ${task.priority} | ${task.evidence_source} | ${task.search_phrase}`
  );
}
