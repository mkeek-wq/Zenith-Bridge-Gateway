import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(apiRoot, relativePath), "utf8"));
}

const registry = readJson("data/replay/cases/replay-historical-case-registry-v0.1.json");
const schema = readJson("data/replay/depth/replay-depth-schema-v0.1.json");

const requiredFields: string[] = schema.required_depth_fields ?? [];
const weights: Record<string, number> = schema.depth_score_weights ?? {};

function hasDepthValue(caseItem: any, field: string): boolean {
  const value = caseItem[field];

  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;

  return false;
}

const cases = (registry.cases ?? []).map((caseItem: any) => {
  const missing_fields = requiredFields.filter(
    (field) => !hasDepthValue(caseItem, field)
  );

  const depth_score = requiredFields.reduce((sum, field) => {
    return sum + (hasDepthValue(caseItem, field) ? (weights[field] ?? 0) : 0);
  }, 0);

  return {
    case_id: caseItem.case_id,
    title: caseItem.title,
    region: caseItem.region,
    sector: caseItem.sector,
    mechanism_count: (caseItem.mechanisms ?? []).length,
    depth_score: Number(depth_score.toFixed(3)),
    missing_field_count: missing_fields.length,
    missing_fields
  };
});

const output = {
  version: "replay-case-depth-audit-v0.1",
  generated_at: new Date().toISOString(),
  case_count: cases.length,
  average_depth_score: Number(
    (
      cases.reduce((sum: number, item: any) => sum + item.depth_score, 0) /
      Math.max(cases.length, 1)
    ).toFixed(3)
  ),
  cases: cases.sort((a: any, b: any) => a.depth_score - b.depth_score)
};

const outputPath = path.join(apiRoot, "data/replay/depth/replay-case-depth-audit-v0.1.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log({
  depth_audit: output.version,
  case_count: output.case_count,
  average_depth_score: output.average_depth_score,
  output: outputPath
});
