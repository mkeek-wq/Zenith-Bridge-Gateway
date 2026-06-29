import fs from "fs";
import path from "path";
import readline from "readline";

const ROOT = process.cwd();
const PACKAGE_PATH = path.join(ROOT, "data/ingestion/hungry-smurf-promotion-package-v0.2.json");

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const pkg = readJson(PACKAGE_PATH);

function printSummary() {
  console.log("\n=============================================");
  console.log("        AUDIT SMURF PROMOTION REVIEW");
  console.log("=============================================\n");

  console.log(`Decision       : ${pkg.decision}`);
  console.log(`Confidence     : ${pkg.confidence_score}`);
  console.log(`Datasets       : ${pkg.staged_count}`);
  console.log(`Blockers       : ${pkg.blockers?.length ?? 0}`);
  console.log(`Approved       : ${pkg.approval?.human_approved ? "YES" : "NO"}\n`);

  console.log("Quant Summary");
  console.log("-------------");

  for (const q of pkg.quant_summary || []) {
    const z =
      q.latest_change_z_score === null || q.latest_change_z_score === undefined
        ? "-"
        : Number(q.latest_change_z_score).toFixed(2);

    console.log(
      `${q.dataset_id} | ${q.quant_status} | z=${z} | issues=${q.issues?.length ?? 0} | warnings=${q.warnings?.length ?? 0}`
    );
  }

  console.log("\nOptions");
  console.log("-------");
  console.log("[a] Approve");
  console.log("[r] Reject");
  console.log("[v] View package details");
  console.log("[q] Quit\n");
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

printSummary();

const answer = await ask("Audit Smurf > ");

if (answer === "v") {
  console.log(JSON.stringify(pkg, null, 2));
  process.exit(0);
}

if (answer === "a") {
  console.log("\nApproval selected.");
  console.log("Run next:");
  console.log("pnpm tsx src/scripts/execute-hungry-smurf-human-approval-v0.1.ts approve\n");
  process.exit(0);
}

if (answer === "r") {
  console.log("\nRejection selected.");
  console.log("Run next:");
  console.log("pnpm tsx src/scripts/execute-hungry-smurf-human-approval-v0.1.ts reject\n");
  process.exit(0);
}

console.log("\nNo action taken.");
