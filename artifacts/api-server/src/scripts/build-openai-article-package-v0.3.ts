import fs from "fs";

const WORKBENCH_FILE =
  "data/intelligence/article-workbench-package-v0.2.json";

const ARTICLE_INTELLIGENCE_FILE =
  "data/intelligence/article-intelligence-package-v0.1.json";

const OUTPUT_FILE =
  "data/intelligence/openai-article-package-v0.3.json";

const workbench = JSON.parse(fs.readFileSync(WORKBENCH_FILE, "utf8"));

const articleIntelligence = JSON.parse(
  fs.readFileSync(ARTICLE_INTELLIGENCE_FILE, "utf8")
);

const intelligenceByCandidate = new Map(
  (articleIntelligence.packages ?? []).map((pkg: any) => [
    pkg.candidate_id,
    pkg,
  ])
);

function buildMandatoryFindings(articleIntelligence: any) {
  const findings: any[] = [];

  const rp = articleIntelligence?.relative_performance;

  if (rp) {
    findings.push({
      finding_id: "MF001",
      priority: "critical",
      type: "relative_performance",
      statement: `Precision Engineering grew ${rp.sector_growth_10y_percent}% over 10 years versus ${rp.manufacturing_growth_10y_percent}% for total manufacturing, an outperformance of ${rp.outperformance_pp} percentage points.`,
      required_terms: [
        String(rp.sector_growth_10y_percent),
        String(rp.manufacturing_growth_10y_percent),
        String(rp.outperformance_pp),
      ],
    });
  }

  const ranking = articleIntelligence?.sector_ranking;

  if (ranking) {
    findings.push({
  finding_id: "MF002",
  priority: "critical",
  type: "sector_ranking",
  statement: `Precision Engineering ranked #${ranking.rank_10y_growth} out of ${ranking.sector_count} major manufacturing sectors by 10-year growth. The article must explicitly state rank #${ranking.rank_10y_growth} out of ${ranking.sector_count}.`,
  required_terms: [
    `#${ranking.rank_10y_growth}`,
    `out of ${ranking.sector_count}`,
   ],
   });
  }

  const share = articleIntelligence?.manufacturing_share;

  if (share) {
    findings.push({
      finding_id: "MF003",
      priority: "important",
      type: "manufacturing_share",
      statement: `Precision Engineering's manufacturing share increased from ${share.share_start_percent}% in ${share.start_period} to ${share.share_end_percent}% in ${share.end_period}, a gain of ${share.change_pp} percentage points.`,
      required_terms: [
        String(share.share_start_percent),
        String(share.share_end_percent),
        String(share.change_pp),
      ],
    });
  }

  const momentum = articleIntelligence?.latest_momentum;

  if (momentum) {
    findings.push({
      finding_id: "MF004",
      priority: "important",
      type: "latest_momentum",
      statement: `In ${momentum.latest_period}, Precision Engineering output reached ${momentum.latest_value}, with latest year-on-year growth of ${momentum.latest_yoy_percent}%.`,
      required_terms: [
        String(momentum.latest_period),
        String(momentum.latest_value),
        String(momentum.latest_yoy_percent),
      ],
    });
  }

  const proxy = articleIntelligence?.proxy_disclosure;

  if (proxy?.required) {
    findings.push({
      finding_id: "MF005",
      priority: "critical",
      type: "proxy_disclosure",
      statement: `${proxy.direct_series_used} is used as a proxy for capital-equipment-linked precision engineering activity because deeper precision-engineering subsegments are not exposed in the current table.`,
      required_terms: [
        String(proxy.direct_series_used),
        "proxy",
      ],
    });
  }

  return findings;
}

const ready = workbench.packages.filter(
  (pkg: any) =>
    pkg.readiness_decision?.generation_status === "ai_draft_allowed"
);

const packages = ready.map((pkg: any) => {
  const intelligencePackage = intelligenceByCandidate.get(pkg.candidate_id);
  const intelligence = intelligencePackage?.intelligence ?? null;

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

    mandatory_findings: buildMandatoryFindings(intelligence),

    graph_packages: pkg.graph_packages,

    sources: pkg.source_registry,

    governance: {
      publication_allowed: false,
      human_review_required: true,
      article_intelligence_attached: Boolean(intelligence),
      mandatory_findings_attached: Boolean(
        buildMandatoryFindings(intelligence).length
      ),
    },
  };
});

const output = {
  package_version: "openai-article-package-v0.3",
  generated_at: new Date().toISOString(),
  source_files: {
    workbench_package: WORKBENCH_FILE,
    article_intelligence_package: ARTICLE_INTELLIGENCE_FILE,
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
