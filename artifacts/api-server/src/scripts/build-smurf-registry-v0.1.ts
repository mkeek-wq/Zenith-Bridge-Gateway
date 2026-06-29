import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

const smurfs = [
  {
    smurf_id: "HUNGRY",
    name: "Hungry Smurf",
    role: "External data acquisition and controlled ingestion staging",
    category: "ingestion",
    bridge_permission: true,
    trigger_events: ["scheduled_source_check", "manual_ingestion_request"],
    primary_scripts: [
      "src/scripts/build-hungry-smurf-update-scan-v0.1.ts",
      "src/scripts/build-hungry-smurf-controlled-staging-v0.1.ts"
    ],
    required_inputs: [
      "data/intelligence/verified-dataset-registry-v0.1.json",
      "data/intelligence/source-download-config"
    ],
    outputs: [
      "data/intelligence/hungry-smurf-update-scan-v0.1.json",
      "data/ingestion/hungry-smurf-controlled-staging-v0.1.json"
    ],
    wake_after_promotion: false,
    dependencies: [],
    scaling: {
      parallelizable: true,
      parallel_unit: "dataset",
      expected_runtime_seconds: 30,
      yellow_runtime_seconds: 120,
      red_runtime_seconds: 300,
      scale_strategy: "split_by_dataset_then_add_worker"
    }
  },
  {
    smurf_id: "NOSE",
    name: "Nose Smurf",
    role: "Schema, format, and structural validation",
    category: "validation",
    bridge_permission: false,
    trigger_events: ["dataset_staged"],
    primary_scripts: ["src/scripts/build-hungry-smurf-schema-sniff-v0.1.ts"],
    required_inputs: ["data/intelligence/parsed-datasets"],
    outputs: ["data/intelligence/hungry-smurf-schema-sniff-v0.1.json"],
    wake_after_promotion: false,
    dependencies: ["HUNGRY"],
    scaling: {
      parallelizable: true,
      parallel_unit: "dataset",
      expected_runtime_seconds: 10,
      yellow_runtime_seconds: 60,
      red_runtime_seconds: 180,
      scale_strategy: "split_by_dataset"
    }
  },
  {
    smurf_id: "QUANT",
    name: "Quant Smurf",
    role: "Statistical validation, anomaly checks, z-scores, and plausibility checks",
    category: "validation",
    bridge_permission: false,
    trigger_events: ["dataset_staged"],
    primary_scripts: ["src/scripts/build-quant-smurf-ingestion-audit-v0.1.ts"],
    required_inputs: ["data/ingestion/hungry-smurf-controlled-staging-v0.1.json"],
    outputs: ["data/intelligence/quant-smurf-ingestion-audit-v0.1.json"],
    wake_after_promotion: false,
    dependencies: ["HUNGRY", "NOSE"],
    scaling: {
      parallelizable: true,
      parallel_unit: "dataset",
      expected_runtime_seconds: 15,
      yellow_runtime_seconds: 90,
      red_runtime_seconds: 240,
      scale_strategy: "split_by_dataset_then_add_worker"
    }
  },
  {
    smurf_id: "AUDIT",
    name: "Audit Smurf",
    role: "Promotion quality review, confidence scoring, and governance decision support",
    category: "governance",
    bridge_permission: false,
    trigger_events: ["dataset_staged", "quant_audit_complete"],
    primary_scripts: [
      "src/scripts/build-audit-smurf-promotion-review-v0.1.ts",
      "src/scripts/build-hungry-smurf-promotion-package-v0.2.ts"
    ],
    required_inputs: [
      "data/intelligence/quant-smurf-ingestion-audit-v0.1.json",
      "data/intelligence/hungry-smurf-schema-sniff-v0.1.json",
      "data/intelligence/dataset-consistency-audit-v0.1.json"
    ],
    outputs: [
      "data/intelligence/audit-smurf-promotion-review-v0.1.json",
      "data/ingestion/hungry-smurf-promotion-package-v0.2.json"
    ],
    wake_after_promotion: false,
    dependencies: ["NOSE", "QUANT"],
    scaling: {
      parallelizable: false,
      parallel_unit: "promotion_package",
      expected_runtime_seconds: 10,
      yellow_runtime_seconds: 60,
      red_runtime_seconds: 180,
      scale_strategy: "keep_lean_then_split_if_policy_grows"
    }
  },
  {
    smurf_id: "TROLL",
    name: "Sys-admin Troll",
    role: "Bridge guard and architectural rule enforcement",
    category: "security",
    bridge_permission: false,
    trigger_events: ["pre_promotion_check", "scheduled_security_audit"],
    primary_scripts: ["src/scripts/build-sysadmin-troll-bridge-audit-v0.1.ts"],
    required_inputs: ["src/scripts"],
    outputs: ["data/intelligence/sysadmin-troll-bridge-audit-v0.1.json"],
    wake_after_promotion: false,
    dependencies: [],
    scaling: {
      parallelizable: false,
      parallel_unit: "repository_scan",
      expected_runtime_seconds: 20,
      yellow_runtime_seconds: 120,
      red_runtime_seconds: 300,
      scale_strategy: "optimize_scan_then_schedule_less_frequently"
    }
  },
  {
    smurf_id: "PROMOTER",
    name: "Promoter Smurf",
    role: "Promotes approved staged datasets and emits downstream wake events",
    category: "orchestration",
    bridge_permission: false,
    trigger_events: ["human_approval_complete"],
    primary_scripts: [],
    required_inputs: [
      "data/ingestion/hungry-smurf-promotion-package-v0.2.json",
      "data/intelligence/sysadmin-troll-bridge-audit-v0.1.json"
    ],
    outputs: [
      "data/ingestion/promotion-log-v0.1.json",
      "data/intelligence/promoter-smurf-dispatch-v0.1.json"
    ],
    wake_after_promotion: false,
    dependencies: ["AUDIT", "TROLL"],
    scaling: {
      parallelizable: false,
      parallel_unit: "promotion_event",
      expected_runtime_seconds: 20,
      yellow_runtime_seconds: 120,
      red_runtime_seconds: 300,
      scale_strategy: "keep_orchestrator_small_do_not_add_business_logic"
    }
  },
  {
    smurf_id: "COVERAGE",
    name: "Coverage Smurf",
    role: "Refreshes dataset coverage, readiness, and data gaps",
    category: "intelligence",
    bridge_permission: false,
    trigger_events: ["dataset_promoted"],
    primary_scripts: [
      "src/scripts/build-dataset-coverage-engine-v0.1.ts",
      "src/scripts/build-coverage-hardening-dashboard-v0.2.ts",
      "src/scripts/build-macro-coverage-assessment-v0.1.ts"
    ],
    required_inputs: ["data/intelligence/verified-dataset-registry-v0.1.json"],
    outputs: [
      "data/intelligence/dataset-coverage-engine-v0.1.json",
      "data/intelligence/coverage-hardening-dashboard-v0.2.json"
    ],
    wake_after_promotion: true,
    dependencies: ["PROMOTER"],
    scaling: {
      parallelizable: true,
      parallel_unit: "candidate_or_dataset",
      expected_runtime_seconds: 60,
      yellow_runtime_seconds: 300,
      red_runtime_seconds: 900,
      scale_strategy: "split_by_candidate_then_add_worker"
    }
  },
  {
    smurf_id: "SIGNAL",
    name: "Signal Smurf",
    role: "Refreshes signal watchlists and early warning candidates",
    category: "intelligence",
    bridge_permission: false,
    trigger_events: ["dataset_promoted", "coverage_refreshed"],
    primary_scripts: [
      "src/scripts/build-early-warning-signal-skeleton-v0.1.ts",
      "src/scripts/build-signal-watchlist-registry-v0.1.ts"
    ],
    required_inputs: ["data/intelligence/verified-dataset-registry-v0.1.json"],
    outputs: [
      "data/intelligence/early-warning-signal-skeleton-v0.1.json",
      "data/intelligence/signal-watchlist-registry-v0.1.json"
    ],
    wake_after_promotion: true,
    dependencies: ["PROMOTER", "COVERAGE"],
    scaling: {
      parallelizable: true,
      parallel_unit: "signal_or_dataset",
      expected_runtime_seconds: 90,
      yellow_runtime_seconds: 420,
      red_runtime_seconds: 1200,
      scale_strategy: "split_by_signal_family_then_add_worker"
    }
  },
  {
    smurf_id: "REPLAY",
    name: "Replay Smurf",
    role: "Runs replay readiness, dry runs, fleet replay, calibration, and replay evaluation",
    category: "intelligence",
    bridge_permission: false,
    trigger_events: ["dataset_promoted", "signal_refreshed"],
    primary_scripts: [
      "src/scripts/build-replay-readiness-check-v0.1.ts",
      "src/scripts/build-replay-fleet-dry-run-executor-v0.1.ts",
      "src/scripts/build-replay-fleet-evaluation-engine-v0.1.ts",
      "src/scripts/build-replay-calibration-engine-v0.2.ts"
    ],
    required_inputs: ["data/replay", "data/intelligence/experience-registry-v0.2.json"],
    outputs: ["data/replay", "data/intelligence/replay-experience-accumulator-v0.1.json"],
    wake_after_promotion: true,
    dependencies: ["PROMOTER", "SIGNAL"],
    scaling: {
      parallelizable: true,
      parallel_unit: "case",
      expected_runtime_seconds: 300,
      yellow_runtime_seconds: 900,
      red_runtime_seconds: 1800,
      scale_strategy: "split_by_case_or_sector_then_add_replay_worker"
    }
  },
  {
    smurf_id: "GRAPH",
    name: "Graph Smurf",
    role: "Refreshes graph packages, graph specifications, render specs, and graph assets",
    category: "publication",
    bridge_permission: false,
    trigger_events: ["dataset_promoted", "coverage_refreshed"],
    primary_scripts: [
      "src/scripts/build-graph-data-package-v0.1.ts",
      "src/scripts/build-graph-specification-package-v0.1.ts",
      "src/scripts/render-graph-specification-v0.3.ts"
    ],
    required_inputs: ["data/intelligence/verified-dataset-registry-v0.1.json"],
    outputs: [
      "data/intelligence/graph-data-package-v0.1.json",
      "data/intelligence/graph-specification-package-v0.1.json"
    ],
    wake_after_promotion: true,
    dependencies: ["PROMOTER", "COVERAGE"],
    scaling: {
      parallelizable: true,
      parallel_unit: "graph",
      expected_runtime_seconds: 90,
      yellow_runtime_seconds: 420,
      red_runtime_seconds: 1200,
      scale_strategy: "split_by_graph_then_add_worker"
    }
  },
  {
    smurf_id: "WORKBENCH",
    name: "Workbench Smurf",
    role: "Refreshes article/workbench packages and transparency-ready metadata",
    category: "publication",
    bridge_permission: false,
    trigger_events: ["coverage_refreshed", "graph_refreshed", "signal_refreshed"],
    primary_scripts: [
      "src/scripts/build-article-workbench-package-v0.2.ts",
      "src/scripts/build-interpretation-workbench-package-v0.1.ts",
      "src/scripts/build-graph-data-workbench-package-v0.1.ts"
    ],
    required_inputs: [
      "data/intelligence/dataset-coverage-engine-v0.1.json",
      "data/intelligence/graph-data-package-v0.1.json"
    ],
    outputs: [
      "data/intelligence/article-workbench-package-v0.2.json",
      "data/intelligence/interpretation-workbench-package-v0.1.json"
    ],
    wake_after_promotion: true,
    dependencies: ["COVERAGE", "GRAPH", "SIGNAL"],
    scaling: {
      parallelizable: true,
      parallel_unit: "article_candidate",
      expected_runtime_seconds: 120,
      yellow_runtime_seconds: 600,
      red_runtime_seconds: 1500,
      scale_strategy: "split_by_article_candidate_then_add_worker"
    }
  },
  {
    smurf_id: "BRAINY",
    name: "Brainy Smurf",
    role: "Village R&D: studies outputs, proposes improvements, experiments, and next-generation Smurf designs",
    category: "research",
    bridge_permission: false,
    trigger_events: ["village_run_complete", "scheduled_reflection"],
    primary_scripts: [],
    required_inputs: [
      "data/intelligence/smurf-village-health-v0.1.json",
      "data/intelligence/promoter-smurf-dispatch-v0.1.json"
    ],
    outputs: ["data/intelligence/brainy-notebook-v0.1.json"],
    wake_after_promotion: false,
    dependencies: ["PROMOTER"],
    scaling: {
      parallelizable: false,
      parallel_unit: "reflection_cycle",
      expected_runtime_seconds: 300,
      yellow_runtime_seconds: 900,
      red_runtime_seconds: 1800,
      scale_strategy: "keep_async_never_block_production"
    }
  }
];

