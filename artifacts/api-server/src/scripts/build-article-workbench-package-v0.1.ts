import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

const candidateQueue = readJson(
  "/var/www/zenith-admin/intelligence-data/candidate-queue-v0.2.json"
);

const coverageEngine = readJson(
  path.join(root, "data/intelligence/dataset-coverage-engine-v0.1.json")
);

const readinessGate = readJson(
  path.join(root, "data/intelligence/article-data-readiness-gate-v0.1.json")
);

const graphPackageRegistry = readJson(
  path.join(root, "data/intelligence/graph-data-package-v0.1.json")
);

const datasetRegistry = readJson(
  path.join(root, "data/intelligence/verified-dataset-registry-v0.1.json")
);

const coverageByCandidate = new Map(
  (coverageEngine.coverage ?? []).map((row: any) => [row.candidate_id, row])
);

const readinessByCandidate = new Map(
  (readinessGate.decisions ?? []).map((row: any) => [row.candidate_id, row])
);

const datasetById = new Map(
  (datasetRegistry.datasets ?? []).map((dataset: any) => [dataset.dataset_id, dataset])
);

const graphPackageByDatasetId = new Map(
  (graphPackageRegistry.packages ?? []).map((pkg: any) => [pkg.dataset_id, pkg])
);

function summarizeDataset(dataset: any) {
  if (!dataset) return null;

  return {
    dataset_id: dataset.dataset_id,
    name: dataset.name,
    country: dataset.country ?? null,
    metric_type: dataset.metric_type ?? null,
    frequency: dataset.frequency ?? null,
    unit: dataset.unit ?? null,
    verification_status: dataset.verification_status,
    coverage_start: dataset.coverage_start ?? null,
    coverage_end: dataset.coverage_end ?? null,
    values_count: dataset.values_count ?? 0,
    source_url: dataset.source_url ?? null,
    preferred_sources: dataset.preferred_sources ?? [],
    source_metadata: dataset.source_metadata ?? null,
    reviewed_at: dataset.reviewed_at ?? null,
    updated_at: dataset.updated_at ?? null,
  };
}

function summarizeGraphPackage(pkg: any) {
  if (!pkg) return null;

  return {
    graph_package_id: pkg.graph_package_id,
    dataset_id: pkg.dataset_id,
    title: pkg.title,
    country: pkg.country ?? null,
    unit: pkg.unit ?? null,
    frequency: pkg.frequency ?? null,
    source_name: pkg.source_name ?? null,
    source_url: pkg.source_url ?? null,
    coverage_start: pkg.coverage_start ?? null,
    coverage_end: pkg.coverage_end ?? null,
    values_count: pkg.values_count ?? 0,
    latest_period: pkg.latest_period ?? null,
    latest_value: pkg.latest_value ?? null,
    previous_period: pkg.previous_period ?? null,
    previous_value: pkg.previous_value ?? null,
    latest_yoy_percent: pkg.latest_yoy_percent ?? null,
    ten_year_change_percent: pkg.ten_year_change_percent ?? null,
    trend_direction: pkg.trend_direction ?? null,
    recommended_graphs: pkg.recommended_graphs ?? [],
    values: pkg.values ?? [],
    source_metadata: pkg.source_metadata ?? null,
  };
}

