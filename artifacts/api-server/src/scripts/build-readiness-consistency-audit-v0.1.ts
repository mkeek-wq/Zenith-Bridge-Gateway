import fs from "fs";

const WORKBENCH_FILE = "data/intelligence/article-workbench-package-v0.2.json";
const OUTPUT_FILE = "data/intelligence/readiness-consistency-audit-v0.1.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeDatasetId(value: string) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function datasetFamily(value: string) {
  const id = normalizeDatasetId(value);

  if (id.includes("SEMICONDUCTOR") || id.includes("ELECTRONICS")) {
    return "SEMICONDUCTOR_ELECTRONICS";
  }

  if (id.includes("TOTAL_MANUFACTURING")) {
    return "TOTAL_MANUFACTURING";
  }

  if (id.includes("PETROLEUM")) {
    return "PETROLEUM";
  }

  if (id.includes("TRANSPORT")) {
    return "TRANSPORT_ENGINEERING";
  }

  if (id.includes("PRECISION") || id.includes("MACHINERY")) {
    return "PRECISION_ENGINEERING";
  }

  return id;
}

const workbench = readJson(WORKBENCH_FILE);

const audits = (workbench.packages ?? []).map((pkg: any) => {
  const readiness = pkg.readiness_decision ?? {};
  const missingDatasets = readiness.missing_datasets ?? [];
  const graphPackages = pkg.graph_packages ?? [];

  const graphDatasetIds = graphPackages.map((graph: any) => graph.dataset_id);
  const graphFamilies = new Set(graphDatasetIds.map(datasetFamily));

  const missingDatasetAudit = missingDatasets.map((missing: any) => {
    const missingFamily = datasetFamily(missing.dataset_id);

    const exactGraphMatch = graphDatasetIds
      .map(normalizeDatasetId)
      .includes(normalizeDatasetId(missing.dataset_id));

    const familyGraphMatch = graphFamilies.has(missingFamily);

    return {
      missing_dataset_id: missing.dataset_id,
      missing_dataset_name: missing.name,
      missing_dataset_family: missingFamily,
      importance: missing.importance,
      verification_status: missing.verification_status,
      exact_graph_package_match: exactGraphMatch,
      family_graph_package_match: familyGraphMatch,
      possible_false_missing_dataset:
        !exactGraphMatch && familyGraphMatch,
    };
  });

  const possibleFalseMissingDatasets = missingDatasetAudit.filter(
    (item: any) => item.possible_false_missing_dataset
  );

  const graphCoverageAvailable = graphPackages.length > 0;

  let consistencyStatus = "consistent";

  if (possibleFalseMissingDatasets.length > 0) {
    consistencyStatus = "possible_false_missing_dataset";
  } else if (
    readiness.generation_status === "blocked_until_more_data" &&
    graphCoverageAvailable
  ) {
    consistencyStatus = "blocked_but_graph_data_available";
  } else if (
    readiness.generation_status === "ai_draft_allowed_with_caution" &&
    graphCoverageAvailable &&
    missingDatasetAudit.length === 0
  ) {
    consistencyStatus = "caution_without_missing_dataset";
  }

  const recommendedGenerationStatus =
    consistencyStatus === "possible_false_missing_dataset" &&
    readiness.generation_status === "ai_draft_allowed_with_caution"
      ? "ai_draft_allowed_with_review_note"
      : readiness.generation_status;

  return {
    candidate_id: pkg.candidate_id,
    title: pkg.candidate_title,
    readiness_status: readiness.generation_status,
    readiness_label: readiness.readiness,
    coverage_score: readiness.coverage_score,
    required_dataset_count: readiness.required_dataset_count,
    verified_dataset_count: readiness.verified_dataset_count,
    missing_dataset_count: readiness.missing_dataset_count,
    graph_package_count: graphPackages.length,
    graph_dataset_ids: graphDatasetIds,
    graph_dataset_families: Array.from(graphFamilies),
    missing_dataset_audit: missingDatasetAudit,
    consistency_status: consistencyStatus,
    recommended_generation_status: recommendedGenerationStatus,
    governance: {
      human_review_required: true,
      can_override_caution:
        recommendedGenerationStatus === "ai_draft_allowed_with_review_note",
      override_reason:
        recommendedGenerationStatus === "ai_draft_allowed_with_review_note"
          ? "Readiness layer reports a missing dataset, but graph package contains a closely related dataset family."
          : null,
    },
  };
});

const output = {
  audit_version: "readiness-consistency-audit-v0.1",
  generated_at: new Date().toISOString(),
  source_file: WORKBENCH_FILE,
  audit_count: audits.length,
  issue_count: audits.filter(
    (audit: any) => audit.consistency_status !== "consistent"
  ).length,
  audits,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  audit_count: output.audit_count,
  issue_count: output.issue_count,
  output: OUTPUT_FILE,
});