const enriched = smurfs.map((s) => {
  const scripts = s.primary_scripts.map((script) => ({
    script,
    exists: exists(script)
  }));

  const inputs = s.required_inputs.map((input) => ({
    path: input,
    exists: exists(input)
  }));

  const outputs = s.outputs.map((output) => ({
    path: output,
    exists: exists(output)
  }));

  const missingScripts = scripts.filter((x) => !x.exists).map((x) => x.script);
  const missingInputs = inputs.filter((x) => !x.exists).map((x) => x.path);

  return {
    ...s,
    readiness: {
      scripts,
      inputs,
      outputs,
      missing_scripts: missingScripts,
      missing_inputs: missingInputs,
      status:
        missingScripts.length === 0 && missingInputs.length === 0
          ? "ready_or_partially_active"
          : "needs_mapping_or_inputs"
    }
  };
});

const output = {
  registry_version: "smurf-registry-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Village registry for Smurf responsibilities, triggers, dependencies, outputs, bridge permissions, and scaling rules.",
  governance: {
    papa_smurf_is_orchestrator: true,
    brainy_smurf_is_research_not_authority: true,
    only_approved_ingestion_smurfs_cross_bridge: true,
    promoter_has_no_business_logic: true,
    bottleneck_policy:
      "split parallelizable jobs first, add worker or VPS capacity second, redesign last"
  },
  smurf_count: enriched.length,
  wake_after_promotion_count: enriched.filter((s) => s.wake_after_promotion).length,
  ready_count: enriched.filter((s) => s.readiness.status === "ready_or_partially_active").length,
  needs_mapping_count: enriched.filter((s) => s.readiness.status !== "ready_or_partially_active").length,
  smurfs: enriched
};

const outPath = path.join(ROOT, "data/intelligence/smurf-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  smurf_count: output.smurf_count,
  wake_after_promotion_count: output.wake_after_promotion_count,
  ready_count: output.ready_count,
  needs_mapping_count: output.needs_mapping_count,
  output: path.relative(ROOT, outPath)
});

for (const s of enriched) {
  console.log(
    `${s.smurf_id} | ${s.readiness.status} | wake_after_promotion=${s.wake_after_promotion} | missing_scripts=${s.readiness.missing_scripts.length} | missing_inputs=${s.readiness.missing_inputs.length}`
  );
}
