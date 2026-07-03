import fs from "fs";

const WORKBENCH_FILE =
  "data/intelligence/article-workbench-package-v0.2.json";

const ARTICLE_INTELLIGENCE_FILE =
  "data/intelligence/article-intelligence-package-v0.1.json";

const CONSISTENCY_AUDIT_FILE =
  "data/intelligence/readiness-consistency-audit-v0.1.json";

const OUTPUT_FILE =
  "data/intelligence/openai-article-package-v0.4.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const workbench = readJson(WORKBENCH_FILE);
const articleIntelligence = readJson(ARTICLE_INTELLIGENCE_FILE);
const consistencyAudit = readJson(CONSISTENCY_AUDIT_FILE);

const intelligenceByCandidate = new Map(
  (articleIntelligence.packages ?? []).map((pkg: any) => [
    pkg.candidate_id,
    pkg,
  ])
);

const consistencyByCandidate = new Map(
  (consistencyAudit.audits ?? []).map((audit: any) => [
    audit.candidate_id,
    audit,
  ])
);

function buildMandatoryFindings(intelligence: any, pkg: any, articleLabel: string) {
  const findings: any[] = [];

  const rp = intelligence?.relative_performance;

  if (rp) {
    findings.push({
      finding_id: "MF001",
      priority: "critical",
      type: "relative_performance",
      statement: `${articleLabel} grew ${rp.sector_growth_10y_percent}% over 10 years versus ${rp.manufacturing_growth_10y_percent}% for total manufacturing, an outperformance of ${rp.outperformance_pp} percentage points.`,
      required_terms: [
        String(rp.sector_growth_10y_percent),
        String(rp.manufacturing_growth_10y_percent),
        String(rp.outperformance_pp),
      ],
    });
  }

  const ranking = intelligence?.sector_ranking;

  if (ranking) {
    findings.push({
      finding_id: "MF002",
      priority: "critical",
      type: "sector_ranking",
      statement: `${articleLabel} ranked #${ranking.rank_10y_growth} out of ${ranking.sector_count} major manufacturing sectors by 10-year growth. The article must explicitly state rank #${ranking.rank_10y_growth} out of ${ranking.sector_count}.`,
      required_terms: [
        `#${ranking.rank_10y_growth}`,
        `out of ${ranking.sector_count}`,
      ],
    });
  }

  const share = intelligence?.manufacturing_share;

  if (share) {
    findings.push({
      finding_id: "MF003",
      priority: "important",
      type: "manufacturing_share",
      statement: `${articleLabel}'s manufacturing share increased from ${share.share_start_percent}% in ${share.start_period} to ${share.share_end_percent}% in ${share.end_period}, a gain of ${share.change_pp} percentage points.`,
      required_terms: [
        String(share.share_start_percent),
        String(share.share_end_percent),
        String(share.change_pp),
      ],
    });
  }

  const momentum = intelligence?.latest_momentum;

  if (momentum) {
    findings.push({
      finding_id: "MF004",
      priority: "important",
      type: "latest_momentum",
      statement: `In ${momentum.latest_period}, ${articleLabel} output reached ${momentum.latest_value}, with latest year-on-year growth of ${momentum.latest_yoy_percent}%.`,
      required_terms: [
        String(momentum.latest_period),
        String(momentum.latest_value),
        String(momentum.latest_yoy_percent),
      ],
    });
  }

  const proxy = intelligence?.proxy_disclosure;

  if (proxy?.required) {
    findings.push({
      finding_id: "MF005",
      priority: "critical",
      type: "proxy_disclosure",
      statement: `${proxy.direct_series_used} is used as a proxy for capital-equipment-linked activity because deeper subsegments are not exposed in the current table.`,
      required_terms: [String(proxy.direct_series_used), "proxy"],
    });
  }

  const primaryGraph = (pkg.graph_packages ?? [])[0];
  const manufacturingGraph = (pkg.graph_packages ?? []).find((graph: any) =>
    String(graph.dataset_id ?? "").includes("TOTAL_MANUFACTURING")
  );

  if (!findings.length && primaryGraph) {
    findings.push({
      finding_id: "MF001",
      priority: "critical",
      type: "primary_series_momentum",
      statement: `${primaryGraph.title} reached ${primaryGraph.latest_value} in ${primaryGraph.latest_period}, with latest year-on-year growth of ${primaryGraph.latest_yoy_percent}%.`,
      required_terms: [
        String(primaryGraph.latest_period),
        String(primaryGraph.latest_value),
        String(primaryGraph.latest_yoy_percent),
      ],
    });

    findings.push({
      finding_id: "MF002",
      priority: "critical",
      type: "ten_year_change",
      statement: `${primaryGraph.title} changed by ${primaryGraph.ten_year_change_percent}% over the 10-year period from ${primaryGraph.coverage_start} to ${primaryGraph.coverage_end}.`,
      required_terms: [
        String(primaryGraph.ten_year_change_percent),
        String(primaryGraph.coverage_start),
        String(primaryGraph.coverage_end),
      ],
    });

    if (manufacturingGraph) {
      findings.push({
        finding_id: "MF003",
        priority: "important",
        type: "manufacturing_comparison",
        statement: `${primaryGraph.title} recorded ${primaryGraph.latest_yoy_percent}% latest year-on-year growth versus ${manufacturingGraph.latest_yoy_percent}% for total manufacturing.`,
        required_terms: [
          String(primaryGraph.latest_yoy_percent),
          String(manufacturingGraph.latest_yoy_percent),
        ],
      });
    }
  }

  return findings;
}

