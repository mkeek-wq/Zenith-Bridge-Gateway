import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SCRIPT_DIR = path.join(ROOT, "src/scripts");
const OUTPUT_PATH = path.join(ROOT, "data/intelligence/sysadmin-troll-bridge-audit-v0.1.json");

const allowedExternalAccessScripts = new Set([
  "download-source-dataset-v0.1.ts",
  "discover-singstat-table-rows-v0.1.ts",
  "load-singstat-table-v0.1.ts",
  "search-singstat-tables-v0.1.ts",
  "archive-documents.ts",
  "run-monitoring-check.ts",
]);

const ignoredAuditScripts = new Set([
  "build-sysadmin-troll-bridge-audit-v0.1.ts",
]);

const externalAccessPatterns = [
  "fetch(",
  "request(",
  "https.request",
  "http.request",
  "axios.",
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) return walk(full);
    if (entry.endsWith(".ts")) return [full];
    return [];
  });
}

const findings = walk(SCRIPT_DIR).flatMap((filePath) => {
  const rel = path.relative(ROOT, filePath);
  const fileName = path.basename(filePath);

  if (ignoredAuditScripts.has(fileName)) {
    return [];
  }

  const text = fs.readFileSync(filePath, "utf8");

  return externalAccessPatterns
    .filter((pattern) => text.includes(pattern))
    .map((pattern) => {
      const allowed = allowedExternalAccessScripts.has(fileName);

      return {
        file: rel,
        pattern,
        allowed,
        severity: allowed ? "info" : "violation",
        rule:
          "Only Hungry/Ingestion Smurf scripts may acquire external data. No back-door external data access is allowed inside the village.",
      };
    });
});

const violations = findings.filter((f) => !f.allowed);

const output = {
  audit_version: "sysadmin-troll-bridge-audit-v0.1",
  generated_at: new Date().toISOString(),
  purpose:
    "Enforces Village Rule #1: external data may only enter through approved ingestion scripts.",
  troll_mood: violations.length > 0 ? "angry" : "calm",
  finding_count: findings.length,
  violation_count: violations.length,
  approved_external_access_scripts: Array.from(allowedExternalAccessScripts),
  findings,
  governance: {
    village_rule_1:
      "No Smurf other than an approved ingestion Smurf may acquire external data.",
    backdoor_data_access_allowed: false,
    human_review_required: violations.length > 0,
  },
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log({
  audit_version: output.audit_version,
  troll_mood: output.troll_mood,
  finding_count: output.finding_count,
  violation_count: output.violation_count,
  output: path.relative(ROOT, OUTPUT_PATH),
});

for (const finding of findings) {
  console.log(
    `${finding.allowed ? "OK" : "VIOLATION"} | ${finding.file} | ${finding.pattern}`
  );
}