const packages = (candidateQueue.candidates ?? []).map((candidate: any) => {
  const coverage = coverageByCandidate.get(candidate.candidate_id) as any;
  const readiness = readinessByCandidate.get(candidate.candidate_id) as any;

  const coverageDatasets = coverage?.datasets ?? [];

  const datasets = coverageDatasets.map((coverageDataset: any) => {
    const registryDataset = datasetById.get(coverageDataset.dataset_id);
    return {
      requirement: coverageDataset,
      registry: summarizeDataset(registryDataset),
    };
  });

  const graphPackages = coverageDatasets
    .map((coverageDataset: any) =>
      summarizeGraphPackage(graphPackageByDatasetId.get(coverageDataset.dataset_id))
    )
    .filter(Boolean);

  const verifiedDatasets = datasets.filter(
    (dataset: any) => dataset.registry?.verification_status === "verified"
  );

  const missingDatasets = datasets.filter(
    (dataset: any) => dataset.registry?.verification_status !== "verified"
  );

  const sourceRegistry = verifiedDatasets
    .map((dataset: any) => dataset.registry)
    .filter(Boolean)
    .map((dataset: any) => ({
      dataset_id: dataset.dataset_id,
      name: dataset.name,
      source_url: dataset.source_url,
      preferred_sources: dataset.preferred_sources,
      source_metadata: dataset.source_metadata,
    }));

  const workbenchStatus =
    readiness?.generation_allowed === true
      ? "workbench_ready"
      : "blocked_by_readiness_gate";

  return {
    workbench_package_id: `WBP_${candidate.candidate_id}`,
    candidate_id: candidate.candidate_id,
    candidate_title: candidate.title,
    generated_at: new Date().toISOString(),

    workbench_status: workbenchStatus,

    candidate: {
      title: candidate.title,
      excerpt: candidate.excerpt,
      country: candidate.country,
      category: candidate.category,
      primary_driver: candidate.primary_driver,
      confidence_score: candidate.confidence_score,
      confidence_band: candidate.confidence_band,
      maturity_stage: candidate.maturity_stage,
      evidence_count: candidate.evidence_count,
      source_case_count: candidate.source_case_count,
      publication_status: candidate.publication_status,
      graph_ready: candidate.graph_ready,
      asset_ids: candidate.asset_ids ?? [],
      source_package: candidate.source_package ?? null,
    },

    readiness_decision: readiness ?? null,

    coverage: coverage
      ? {
          readiness: coverage.readiness,
          coverage_score: coverage.coverage_score,
          graph_readiness: coverage.graph_readiness,
          required_dataset_count: coverage.required_dataset_count,
          verified_dataset_count: coverage.verified_dataset_count,
          missing_dataset_count: coverage.missing_dataset_count,
        }
      : null,

    datasets,
    verified_datasets: verifiedDatasets.map((dataset: any) => dataset.registry),
    missing_datasets: missingDatasets.map((dataset: any) => dataset.requirement),

    graph_packages: graphPackages,

    source_registry: sourceRegistry,

    article_protocol: {
      output_type: "publication_article",
      must_include: [
        "title",
        "excerpt",
        "country",
        "category",
        "article_body",
        "graph_locations",
        "source_section",
        "confidence_section",
      ],
      must_not_include: [
        "Executive Summary",
        "Replay Analysis",
        "What SMURF Found",
        "SMURF",
        "internal engine references",
        "unverified metrics",
        "placeholder values",
      ],
      human_review_required: true,
      autonomous_publication_allowed: false,
    },
  };
});

const registry = {
  workbench_version: "article-workbench-package-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Combines article candidates, verified datasets, coverage, readiness decisions, graph packages, and source metadata into AI-ready article workbench packages.",
  source_files: {
    candidate_queue: "/var/www/zenith-admin/intelligence-data/candidate-queue-v0.2.json",
    coverage_engine: "data/intelligence/dataset-coverage-engine-v0.1.json",
    readiness_gate: "data/intelligence/article-data-readiness-gate-v0.1.json",
    graph_data_package: "data/intelligence/graph-data-package-v0.1.json",
    verified_dataset_registry: "data/intelligence/verified-dataset-registry-v0.1.json",
  },
  package_count: packages.length,
  ready_count: packages.filter((pkg: any) => pkg.workbench_status === "workbench_ready").length,
  blocked_count: packages.filter((pkg: any) => pkg.workbench_status !== "workbench_ready").length,
  packages,
};

const outPath = path.join(root, "data/intelligence/article-workbench-package-v0.1.json");

writeJson(outPath, registry);

console.log({
  workbench_version: registry.workbench_version,
  package_count: registry.package_count,
  ready_count: registry.ready_count,
  blocked_count: registry.blocked_count,
  output: outPath,
});
