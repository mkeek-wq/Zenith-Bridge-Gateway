import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OUTPUT_PATH =
  "data/intelligence/platform-steward-operational-summary-v0.1.json";

type Freshness = "current" | "aging" | "stale" | "unknown";
type SourceStatus = "available" | "missing" | "invalid";
type OverallStatus = "green" | "amber" | "red";

type SourceDefinition = {
  key: string;
  sourcePath: string;
  required: boolean;
};

type SourceRecord = {
  key: string;
  source_path: string;
  required: boolean;
  status: SourceStatus;
  version: string | null;
  generated_at: string | null;
  age_days: number | null;
  freshness: Freshness;
  data: any | null;
  error: string | null;
};

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    key: "runtime_health",
    sourcePath: "data/maintenance/overall-health-v0.1.json",
    required: true,
  },
  {
    key: "dependency_registry",
    sourcePath: "data/intelligence/dependency-registry-v0.1.json",
    required: true,
  },
  {
    key: "warehouse_registry",
    sourcePath:
      "data/intelligence/intelligence-warehouse-registry-v0.1.json",
    required: true,
  },
];

function fullPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function detectVersion(pkg: any): string | null {
  return (
    pkg.version ??
    pkg.registry_version ??
    pkg.report_version ??
    pkg.package_version ??
    null
  );
}

function detectGeneratedAt(pkg: any): string | null {
  return pkg.generated_at ?? pkg.created_at ?? null;
}

function ageInDays(generatedAt: string | null): number | null {
  if (!generatedAt) return null;

  const timestamp = Date.parse(generatedAt);

  if (!Number.isFinite(timestamp)) return null;

  return Number(
    ((Date.now() - timestamp) / (1000 * 60 * 60 * 24)).toFixed(2)
  );
}

function classifyFreshness(ageDays: number | null): Freshness {
  if (ageDays === null) return "unknown";
  if (ageDays <= 7) return "current";
  if (ageDays <= 30) return "aging";
  return "stale";
}

function readSource(definition: SourceDefinition): SourceRecord {
  const absolutePath = fullPath(definition.sourcePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      key: definition.key,
      source_path: definition.sourcePath,
      required: definition.required,
      status: "missing",
      version: null,
      generated_at: null,
      age_days: null,
      freshness: "unknown",
      data: null,
      error: "Source file does not exist.",
    };
  }

  try {
    const raw = fs.readFileSync(absolutePath, "utf8");
    const data = JSON.parse(raw);
    const generatedAt = detectGeneratedAt(data);
    const ageDays = ageInDays(generatedAt);

    return {
      key: definition.key,
      source_path: definition.sourcePath,
      required: definition.required,
      status: "available",
      version: detectVersion(data),
      generated_at: generatedAt,
      age_days: ageDays,
      freshness: classifyFreshness(ageDays),
      data,
      error: null,
    };
  } catch (error) {
    return {
      key: definition.key,
      source_path: definition.sourcePath,
      required: definition.required,
      status: "invalid",
      version: null,
      generated_at: null,
      age_days: null,
      freshness: "unknown",
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown source parsing error.",
    };
  }
}

function getSource(
  sources: SourceRecord[],
  key: string
): SourceRecord | undefined {
  return sources.find((source) => source.key === key);
}

function buildRuntimeSummary(source: SourceRecord | undefined) {
  const data = source?.data;

  if (!source || source.status !== "available" || !data) {
    return {
      status: source?.status ?? "missing",
      source_freshness: source?.freshness ?? "unknown",
      source_age_days: source?.age_days ?? null,
      overall_status: null,
      branch: null,
      git_dirty_count: null,
      disk_used_percent: null,
      memory_available_mb: null,
      endpoints: null,
      intelligence_packages: null,
      warnings: [],
      criticals: [],
    };
  }

  return {
    status: "available",
    source_freshness: source.freshness,
    source_age_days: source.age_days,
    overall_status: data.overall_status ?? null,
    branch: data.branch ?? null,
    git_dirty_count: data.checks?.git?.dirty_count ?? null,
    disk_used_percent:
      data.checks?.resources?.disk_used_percent ?? null,
    memory_available_mb:
      data.checks?.resources?.memory_available_mb ?? null,
    endpoints: data.checks?.endpoints ?? null,
    intelligence_packages:
      data.checks?.intelligence_packages ?? null,
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    criticals: Array.isArray(data.criticals) ? data.criticals : [],
  };
}

