import fs from "fs";

const workbench = JSON.parse(
  fs.readFileSync("data/intelligence/article-workbench-package-v0.2.json", "utf8")
);

const articleIntelligence = JSON.parse(
  fs.readFileSync("data/intelligence/article-intelligence-package-v0.1.json", "utf8")
);

const intelligenceByCandidate = new Map(
  (articleIntelligence.packages ?? []).map((pkg: any) => [pkg.candidate_id, pkg])
);

const ready = workbench.packages.filter(
  (pkg: any) =>
    pkg.readiness_decision?.generation_status === "ai_draft_allowed"
);

const packages = ready.map((pkg: any) => {
  const intelligencePackage = intelligenceByCandidate.get(pkg.candidate_id);

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

    article_intelligence: intelligencePackage?.intelligence ?? null,

    graph_packages: pkg.graph_packages,

    sources: pkg.source_registry,

    governance: {
      publication_allowed: false,
      human_review_required: true,
      article_intelligence_attached: Boolean(intelligencePackage?.intelligence),
    },
  };
});

const output = {
  package_version: "openai-article-package-v0.2",
  generated_at: new Date().toISOString(),
  source_files: {
    workbench_package: "data/intelligence/article-workbench-package-v0.2.json",
    article_intelligence_package:
      "data/intelligence/article-intelligence-package-v0.1.json",
  },
  package_count: packages.length,
  packages,
};

fs.writeFileSync(
  "data/intelligence/openai-article-package-v0.2.json",
  JSON.stringify(output, null, 2)
);

console.log({
  package_version: output.package_version,
  package_count: packages.length,
  output: "data/intelligence/openai-article-package-v0.2.json",
});
