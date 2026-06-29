import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const files = [
  "data-request-queue-v0.1.json",
  "verified-dataset-registry-v0.1.json",
  "dataset-coverage-engine-v0.1.json",
];

const sourceDir = path.join(ROOT, "data", "intelligence");
const targetDir = "/var/www/zenith-admin/intelligence-data";

for (const file of files) {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);

  if (!fs.existsSync(source)) {
    console.warn(`Missing source file, skipped: ${source}`);
    continue;
  }

  fs.copyFileSync(source, target);
  console.log(`Published ${file} → ${target}`);
}
