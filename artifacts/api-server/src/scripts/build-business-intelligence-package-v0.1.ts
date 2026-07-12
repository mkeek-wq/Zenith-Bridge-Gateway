import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OUTPUT_PATH =
  "data/intelligence/business-intelligence-package-v0.1.json";

type PackageDefinition = {
  key: string;
  sourcePath: string;
  required: boolean;
};

type PackageRecord = {
  key: string;
  source_path: string;
  required: boolean;
  status: "available" | "missing" | "invalid";
  version: string | null;
  generated_at: string | null;
  age_days: number | null;
  freshness: "current" | "aging" | "stale" | "unknown";
  summary: unknown;
  source_files: unknown;
  error: string | null;
};

const PACKAGE_DEFINITIONS: PackageDefinition[] = [
  {
    key: "verified_datasets",
    sourcePath:
      "data/intelligence/verified-dataset-registry-v0.1.json",
    required: true,
  },
  {
    key: "dataset_audit",
    sourcePath:
      "data/intelligence/dataset-audit-report-v0.1.json",
    required: true,
  },
  {
    key: "signal_watchlist",
    sourcePath:
      "data/intelligence/signal-watchlist-registry-v0.1.json",
    required: true,
  },
  {
    key: "macro_attribution",
    sourcePath:
      "data/intelligence/macro-attribution-engine-v0.2.json",
    required: true,
  },
  {
    key: "article_workbench",
    sourcePath:
      "data/intelligence/article-workbench-package-v0.2.json",
    required: false,
  },
  {
    key: "article_intelligence",
    sourcePath:
      "data/intelligence/article-intelligence-package-v0.1.json",
    required: false,
  },
  {
    key: "replay_analogue",
    sourcePath:
      "data/replay/replay-analogue-summary-v0.1.json",
    required: true,
  },
  {
    key: "replay_confidence",
    sourcePath:
      "data/replay/replay-confidence-engine-v0.1.json",
    required: true,
  },
  {
    key: "replay_scenarios",
    sourcePath:
      "data/replay/replay-scenario-library-v0.1.json",
    required: true,
  },
  {
    key: "replay_decision_support",
    sourcePath:
      "data/replay/replay-decision-support-layer-v0.1.json",
    required: true,
  },
  {
    key: "replay_client_impact",
    sourcePath:
      "data/replay/replay-client-impact-assessment-v0.1.json",
    required: true,
  },
  {
    key: "replay_dataset_evidence",
    sourcePath:
      "data/replay/replay-dataset-evidence-bridge-v0.1.json",
    required: true,
  },
];

function fullPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function detectVersion(pkg: any): string | null {
  return (
    pkg.version ??
    pkg.package_version ??
    pkg.registry_version ??
    pkg.workbench_version ??
    pkg.signal_watchlist_registry_version ??
    pkg.snapshot_version ??
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

function classifyFreshness(
  ageDays: number | null
): PackageRecord["freshness"] {
  if (ageDays === null) return "unknown";
  if (ageDays <= 7) return "current";
  if (ageDays <= 30) return "aging";
  return "stale";
}

function buildSummary(key: string, pkg: any): unknown {
  switch (key) {
    case "verified_datasets":
      return {
        dataset_count:
          pkg.dataset_count ??
          pkg.datasets?.length ??
          0,
        verified_count:
          pkg.datasets?.filter(
            (dataset: any) =>
              dataset.verification_status === "verified"
          ).length ?? 0,
      };

    case "dataset_audit":
      return {
        dataset_count: pkg.dataset_count ?? 0,
        pass_count: pkg.pass_count ?? 0,
        questionable_count: pkg.questionable_count ?? 0,
        fail_count: pkg.fail_count ?? 0,
      };

    case "signal_watchlist":
      return pkg.summary ?? {
        watchlist_items:
          pkg.watchlist_items?.length ?? 0,
      };

    case "macro_attribution":
      return pkg.summary ?? {
        attribution_count:
          pkg.case_macro_attributions?.length ?? 0,
      };

    case "article_workbench":
      return {
        package_count: pkg.package_count ?? 0,
        ready_count: pkg.ready_count ?? 0,
        blocked_count: pkg.blocked_count ?? 0,
      };

    case "article_intelligence":
      return {
        package_count: pkg.package_count ?? 0,
        sector_count:
          pkg.sector_ranking_universe?.sector_count ?? 0,
      };

    case "replay_analogue":
      return {
        historical_case_count:
          pkg.historical_case_count ?? 0,
        replay_record_count:
          pkg.replay_record_count ?? 0,
        taxonomy_aware:
          pkg.taxonomy_aware ?? false,
        top_analogue_count:
          pkg.top_analogues?.length ?? 0,
      };

    case "replay_confidence":
      return {
        confidence_score:
          pkg.confidence_score ?? null,
        confidence_band:
          pkg.confidence_band ?? null,
        interpretation:
          pkg.interpretation ?? null,
      };

    case "replay_scenarios":
      return {
        scenario_count: pkg.scenario_count ?? 0,
        current_replay_state:
          pkg.current_replay_state ?? null,
      };

    case "replay_decision_support":
      return {
        decision_item_count:
          pkg.decision_item_count ?? 0,
        current_replay_state:
          pkg.current_replay_state ?? null,
        global_caution:
          pkg.global_caution ?? null,
      };

    case "replay_client_impact":
      return {
        client_profile_count:
          pkg.client_profile_count ?? 0,
        assessment_count:
          pkg.assessment_count ?? 0,
        high_impact_profiles:
          pkg.assessments?.filter(
            (assessment: any) =>
              assessment.impact_level === "high"
          ).length ?? null,
      };

    case "replay_dataset_evidence":
      return {
        dataset_count:
          pkg.dataset_count ?? 0,
        dataset_pass_count:
          pkg.dataset_pass_count ?? 0,
        draft_count:
          pkg.draft_count ?? 0,
        events_with_passed_dataset_candidates:
          pkg.events_with_passed_dataset_candidates ?? 0,
        dataset_evidence_coverage_ratio:
          pkg.dataset_evidence_coverage_ratio ?? null,
      };

    default:
      return pkg.summary ?? null;
  }
}

function readPackage(
  definition: PackageDefinition
): PackageRecord {
  const packagePath = fullPath(definition.sourcePath);

  if (!fs.existsSync(packagePath)) {
    return {
      key: definition.key,
      source_path: definition.sourcePath,
      required: definition.required,
      status: "missing",
      version: null,
      generated_at: null,
      age_days: null,
      freshness: "unknown",
      summary: null,
      source_files: null,
      error: "source_package_missing",
    };
  }

  try {
    const pkg = JSON.parse(
      fs.readFileSync(packagePath, "utf8")
    );

    const generatedAt = detectGeneratedAt(pkg);
    const ageDays = ageInDays(generatedAt);

    return {
      key: definition.key,
      source_path: definition.sourcePath,
      required: definition.required,
      status: "available",
      version: detectVersion(pkg),
      generated_at: generatedAt,
      age_days: ageDays,
      freshness: classifyFreshness(ageDays),
      summary: buildSummary(definition.key, pkg),
      source_files:
        pkg.source_files ??
        pkg.inputs ??
        null,
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
      summary: null,
      source_files: null,
      error:
        error instanceof Error
          ? error.message
          : "unknown_parse_error",
    };
  }
}

const packageRecords =
  PACKAGE_DEFINITIONS.map(readPackage);

const missingRequired = packageRecords.filter(
  (pkg) =>
    pkg.required &&
    pkg.status !== "available"
);

const missingOptional = packageRecords.filter(
  (pkg) =>
    !pkg.required &&
    pkg.status !== "available"
);

const stalePackages = packageRecords.filter(
  (pkg) =>
    pkg.status === "available" &&
    pkg.freshness === "stale"
);

const availableCount = packageRecords.filter(
  (pkg) => pkg.status === "available"
).length;

const overallStatus =
  missingRequired.length > 0
    ? "incomplete"
    : stalePackages.length > 0
      ? "degraded"
      : "healthy";

const packageMap = Object.fromEntries(
  packageRecords.map((pkg) => [
    pkg.key,
    pkg,
  ])
);

const output = {
  version:
    "business-intelligence-package-v0.1",
  generated_at:
    new Date().toISOString(),

  purpose:
    "Canonical composed view of existing governed intelligence packages for downstream products and analysis.",

  doctrine:
    "The Business Intelligence Package composes specialist outputs without replacing their source packages or creating new intelligence.",

  governance: {
    safety_mode: "COMPOSITION_ONLY",
    production_write_allowed: false,
    human_review_required: true,
    source_packages_remain_canonical: true,
  },

  health: {
    overall_status: overallStatus,
    total_package_count:
      packageRecords.length,
    available_package_count:
      availableCount,
    missing_required_count:
      missingRequired.length,
    missing_optional_count:
      missingOptional.length,
    stale_package_count:
      stalePackages.length,
  },

  packages: packageMap,

  intelligence_sections: {
    datasets: {
      registry:
        packageMap.verified_datasets?.summary ??
        null,
      audit:
        packageMap.dataset_audit?.summary ??
        null,
    },

    signals: {
      watchlist:
        packageMap.signal_watchlist?.summary ??
        null,
    },

    macro: {
      attribution:
        packageMap.macro_attribution?.summary ??
        null,
    },

    replay: {
      analogue:
        packageMap.replay_analogue?.summary ??
        null,
      confidence:
        packageMap.replay_confidence?.summary ??
        null,
      scenarios:
        packageMap.replay_scenarios?.summary ??
        null,
      decision_support:
        packageMap.replay_decision_support?.summary ??
        null,
      client_impact:
        packageMap.replay_client_impact?.summary ??
        null,
      dataset_evidence:
        packageMap.replay_dataset_evidence?.summary ??
        null,
    },

    existing_article_pipeline: {
      workbench:
        packageMap.article_workbench?.summary ??
        null,
      article_intelligence:
        packageMap.article_intelligence?.summary ??
        null,
      status:
        "legacy_pipeline_preserved_for_reuse",
    },
  },

  knowledge_gaps: {
    missing_required_packages:
      missingRequired.map((pkg) => ({
        key: pkg.key,
        source_path: pkg.source_path,
        error: pkg.error,
      })),

    missing_optional_packages:
      missingOptional.map((pkg) => ({
        key: pkg.key,
        source_path: pkg.source_path,
        error: pkg.error,
      })),

    stale_packages:
      stalePackages.map((pkg) => ({
        key: pkg.key,
        source_path: pkg.source_path,
        generated_at: pkg.generated_at,
        age_days: pkg.age_days,
      })),

    known_intelligence_gaps: [
      {
        gap:
          "Replay dataset evidence coverage is currently limited.",
        source_package:
          "data/replay/replay-dataset-evidence-bridge-v0.1.json",
        current_value:
          packageMap.replay_dataset_evidence
            ?.summary,
      },
      {
        gap:
          "Current package is broad and is not yet scoped to one business question or client profile.",
        status:
          "planned_for_topic_intelligence_package",
      },
    ],
  },

  lineage: {
    composer_script:
      "src/scripts/build-business-intelligence-package-v0.1.ts",
    output_path: OUTPUT_PATH,
    direct_source_packages:
      packageRecords.map((pkg) => ({
        key: pkg.key,
        source_path: pkg.source_path,
        version: pkg.version,
        generated_at: pkg.generated_at,
        status: pkg.status,
      })),
  },
};

const absoluteOutputPath =
  fullPath(OUTPUT_PATH);

fs.mkdirSync(
  path.dirname(absoluteOutputPath),
  { recursive: true }
);

fs.writeFileSync(
  absoluteOutputPath,
  `${JSON.stringify(output, null, 2)}\n`
);

console.log({
  version: output.version,
  output: OUTPUT_PATH,
  overall_status:
    output.health.overall_status,
  available_packages:
    output.health.available_package_count,
  missing_required:
    output.health.missing_required_count,
  missing_optional:
    output.health.missing_optional_count,
  stale_packages:
    output.health.stale_package_count,
});
