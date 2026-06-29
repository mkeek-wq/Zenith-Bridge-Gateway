import fs from "fs";

const PACKAGE_FILE = "data/intelligence/openai-article-package-v0.4.json";
const GENERATED_FILE =
  "data/intelligence/openai-generated-article-package-v0.4.json";
const OUTPUT_FILE = "data/intelligence/openai-article-audit-v0.2.json";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function auditMandatoryFindings(articleText: string, findings: any[]) {
  const normalized = normalizeText(articleText);

  return findings.map((finding) => {
    const requiredTerms = finding.required_terms ?? [];

    const matchedTerms = requiredTerms.filter((term: string) =>
      normalized.includes(String(term).toLowerCase())
    );

    return {
      finding_id: finding.finding_id,
      priority: finding.priority,
      type: finding.type,
      statement: finding.statement,
      required_terms: requiredTerms,
      matched_terms: matchedTerms,
      missing_terms: requiredTerms.filter(
        (term: string) => !matchedTerms.includes(term)
      ),
      passed: matchedTerms.length === requiredTerms.length,
    };
  });
}

const sourcePackage = readJson(PACKAGE_FILE);
const generatedPackage = readJson(GENERATED_FILE);

const audits = sourcePackage.packages.map((pkg: any) => {
  const generated =
    generatedPackage.articles?.find(
      (article: any) => article.candidate_id === pkg.candidate_id
    ) ?? null;

  const articleText = generated?.markdown ?? "";

  const mandatoryFindingAudit = auditMandatoryFindings(
    articleText,
    pkg.mandatory_findings ?? []
  );

  const missingCriticalFindings = mandatoryFindingAudit.filter(
    (item: any) => item.priority === "critical" && !item.passed
  );

  const missingAnyFindings = mandatoryFindingAudit.filter(
    (item: any) => !item.passed
  );

  return {
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    audit_version: "openai-article-audit-v0.2",
    generated_article_found: Boolean(generated),
    mandatory_findings_count: pkg.mandatory_findings?.length ?? 0,
    mandatory_findings_passed: missingAnyFindings.length === 0,
    critical_findings_passed: missingCriticalFindings.length === 0,
    publication_ready:
      Boolean(generated) &&
      missingCriticalFindings.length === 0 &&
      missingAnyFindings.length === 0,
    mandatory_finding_audit: mandatoryFindingAudit,
    missing_findings: missingAnyFindings.map((item: any) => item.finding_id),
    generated_at: new Date().toISOString(),
  };
});

const output = {
  audit_version: "openai-article-audit-v0.2",
  generated_at: new Date().toISOString(),
  package_file: PACKAGE_FILE,
  generated_file: GENERATED_FILE,
  audit_count: audits.length,
  publication_ready_count: audits.filter((audit: any) => audit.publication_ready)
    .length,
  audits,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  audit_count: output.audit_count,
  publication_ready_count: output.publication_ready_count,
  output: OUTPUT_FILE,
});
