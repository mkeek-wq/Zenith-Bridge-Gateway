import fs from "fs";

const SOURCE_PACKAGE_FILE =
  "data/intelligence/openai-article-package-v0.4.json";

const GENERATED_ARTICLE_FILE =
  "data/intelligence/openai-generated-article-package-v0.4.json";

const OUTPUT_FILE =
  "data/intelligence/mandatory-findings-audit-v0.1.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function termFound(markdown: string, term: string) {
  const text = normalizeText(markdown);
  const normalizedTerm = normalizeText(term);

  if (text.includes(normalizedTerm)) return true;

  // Allow simple numeric formatting variations:
  // 220845.7 may appear as 220,845.7
  const numericTerm = normalizedTerm.replace(/,/g, "");
  const numericText = text.replace(/,/g, "");

  return numericText.includes(numericTerm);
}

const sourcePackage = readJson(SOURCE_PACKAGE_FILE);
const generatedPackage = readJson(GENERATED_ARTICLE_FILE);

const articlesByCandidate = new Map(
  (generatedPackage.articles ?? []).map((article: any) => [
    article.candidate_id,
    article,
  ])
);

const audits = (sourcePackage.packages ?? []).map((pkg: any) => {
  const article = articlesByCandidate.get(pkg.candidate_id) as any;
  const markdown = article?.markdown ?? "";

  const findingAudits = (pkg.mandatory_findings ?? []).map((finding: any) => {
    const requiredTerms = finding.required_terms ?? [];

    const termResults = requiredTerms.map((term: string) => ({
      term,
      found: termFound(markdown, term),
    }));

    const passed = termResults.every((item: any) => item.found);

    return {
      finding_id: finding.finding_id,
      priority: finding.priority,
      type: finding.type,
      statement: finding.statement,
      passed,
      required_terms: termResults,
    };
  });

  const criticalFindings = findingAudits.filter(
    (finding: any) => finding.priority === "critical"
  );

  const mandatoryFindingsPassed =
    findingAudits.length > 0 &&
    findingAudits.every((finding: any) => finding.passed);

  const criticalFindingsPassed =
    criticalFindings.length > 0 &&
    criticalFindings.every((finding: any) => finding.passed);

  const missingFindings = findingAudits
    .filter((finding: any) => !finding.passed)
    .map((finding: any) => finding.finding_id);

  return {
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    generated_article_found: Boolean(article),
    source_package_version: sourcePackage.package_version,
    generated_package_version: generatedPackage.package_version,
    mandatory_finding_count: findingAudits.length,
    mandatory_findings_passed: mandatoryFindingsPassed,
    critical_findings_passed: criticalFindingsPassed,
    missing_findings: missingFindings,
    finding_audit: findingAudits,
    governance: {
      human_review_required: true,
      publication_blocked:
        !article || !mandatoryFindingsPassed || !criticalFindingsPassed,
      blocker_reason:
        !article
          ? "generated_article_missing"
          : !criticalFindingsPassed
            ? "critical_mandatory_findings_missing"
            : !mandatoryFindingsPassed
              ? "mandatory_findings_missing"
              : null,
    },
  };
});

const output = {
  audit_version: "mandatory-findings-audit-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    source_article_package: SOURCE_PACKAGE_FILE,
    generated_article_package: GENERATED_ARTICLE_FILE,
  },
  audit_count: audits.length,
  passed_count: audits.filter(
    (audit: any) =>
      audit.generated_article_found &&
      audit.mandatory_findings_passed &&
      audit.critical_findings_passed
  ).length,
  blocked_count: audits.filter(
    (audit: any) => audit.governance.publication_blocked
  ).length,
  audits,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  audit_count: output.audit_count,
  passed_count: output.passed_count,
  blocked_count: output.blocked_count,
  output: OUTPUT_FILE,
});