function buildRepositorySummary(source: SourceRecord | undefined) {
  const data = source?.data;

  if (!source || source.status !== "available" || !data) {
    return {
      status: source?.status ?? "missing",
      source_freshness: source?.freshness ?? "unknown",
      source_age_days: source?.age_days ?? null,
      scripts_scanned: null,
      scripts_with_reads: null,
      scripts_with_writes: null,
      packages_referenced: null,
      packages_with_producers: null,
      packages_with_consumers: null,
      orphan_outputs: null,
      referenced_missing_packages: null,
      ecosystems: null,
      doctrine: null,
    };
  }

  return {
    status: "available",
    source_freshness: source.freshness,
    source_age_days: source.age_days,
    scripts_scanned: data.summary?.scripts_scanned ?? null,
    scripts_with_reads:
      data.summary?.scripts_with_reads ?? null,
    scripts_with_writes:
      data.summary?.scripts_with_writes ?? null,
    packages_referenced:
      data.summary?.packages_referenced ?? null,
    packages_with_producers:
      data.summary?.packages_with_producers ?? null,
    packages_with_consumers:
      data.summary?.packages_with_consumers ?? null,
    orphan_outputs: data.summary?.orphan_outputs ?? null,
    referenced_missing_packages:
      data.summary?.referenced_missing_packages ?? null,
    ecosystems: data.ecosystems ?? null,
    doctrine: data.doctrine ?? null,
  };
}

function buildCapabilitySummary(source: SourceRecord | undefined) {
  const data = source?.data;

  if (!source || source.status !== "available" || !data) {
    return {
      status: source?.status ?? "missing",
      source_freshness: source?.freshness ?? "unknown",
      source_age_days: source?.age_days ?? null,
      engine_count: null,
      intelligence_file_count: null,
      replay_file_count: null,
      package_count: null,
      engine_capability_counts: null,
      package_capability_counts: null,
      capabilities: null,
    };
  }

  return {
    status: "available",
    source_freshness: source.freshness,
    source_age_days: source.age_days,
    engine_count: data.summary?.engine_count ?? null,
    intelligence_file_count:
      data.summary?.intelligence_file_count ?? null,
    replay_file_count: data.summary?.replay_file_count ?? null,
    package_count: data.summary?.package_count ?? null,
    engine_capability_counts:
      data.summary?.engine_capability_counts ?? null,
    package_capability_counts:
      data.summary?.package_capability_counts ?? null,
    capabilities: data.capabilities ?? null,
  };
}

function buildWarnings(
  sources: SourceRecord[],
  runtime: ReturnType<typeof buildRuntimeSummary>,
  repository: ReturnType<typeof buildRepositorySummary>
): string[] {
  const warnings: string[] = [];

  for (const source of sources) {
    if (source.status === "missing") {
      warnings.push(`missing_source:${source.key}`);
    }

    if (source.status === "invalid") {
      warnings.push(`invalid_source:${source.key}`);
    }

    if (source.freshness === "stale") {
      warnings.push(`stale_source:${source.key}`);
    }

    if (source.freshness === "aging") {
      warnings.push(`aging_source:${source.key}`);
    }
  }

  if (
    typeof runtime.git_dirty_count === "number" &&
    runtime.git_dirty_count > 0
  ) {
    warnings.push(
      `repository_dirty_count:${runtime.git_dirty_count}`
    );
  }

  if (
    typeof repository.orphan_outputs === "number" &&
    repository.orphan_outputs > 0
  ) {
    warnings.push(
      `orphan_outputs:${repository.orphan_outputs}`
    );
  }

  if (
    typeof repository.referenced_missing_packages === "number" &&
    repository.referenced_missing_packages > 0
  ) {
    warnings.push(
      `referenced_missing_packages:${repository.referenced_missing_packages}`
    );
  }

  return [...new Set(warnings)];
}

function buildCriticals(
  sources: SourceRecord[],
  runtime: ReturnType<typeof buildRuntimeSummary>
): string[] {
  const criticals: string[] = [];

  for (const source of sources) {
    if (source.required && source.status !== "available") {
      criticals.push(
        `required_source_unavailable:${source.key}`
      );
    }
  }

  for (const critical of runtime.criticals) {
    criticals.push(`runtime:${critical}`);
  }

  return [...new Set(criticals)];
}

