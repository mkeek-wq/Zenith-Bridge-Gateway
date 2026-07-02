import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REGISTRY_PATH = path.join(
  ROOT,
  "data",
  "intelligence",
  "verified-dataset-registry-v0.1.json"
);

const PARSED_DIR = path.join(ROOT, "data", "intelligence", "parsed-datasets");

const OUTPUT_PATH = path.join(
  ROOT,
  "data",
  "intelligence",
  "dataset-consistency-audit-v0.1.json"
);

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

const registry = readJson(REGISTRY_PATH);
const registryDatasets = Array.isArray(registry.datasets) ? registry.datasets : [];

const parsedFiles = exists(PARSED_DIR)
  ? fs.readdirSync(PARSED_DIR).filter((file) => file.endsWith(".json"))
  : [];

const parsedById = new Map<string, any>();

for (const file of parsedFiles) {
  const fullPath = path.join(PARSED_DIR, file);
  const parsed = readJson(fullPath);
  if (parsed.dataset_id) {
    parsedById.set(parsed.dataset_id, {
      ...parsed,
      parsed_file: path.relative(ROOT, fullPath),
    });
  }
}

const registryIds = new Set(registryDatasets.map((d: any) => d.dataset_id));
const parsedIds = new Set(parsedById.keys());

const audits = registryDatasets.map((dataset: any) => {
  const parsed = parsedById.get(dataset.dataset_id);

  const issues: string[] = [];
  const warnings: string[] = [];

  const isRequestedNotLoaded =
    dataset.verification_status === "requested_not_loaded";

  if (!parsed) {
    if (isRequestedNotLoaded) {
      warnings.push("requested_dataset_not_loaded_yet");
    } else {
      issues.push("missing_parsed_dataset_file");
    }
  } else {
    if (dataset.verification_status !== parsed.verification_status) {
      issues.push("verification_status_mismatch");
    }

    if (Number(dataset.values_count || 0) !== Number(parsed.values_count || 0)) {
      issues.push("values_count_mismatch");
    }

    if ((dataset.coverage_start || null) !== (parsed.coverage_start || null)) {
      warnings.push("coverage_start_mismatch");
    }

    if ((dataset.coverage_end || null) !== (parsed.coverage_end || null)) {
      warnings.push("coverage_end_mismatch");
    }

    if ((dataset.frequency || null) !== (parsed.frequency || null)) {
      warnings.push("frequency_mismatch");
    }
  }

  if (!dataset.source && !dataset.source_url && !(dataset.preferred_sources || []).length) {
    warnings.push("missing_source_metadata");
  }

  if (!dataset.unit && !isRequestedNotLoaded) {
    warnings.push("missing_unit_metadata");
  }

  return {
    dataset_id: dataset.dataset_id,
    registry: {
      name: dataset.name ?? null,
      verification_status: dataset.verification_status ?? null,
      values_count: dataset.values_count ?? null,
      coverage_start: dataset.coverage_start ?? null,
      coverage_end: dataset.coverage_end ?? null,
      frequency: dataset.frequency ?? null,
      source_url: dataset.source_url ?? null,
      preferred_sources: dataset.preferred_sources ?? [],
      unit: dataset.unit ?? null,
      updated_at: dataset.updated_at ?? null,
    },
    parsed: parsed
      ? {
          parsed_file: parsed.parsed_file,
          verification_status: parsed.verification_status ?? null,
          values_count: parsed.values_count ?? null,
          coverage_start: parsed.coverage_start ?? null,
          coverage_end: parsed.coverage_end ?? null,
          frequency: parsed.frequency ?? null,
          source_url: parsed.source_url ?? null,
          preferred_sources: parsed.preferred_sources ?? [],
          unit: parsed.unit ?? null,
          updated_at: parsed.updated_at ?? null,
        }
      : null,
    issue_count: issues.length,
    warning_count: warnings.length,
    issues,
    warnings,
    audit_status:
      issues.length > 0
        ? "issue"
        : warnings.length > 0
        ? "warning"
        : "clean",
  };
});

const parsedOnly = Array.from(parsedIds)
  .filter((id) => !registryIds.has(id))
  .map((id) => {
    const parsed = parsedById.get(id);
    return {
      dataset_id: id,
      parsed_file: parsed.parsed_file,
      issue: "parsed_dataset_not_in_registry",
    };
  });

const issueCount =
  audits.reduce((sum: number, audit: any) => sum + audit.issue_count, 0) +
  parsedOnly.length;

const warningCount = audits.reduce(
  (sum: number, audit: any) => sum + audit.warning_count,
  0
);

const output = {
  audit_version: "dataset-consistency-audit-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Checks consistency between verified dataset registry and parsed dataset files. This audit is read-only and does not mutate datasets.",
  source_registry: "data/intelligence/verified-dataset-registry-v0.1.json",
  parsed_dataset_directory: "data/intelligence/parsed-datasets",
  registry_dataset_count: registryDatasets.length,
  parsed_dataset_count: parsedFiles.length,
  issue_count: issueCount,
  warning_count: warningCount,
  audits,
  parsed_only: parsedOnly,
  governance: {
    mutation_allowed: false,
    human_review_required: issueCount > 0 || warningCount > 0,
    recommended_next_step:
      issueCount > 0
        ? "Resolve registry/parsed dataset drift before new ingestion."
        : warningCount > 0
        ? "Review metadata warnings before scaling ingestion."
        : "Dataset registry and parsed dataset files are consistent.",
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  registry_dataset_count: output.registry_dataset_count,
  parsed_dataset_count: output.parsed_dataset_count,
  issue_count: output.issue_count,
  warning_count: output.warning_count,
  output: path.relative(ROOT, OUTPUT_PATH),
});

for (const audit of audits) {
  if (audit.audit_status !== "clean") {
    console.log(
      `${audit.dataset_id} | ${audit.audit_status} | issues=${audit.issues.join(",") || "-"} | warnings=${audit.warnings.join(",") || "-"}`
    );
  }
}

for (const item of parsedOnly) {
  console.log(`${item.dataset_id} | issue | ${item.issue}`);
}
