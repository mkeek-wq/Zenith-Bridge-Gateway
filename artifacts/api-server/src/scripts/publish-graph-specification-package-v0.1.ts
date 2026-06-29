import fs from "fs";
import path from "path";

const source =
  "/opt/Zenith-Bridge-Gateway/artifacts/api-server/data/intelligence/graph-specification-package-v0.1.json";

const destination =
  "/var/www/zenith-admin/intelligence-data/graph-specification-package-v0.1.json";

if (!fs.existsSync(source)) {
  throw new Error(`Missing source: ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);

console.log(`Published graph-specification-package-v0.1.json -> ${destination}`);
