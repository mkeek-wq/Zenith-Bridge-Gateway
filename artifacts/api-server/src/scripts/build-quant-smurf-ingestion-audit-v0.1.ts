import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function stddev(xs: number[]) {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  const variance = xs.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

const staging = readJson(path.join(ROOT, "data/ingestion/hungry-smurf-controlled-staging-v0.1.json"));

const audits = (staging.staged_items || []).map((item: any) => {
  const parsed = readJson(path.join(ROOT, "data/intelligence/parsed-datasets", `${item.dataset_id}.json`));
  const values = parsed.values || [];
  const nums = values.map((v: any) => Number(v.value)).filter((v: number) => !Number.isNaN(v));

  const changes = nums.slice(1).map((v: number, i: number) => v - nums[i]);
  const pctChanges = nums.slice(1).map((v: number, i: number) => nums[i] === 0 ? null : ((v - nums[i]) / nums[i]) * 100).filter((v: number | null) => v !== null) as number[];

  const changeMean = mean(changes);
  const changeStd = stddev(changes);

  const latestChange = changes.length ? changes[changes.length - 1] : null;
  const latestZ =
    latestChange !== null && changeMean !== null && changeStd && changeStd !== 0
      ? (latestChange - changeMean) / changeStd
      : null;

  const issues: string[] = [];
  const warnings: string[] = [];

  if (nums.length === 0) issues.push("no_numeric_values");
  if (nums.length !== values.length) warnings.push("some_values_not_numeric");
  if (latestZ !== null && Math.abs(latestZ) >= 3) issues.push("latest_change_above_3_sigma");
  else if (latestZ !== null && Math.abs(latestZ) >= 2) warnings.push("latest_change_above_2_sigma");

  return {
    dataset_id: item.dataset_id,
    values_count: values.length,
    numeric_values_count: nums.length,
    min: nums.length ? Math.min(...nums) : null,
    max: nums.length ? Math.max(...nums) : null,
    mean: mean(nums),
    stddev: stddev(nums),
    change_mean: changeMean,
    change_stddev: changeStd,
    latest_change: latestChange,
    latest_change_z_score: latestZ,
    largest_abs_change: changes.length ? Math.max(...changes.map(Math.abs)) : null,
    largest_pct_change: pctChanges.length ? Math.max(...pctChanges.map(Math.abs)) : null,
    issue_count: issues.length,
    warning_count: warnings.length,
    issues,
    warnings,
    quant_status: issues.length > 0 ? "blocked" : warnings.length > 0 ? "review" : "clean"
  };
});

const output = {
  audit_version: "quant-smurf-ingestion-audit-v0.1",
  generated_at: new Date().toISOString(),
  mutation_allowed: false,
  dataset_count: audits.length,
  clean_count: audits.filter((a: any) => a.quant_status === "clean").length,
  review_count: audits.filter((a: any) => a.quant_status === "review").length,
  blocked_count: audits.filter((a: any) => a.quant_status === "blocked").length,
  audits,
  governance: {
    mutation_allowed: false,
    promotion_allowed: audits.every((a: any) => a.quant_status !== "blocked"),
    human_review_required: audits.some((a: any) => a.quant_status !== "clean")
  }
};

const outPath = path.join(ROOT, "data/intelligence/quant-smurf-ingestion-audit-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  clean_count: output.clean_count,
  review_count: output.review_count,
  blocked_count: output.blocked_count,
  output: path.relative(ROOT, outPath)
});

for (const a of audits) {
  console.log(`${a.dataset_id} | ${a.quant_status} | z=${a.latest_change_z_score ?? "-"} | issues=${a.issues.join(",") || "-"} | warnings=${a.warnings.join(",") || "-"}`);
}
