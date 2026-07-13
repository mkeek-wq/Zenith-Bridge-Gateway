import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OUTPUT_PATH =
  "data/intelligence/organizational-change-request-v0.1.json";

type SourceStatus = "available" | "missing" | "invalid";
type Freshness = "current" | "aging" | "stale" | "unknown";
type OverallStatus = "green" | "amber" | "red";

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

const SOURCE_DEFINITIONS = [
  {
    key: "replay_improvement_proposals",
    sourcePath: "data/replay/replay-improvement-proposals-v0.1.json",
    required: true,
  },
];

function fullPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function detectVersion(data: any): string | null {
  return (
    data.contract_version ??
    data.proposal_package_version ??
    data.package_version ??
    data.registry_version ??
    data.version ??
    null
  );
}

function detectGeneratedAt(data: any): string | null {
  return data.generated_at ?? data.created_at ?? null;
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

function readSource(definition: {
  key: string;
  sourcePath: string;
  required: boolean;
}): SourceRecord {
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

function normalizeStatus(status: string | null | undefined): string {
  switch (status) {
    case "awaiting_papa_approval":
      return "submitted_to_papa";
    case "approved":
    case "approved_for_shadow":
      return "approved_for_testing";
    case "rejected":
      return "rejected";
    case "promoted":
    case "implemented":
      return "promoted";
    default:
      return status ?? "draft";
  }
}

function buildChangeRequest(proposal: any, index: number) {
  const proposalId =
    proposal.proposal_id ?? `UNKNOWN_PROPOSAL_${index + 1}`;

  const targetCaseId = proposal.target_case_id ?? null;

  return {
    contract_version: "organizational-change-request-v0.1",
    change_request_id: `OCR-REPLAY-${String(index + 1).padStart(3, "0")}-${proposalId}`,
    title:
      proposal.title ??
      `Replay organizational improvement ${index + 1}`,
    created_at: new Date().toISOString(),
    created_by: "Brainy",
    originating_domain: "replay",
    change_type: proposal.type ?? "unspecified",
    priority: proposal.priority ?? "unknown",
    current_status: normalizeStatus(proposal.status),

    current_situation: {
      target_capability: "historical_replay_case_library",
      target_case_id: targetCaseId,
      present_condition:
        "Replay case completeness is below the governed enrichment threshold.",
      observed_health: "degraded",
      source_freshness: "inherited_from_source_package",
    },

    problem_or_opportunity: {
      classification: "capability_gap",
      statement:
        proposal.recommended_action ??
        "Replay case requires additional governed enrichment.",
      validation_scope:
        targetCaseId ??
        proposalId,
    },

    evidence: [
      {
        source_key: "replay_improvement_proposals",
        source_path:
          "data/replay/replay-improvement-proposals-v0.1.json",
        proposal_id: proposalId,
        source_owner: "Replay",
        relevance:
          "Domain proposal identifying an incomplete historical Replay case.",
        observed_values: proposal.rationale ?? {},
        limitations: [
          "Domain proposal is not approval.",
          "Completeness findings do not prove that enrichment will improve downstream outcomes.",
        ],
      },
    ],

    architectural_diagnosis: {
      observed_fact:
        targetCaseId !== null
          ? `Replay case ${targetCaseId} is missing required historical case fields.`
          : "Replay proposal identifies an incomplete historical case.",
      interpretation:
        "Insufficient case depth limits Replay evidence quality, historical explanation and future analogue usefulness.",
      root_cause_status: "partially_observed",
      diagnosis_owner: "Brainy",
    },

    options_considered: [
      {
        option_id: "OPTION_1_NO_ACTION",
        description:
          "Retain the current Replay case without enrichment.",
        expected_benefit: "No implementation effort.",
        risk:
          "Known completeness gaps remain and may limit downstream Replay value.",
        reversibility: "fully_reversible",
        disposition: "not_recommended",
      },
      {
        option_id: "OPTION_2_CONTROLLED_ENRICHMENT",
        description:
          proposal.recommended_action ??
          "Enrich the incomplete Replay case.",
        expected_benefit:
          "Improve evidence depth, explainability and future Replay usefulness.",
        risk:
          "New evidence may be incomplete, contradictory or incorrectly mapped.",
        reversibility: "reversible_before_promotion",
        disposition: "recommended",
      },
    ],

    recommended_change: {
      target_capability: "historical_replay_case_library",
      target_case_id: targetCaseId,
      action:
        proposal.recommended_action ??
        "Perform controlled Replay case enrichment.",
      included_scope:
        proposal.rationale?.missing_fields ?? [],
      excluded_scope: [
        "No autonomous production promotion.",
        "No mechanism validation.",
        "No modification outside the approved Replay case.",
      ],
      compatibility_requirement:
        "Preserve the existing Replay proposal and governance lifecycle.",
    },

    expected_improvement: {
      hypothesis:
        "Completing missing case fields should improve historical evidence depth and downstream Replay interpretability.",
      expected_dimensions: [
        "coverage",
        "traceability",
        "explainability",
        "historical_case_maturity",
      ],
      measured_result: null,
    },

    success_metrics: [
      {
        metric_name: "case_completeness_score",
        current_baseline:
          proposal.rationale?.completeness_score ?? null,
        expected_target: 0.8,
        minimum_acceptable_result: 0.8,
        measurement_method:
          "Rebuild and inspect the Replay case completeness report.",
        measurement_owner: "Shadow Crew",
        measurement_period: "post_implementation_shadow_run",
      },
      {
        metric_name: "required_missing_fields",
        current_baseline:
          proposal.rationale?.missing_fields?.length ?? null,
        expected_target: 0,
        minimum_acceptable_result: 0,
        measurement_method:
          "Validate required Replay case fields against the completeness contract.",
        measurement_owner: "Shadow Crew",
        measurement_period: "post_implementation_shadow_run",
      },
    ],

    risks: [
      {
        risk: "Unverified or weak evidence is added to the Replay case.",
        likelihood: "medium",
        impact: "high",
        mitigation:
          "Require source review, lineage and Shadow validation before promotion.",
        residual_risk: "low_to_medium",
        owner: "Replay / Shadow Crew",
      },
      {
        risk: "Scope expands beyond the identified case.",
        likelihood: "low",
        impact: "medium",
        mitigation:
          "Restrict implementation to the approved target case and missing fields.",
        residual_risk: "low",
        owner: "Coding Smurf",
      },
    ],

    dependencies: {
      known_upstream: [
        "data/replay/case-completeness-report-v0.1.json",
        "data/replay/replay-improvement-proposals-v0.1.json",
      ],
      known_downstream: [
        "Replay proposal registry",
        "Replay Shadow execution",
        "Replay governance history",
        "Replay improvement history",
      ],
      blast_radius: "local",
      discovery_required_before_implementation: true,
    },

    implementation_boundaries: {
      approved_scope:
        proposal.rationale?.missing_fields ?? [],
      prohibited_scope: [
        "Production promotion",
        "Unapproved architectural redesign",
        "Modification of unrelated Replay cases",
        "Direct mechanism lifecycle changes",
      ],
      backward_compatibility_required: true,
      versioned_output_required: true,
      documentation_required: true,
    },

    shadow_validation_plan: {
      validation_objective:
        "Determine whether the approved Replay case enrichment resolves the identified completeness gaps without introducing regressions.",
      environment: "shadow_or_dry_run",
      baseline:
        proposal.rationale?.completeness_score ?? null,
      expected_result:
        "Completeness score reaches at least 0.8 and required missing fields are resolved.",
      required_checks: [
        "schema_validation",
        "source_lineage_validation",
        "case_completeness_rebuild",
        "regression_check",
        "production_write_prohibition",
      ],
      failure_conditions: [
        "Completeness remains below 0.8.",
        "Required fields remain missing.",
        "Evidence lineage is absent.",
        "Unapproved files are modified.",
      ],
    },

    rollback_plan: {
      known_good_state:
        "Current version-controlled Replay case before enrichment.",
      recovery_mechanism:
        "Restore the affected case from Git or the approved repository checkpoint.",
      rollback_trigger:
        "Shadow validation failure, lineage failure or unexpected downstream regression.",
      responsible_operator: "Coding Smurf under Papa authorization",
      post_rollback_verification: [
        "Confirm original case restored.",
        "Rebuild completeness report.",
        "Confirm unrelated Replay artifacts remain unchanged.",
      ],
    },

    organizational_learning_plan: {
      success_outputs: [
        "Replay improvement history update",
        "Experience Registry observation",
        "Updated completeness baseline",
      ],
      failure_outputs: [
        "Replay improvement history failure record",
        "Experience Registry observation",
        "Revised implementation or evidence requirements",
      ],
    },

    governance: {
      testing_decision: null,
      production_decision: null,
      human_review_required: true,
      papa_approval_required: true,
      shadow_validation_required: true,
      autonomous_implementation_allowed: false,
      autonomous_production_promotion_allowed: false,
    },

    lineage: {
      originating_proposal_id: proposalId,
      originating_proposal_package:
        "data/replay/replay-improvement-proposals-v0.1.json",
      contract_document:
        "governance/02-architecture/H8_3_ORGANIZATIONAL_CHANGE_REQUEST_v0.1.md",
      architecture_document:
        "governance/02-architecture/H8_2_ORGANIZATIONAL_IMPROVEMENT_ARCHITECTURE_v0.1.md",
      organizational_contracts_document:
        "governance/02-architecture/H8_1_ORGANIZATIONAL_CONTRACTS_v0.1.md",
    },
  };
}

const sources = SOURCE_DEFINITIONS.map(readSource);

const replaySource = sources.find(
  (source) => source.key === "replay_improvement_proposals"
);

const replayProposals =
  replaySource?.status === "available" &&
  Array.isArray(replaySource.data?.proposals)
    ? replaySource.data.proposals
    : [];

const changeRequests = replayProposals.map(buildChangeRequest);

const requiredMissing = sources.filter(
  (source) => source.required && source.status === "missing"
).length;

const requiredInvalid = sources.filter(
  (source) => source.required && source.status === "invalid"
).length;

const staleSources = sources.filter(
  (source) => source.freshness === "stale"
).length;

const warnings: string[] = [];
const criticals: string[] = [];

if (requiredMissing > 0) {
  criticals.push(`required_missing_sources:${requiredMissing}`);
}

if (requiredInvalid > 0) {
  criticals.push(`required_invalid_sources:${requiredInvalid}`);
}

if (staleSources > 0) {
  warnings.push(`stale_sources:${staleSources}`);
}

if (changeRequests.length === 0) {
  warnings.push("no_change_requests_created");
}

const overallStatus: OverallStatus =
  criticals.length > 0
    ? "red"
    : warnings.length > 0
      ? "amber"
      : "green";

const recommendations: string[] = [];

if (requiredMissing > 0 || requiredInvalid > 0) {
  recommendations.push(
    "Restore or repair required domain proposal sources before governance review."
  );
}

if (staleSources > 0) {
  recommendations.push(
    "Refresh stale proposal sources before relying on generated change requests."
  );
}

if (changeRequests.length > 0) {
  recommendations.push(
    "Papa should review generated change requests individually before approving implementation or Shadow validation."
  );
}

if (recommendations.length === 0) {
  recommendations.push(
    "No organizational change requests currently require action."
  );
}

const output = {
  version: "organizational-change-request-package-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Normalize domain-specific improvement proposals into the canonical Organizational Change Request contract.",

  doctrine: {
    proposals_are_not_decisions: true,
    normalization_does_not_grant_approval: true,
    source_packages_remain_canonical: true,
    brainy_may_propose_but_not_approve: true,
    papa_governance_required: true,
    shadow_validation_required: true,
    production_write_allowed: false,
    human_review_required: true,
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
    stale_source_count: staleSources,
    change_request_count: changeRequests.length,
    warning_count: warnings.length,
    critical_count: criticals.length,
  },

  summary: {
    originating_domains:
      changeRequests.length > 0 ? ["replay"] : [],
    change_request_count: changeRequests.length,
    high_priority_count: changeRequests.filter(
      (request) => request.priority === "high"
    ).length,
    medium_priority_count: changeRequests.filter(
      (request) => request.priority === "medium"
    ).length,
    low_priority_count: changeRequests.filter(
      (request) => request.priority === "low"
    ).length,
    submitted_to_papa_count: changeRequests.filter(
      (request) => request.current_status === "submitted_to_papa"
    ).length,
  },

  warnings,
  criticals,
  recommendations,
  change_requests: changeRequests,

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
      "src/scripts/build-organizational-change-request-v0.1.ts",
    output_path: OUTPUT_PATH,
    direct_source_packages: sources.map((source) => ({
      key: source.key,
      source_path: source.source_path,
      version: source.version,
      generated_at: source.generated_at,
      status: source.status,
    })),
    constitutional_documents: [
      "governance/02-architecture/H8_1_ORGANIZATIONAL_CONTRACTS_v0.1.md",
      "governance/02-architecture/H8_2_ORGANIZATIONAL_IMPROVEMENT_ARCHITECTURE_v0.1.md",
      "governance/02-architecture/H8_3_ORGANIZATIONAL_CHANGE_REQUEST_v0.1.md",
    ],
  },
};

fs.mkdirSync(path.dirname(fullPath(OUTPUT_PATH)), {
  recursive: true,
});

fs.writeFileSync(
  fullPath(OUTPUT_PATH),
  JSON.stringify(output, null, 2)
);

console.log({
  output: OUTPUT_PATH,
  overall_status: output.health.overall_status,
  source_count: output.health.source_count,
  change_request_count: output.health.change_request_count,
  warning_count: output.health.warning_count,
  critical_count: output.health.critical_count,
});
