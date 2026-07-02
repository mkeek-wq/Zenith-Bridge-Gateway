import fs from "fs";
import path from "path";

const source =
  "/opt/Zenith-Bridge-Gateway/artifacts/api-server/data/intelligence/article-workbench-package-v0.2.json";

const destination =
  "/var/www/zenith-admin/intelligence-data/article-workbench-package-v0.2.json";

if (!fs.existsSync(source)) {
  throw new Error(`Missing source: ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });

fs.copyFileSync(source, destination);

console.log(
  `Published article-workbench-package-v0.2.json -> ${destination}`
);
