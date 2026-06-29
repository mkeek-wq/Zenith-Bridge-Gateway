import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const checks = [
  {
    smurf: "Hungry",
    role: "Update scan",
    file: "data/intelligence/hungry-smurf-update-scan-v0.1.json",
    status: (x: any) => x?.blocked_count === 0 ? "healthy" : "blocked",
    detail: (x: any) =>
      `ready=${x?.ready_count ?? 0}, review=${x?.review_count ?? 0}, blocked=${x?.blocked_count ?? 0}`,
  },
  {
    smurf: "Nose",
    role: "Schema sniff",
    file: "data/intelligence/hungry-smurf-schema-sniff-v0.1.json",
    status: (x: any) => x?.blocked_count === 0 ? "healthy" : "blocked",
    detail: (x: any) =>
      `clean=${x?.clean_count ?? 0}, review=${x?.review_count ?? 0}, blocked=${x?.blocked_count ?? 0}`,
  },
  {
    smurf: "Governance",
    role: "Pre-ingestion gate",
    file: "data/intelligence/hungry-smurf-pre-ingestion-gate-v0.1.json",
    status: (x: any) => x?.blockers?.length === 0 ? "healthy" : "blocked",
    detail: (x: any) =>
      `decision=${x?.decision ?? "missing"}, warnings=${x?.warnings?.length ?? 0}`,
  },
  {
    smurf: "Staging",
    role: "Controlled staging",
    file: "data/ingestion/hungry-smurf-controlled-staging-v0.1.json",
    status: (x: any) => x?.staged_count > 0 ? "healthy" : "review",
    detail: (x: any) => `staged=${x?.staged_count ?? 0}`,
  },
];

const smurfs = checks.map((check) => {
  const fullPath = path.join(ROOT, check.file);
  const data = readJsonSafe(fullPath);

  return {
    smurf: check.smurf,
    role: check.role,
    file: check.file,
    present: !!data,
    health: data ? check.status(data) : "missing",
    detail: data ? check.detail(data) : "file_missing",
  };
});

const output = {
  report_version: "smurf-village-health-v0.1",
  generated_at: new Date().toISOString(),
  smurf_count: smurfs.length,
  healthy_count: smurfs.filter((s) => s.health === "healthy").length,
  review_count: smurfs.filter((s) => s.health === "review").length,
  blocked_count: smurfs.filter((s) => s.health === "blocked").length,
  missing_count: smurfs.filter((s) => s.health === "missing").length,
  smurfs,
};

const outPath = path.join(
  ROOT,
  "data/intelligence/smurf-village-health-v0.1.json"
);

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  report_version: output.report_version,
  healthy_count: output.healthy_count,
  review_count: output.review_count,
  blocked_count: output.blocked_count,
  missing_count: output.missing_count,
  output: path.relative(ROOT, outPath),
});

for (const smurf of smurfs) {
  console.log(`${smurf.smurf} | ${smurf.health} | ${smurf.detail}`);
}