function buildRecommendations(
  sources: SourceRecord[],
  runtime: ReturnType<typeof buildRuntimeSummary>,
  repository: ReturnType<typeof buildRepositorySummary>
): string[] {
  const recommendations: string[] = [];

  const runtimeSource = getSource(sources, "runtime_health");

  if (runtimeSource?.freshness === "stale") {
    recommendations.push(
      "Regenerate the Hygiene Smurf overall health report before relying on runtime health conclusions."
    );
  }

  if (runtimeSource?.freshness === "aging") {
    recommendations.push(
      "Refresh the Hygiene Smurf overall health report soon."
    );
  }

  if (
    typeof runtime.git_dirty_count === "number" &&
    runtime.git_dirty_count > 0
  ) {
    recommendations.push(
      "Review the dirty repository files and separate intentional work from unrelated or stale changes."
    );
  }

  if (
    typeof repository.orphan_outputs === "number" &&
    repository.orphan_outputs > 0
  ) {
    recommendations.push(
      "Review orphan outputs and determine whether they require consumers, documentation or retirement."
    );
  }

  if (
    typeof repository.referenced_missing_packages === "number" &&
    repository.referenced_missing_packages > 0
  ) {
    recommendations.push(
      "Review referenced missing packages and classify each as expected, obsolete or unresolved."
    );
  }

  for (const source of sources) {
    if (source.status === "missing") {
      recommendations.push(
        `Restore or regenerate the missing required source: ${source.source_path}.`
      );
    }

    if (source.status === "invalid") {
      recommendations.push(
        `Repair the invalid JSON source: ${source.source_path}.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "No immediate Platform Steward action is required."
    );
  }

  return [...new Set(recommendations)];
}

function determineOverallStatus(
  warnings: string[],
  criticals: string[]
): OverallStatus {
  if (criticals.length > 0) return "red";
  if (warnings.length > 0) return "amber";
  return "green";
}

const sources = SOURCE_DEFINITIONS.map(readSource);

const runtimeSource = getSource(sources, "runtime_health");
const dependencySource = getSource(
  sources,
  "dependency_registry"
);
const warehouseSource = getSource(
  sources,
  "warehouse_registry"
);

const runtimeHealth = buildRuntimeSummary(runtimeSource);
const repositoryHealth =
  buildRepositorySummary(dependencySource);
const capabilityHealth =
  buildCapabilitySummary(warehouseSource);

const warnings = buildWarnings(
  sources,
  runtimeHealth,
  repositoryHealth
);

const criticals = buildCriticals(sources, runtimeHealth);

const recommendations = buildRecommendations(
  sources,
  runtimeHealth,
  repositoryHealth
);

const overallStatus = determineOverallStatus(
  warnings,
  criticals
);

const output = {
  version: "platform-steward-operational-summary-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Reference Operational Summary describing Platform Steward runtime, repository and capability health.",
  mission:
    "Observe and summarize the operational condition of the ZNBW Village without replacing ownership of underlying source packages.",
  doctrine: {
    summary_is_operational_intelligence: true,
    source_packages_remain_canonical: true,
    composition_does_not_create_new_telemetry: true,
    honest_health_reporting_required: true,
    production_write_allowed: false,
    human_review_required: true,
  },
  responsibility: {
    owner: "Platform Steward",
    domain: "platform_operations",
    scope: [
      "runtime_health",
      "repository_structure",
      "capability_inventory",
    ],
  },
  health: {
    overall_status: overallStatus,
    source_count: sources.length,
    available_source_count: sources.filter(
      (source) => source.status === "available"
    ).length,
    missing_source_count: sources.filter(
      (source) => source.status === "missing"
    ).length,
    invalid_source_count: sources.filter(
      (source) => source.status === "invalid"
    ).length,
    stale_source_count: sources.filter(
      (source) => source.freshness === "stale"
    ).length,
    aging_source_count: sources.filter(
      (source) => source.freshness === "aging"
    ).length,
    warning_count: warnings.length,
    critical_count: criticals.length,
  },
  operational_summary: {
    runtime_health: runtimeHealth,
    repository_health: repositoryHealth,
    capability_health: capabilityHealth,
  },
  warnings,
  criticals,
  recommendations,
  sources: sources.map((source) => ({
    key: source.key,
    source_path: source.source_path,
    required: source.required,
    status: source.status,
    version: source.version,
    generated_at: source.generated_at,
    age_days: source.age_days,
    freshness: source.freshness,
    error: source.error,
  })),
  lineage: {
    composer_script:
      "src/scripts/build-platform-steward-operational-summary-v0.1.ts",
    output_path: OUTPUT_PATH,
    direct_source_packages: sources.map((source) => ({
      key: source.key,
      source_path: source.source_path,
      version: source.version,
      generated_at: source.generated_at,
      status: source.status,
    })),
  },
};

fs.mkdirSync(path.dirname(fullPath(OUTPUT_PATH)), {
  recursive: true,
});

fs.writeFileSync(
  fullPath(OUTPUT_PATH),
  JSON.stringify(output, null, 2)
);

console.log(
  JSON.stringify(
    {
      output: OUTPUT_PATH,
      overall_status: output.health.overall_status,
      available_source_count:
        output.health.available_source_count,
      stale_source_count: output.health.stale_source_count,
      warning_count: output.health.warning_count,
      critical_count: output.health.critical_count,
    },
    null,
    2
  )
);
