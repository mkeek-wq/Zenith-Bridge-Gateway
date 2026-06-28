import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const registry = readJson("data/replay/cases/replay-historical-case-registry-v0.1.json");
const schema = readJson("data/replay/depth/replay-depth-schema-v0.1.json");
const taxonomy = readJson("data/replay/taxonomy/replay-mechanism-taxonomy-v0.1.json");

const requiredDepthFields: string[] = schema.required_depth_fields ?? [];

const validMechanisms = new Set<string>();
for (const family of taxonomy.families ?? []) {
  for (const mechanism of family.mechanisms ?? []) {
    validMechanisms.add(mechanism);
  }
}

function hasValue(value: any): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function auditCase(caseItem: any) {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!caseItem.case_id) blockers.push("Missing case_id.");
  if (!caseItem.title) blockers.push("Missing title.");
  if (!caseItem.region) warnings.push("Missing region.");
  if (!caseItem.sector) warnings.push("Missing sector.");
  if (!caseItem.period) warnings.push("Missing period.");

  const mechanisms = caseItem.mechanisms ?? [];

  if (!Array.isArray(mechanisms) || mechanisms.length === 0) {
    blockers.push("No mechanisms provided.");
  }

  for (const mechanism of mechanisms) {
    if (!validMechanisms.has(mechanism)) {
      warnings.push(`Mechanism not found in taxonomy: ${mechanism}`);
    }
  }

  const missingDepthFields = requiredDepthFields.filter(
    (field) => !hasValue(caseItem[field])
  );

  if (missingDepthFields.length === requiredDepthFields.length) {
    warnings.push("Case has no depth fields populated.");
  } else if (missingDepthFields.length > 0) {
    warnings.push(`Missing depth fields: ${missingDepthFields.join(", ")}`);
  }

  if (caseItem.confidence !== undefined) {
    if (
      typeof caseItem.confidence !== "number" ||
      caseItem.confidence < 0 ||
      caseItem.confidence > 1
    ) {
      blockers.push("Confidence must be a number between 0 and 1.");
    }
  }

  if (caseItem.duration_months !== undefined) {
    if (
      typeof caseItem.duration_months !== "number" ||
      caseItem.duration_months < 0
    ) {
      blockers.push("duration_months must be a non-negative number.");
    }
  }

  const sourceCount = Array.isArray(caseItem.sources)
    ? caseItem.sources.length
    : 0;

  if (sourceCount === 0) {
    warnings.push("No sources attached.");
  }

  const auditScore = Math.max(
    0,
    1 -
      blockers.length * 0.25 -
      warnings.length * 0.05 -
      missingDepthFields.length * 0.03
  );

  const auditStatus =
    blockers.length > 0
      ? "BLOCKED"
      : warnings.length > 0
        ? "PASS_WITH_WARNINGS"
        : "PASS";

  return {
    case_id: caseItem.case_id,
    title: caseItem.title,
    audit_status: auditStatus,
    audit_score: Number(auditScore.toFixed(3)),
    blocker_count: blockers.length,
    warning_count: warnings.length,
    missing_depth_field_count: missingDepthFields.length,
    blockers,
    warnings,
    approved_for_registry: auditStatus === "PASS",
    requires_human_review: auditStatus !== "PASS"
  };
}

const audits = (registry.cases ?? []).map(auditCase);

const output = {
  version: "replay-case-audit-v0.1",
  generated_at: new Date().toISOString(),
  case_count: audits.length,
  pass_count: audits.filter((a: any) => a.audit_status === "PASS").length,
  pass_with_warnings_count: audits.filter((a: any) => a.audit_status === "PASS_WITH_WARNINGS").length,
  blocked_count: audits.filter((a: any) => a.audit_status === "BLOCKED").length,
  average_audit_score: Number(
    (
      audits.reduce((sum: number, item: any) => sum + item.audit_score, 0) /
      Math.max(audits.length, 1)
    ).toFixed(3)
  ),
  audits
};

const outputPath = path.join(apiRoot, "data/replay/audit/replay-case-audit-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  audit: output.version,
  case_count: output.case_count,
  pass: output.pass_count,
  warnings: output.pass_with_warnings_count,
  blocked: output.blocked_count,
  average_audit_score: output.average_audit_score,
  output: outputPath
});