function shouldInclude(pkg: any) {
  const status = pkg.readiness_decision?.generation_status;
  const consistency = consistencyByCandidate.get(pkg.candidate_id) as any;

  if (status === "ai_draft_allowed") return true;

  if (
    status === "ai_draft_allowed_with_caution" &&
    consistency?.governance?.can_override_caution === true
  ) {
    return true;
  }

  return false;
}

const ready = workbench.packages.filter((pkg: any) => shouldInclude(pkg));

const packages = ready.map((pkg: any) => {
  const intelligencePackage = intelligenceByCandidate.get(pkg.candidate_id) as any;
  const consistency = consistencyByCandidate.get(pkg.candidate_id) as any;

  const intelligence = intelligencePackage?.intelligence ?? null;
  const candidateId = String(pkg.candidate_id ?? "").toLowerCase();

  const articleLabel =
    candidateId.includes("transport-engineering") ? "Transport Engineering" :
    candidateId.includes("petroleum-output") ? "Petroleum Output" :
    candidateId.includes("semiconductor") ? "Semiconductors" :
    candidateId.includes("precision-engineering") ? "Precision Engineering" :
    pkg.candidate_title ?? pkg.candidate?.title ?? "This sector";

  const mandatoryFindings = buildMandatoryFindings(intelligence, pkg, articleLabel);

  return {
    candidate_id: pkg.candidate_id,
    title: pkg.candidate_title,

    article_context: {
      title: pkg.candidate?.title,
      excerpt: pkg.candidate?.excerpt,

      business_implication:
        pkg.intelligence_package?.business_implication,

      why_it_matters:
        pkg.intelligence_package?.why_it_matters,

      affected_sectors:
        pkg.intelligence_package?.affected_sectors,

      confidence:
        pkg.intelligence_package?.signal,

      source_driver:
        pkg.intelligence_package?.source_driver,

      editorial_guidance:
        pkg.intelligence_package?.editorial_guidance,
    },

    article_intelligence: intelligence,

    mandatory_findings: mandatoryFindings,

    readiness_context: {
      original_generation_status:
        pkg.readiness_decision?.generation_status,
      readiness:
        pkg.readiness_decision?.readiness,
      coverage_score:
        pkg.readiness_decision?.coverage_score,
      missing_datasets:
        pkg.readiness_decision?.missing_datasets ?? [],
      consistency_status:
        consistency?.consistency_status ?? "not_checked",
      recommended_generation_status:
        consistency?.recommended_generation_status ??
        pkg.readiness_decision?.generation_status,
      override_reason:
        consistency?.governance?.override_reason ?? null,
    },

    graph_packages: pkg.graph_packages,

    sources: pkg.source_registry,

    governance: {
      publication_allowed: false,
      human_review_required: true,
      caution_status:
        pkg.readiness_decision?.generation_status ===
        "ai_draft_allowed_with_caution",
      caution_override_used:
        consistency?.governance?.can_override_caution === true,
      article_intelligence_attached: Boolean(intelligence),
      mandatory_findings_attached: mandatoryFindings.length > 0,
      consistency_audit_attached: Boolean(consistency),
    },
  };
});

const output = {
  package_version: "openai-article-package-v0.4",
  generated_at: new Date().toISOString(),
  source_files: {
    workbench_package: WORKBENCH_FILE,
    article_intelligence_package: ARTICLE_INTELLIGENCE_FILE,
    readiness_consistency_audit: CONSISTENCY_AUDIT_FILE,
  },
  package_count: packages.length,
  packages,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  package_count: packages.length,
  output: OUTPUT_FILE,
});
