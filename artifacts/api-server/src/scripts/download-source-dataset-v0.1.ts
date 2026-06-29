import fs from "fs";
import path from "path";
import { request } from "https";

const ROOT = process.cwd();
const datasetId = process.argv[2];

if (!datasetId) {
  console.error("Usage: pnpm tsx src/scripts/download-source-dataset-v0.1.ts <DATASET_ID>");
  process.exit(1);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url: string, target: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(target);

    const req = request(url, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        file.close();
        fs.unlinkSync(target);
        download(res.headers.location, target).then(resolve).catch(reject);
        return;
      }

      if (!res.statusCode || res.statusCode >= 400) {
        file.close();
        fs.unlinkSync(target);
        reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        return;
      }

      res.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(target)) fs.unlinkSync(target);
      reject(err);
    });

    req.end();
  });
}

const configPath = path.join(
  ROOT,
  "data",
  "intelligence",
  "source-download-config",
  `${datasetId}.json`
);

if (!fs.existsSync(configPath)) {
  throw new Error(`Missing config: ${configPath}`);
}

const config = readJson(configPath);

if (!config.source_url) {
  console.log({
    status: "manual_required",
    dataset_id: datasetId,
    reason: "No source_url configured. Place CSV manually in data/intelligence/raw-downloads/",
    expected_file: `data/intelligence/raw-downloads/${datasetId}.csv`,
  });
  process.exit(0);
}

const rawDir = path.join(ROOT, "data", "intelligence", "raw-downloads");
ensureDir(rawDir);

const target = path.join(rawDir, `${datasetId}.${config.file_type || "csv"}`);

await download(config.source_url, target);

console.log({
  status: "downloaded",
  dataset_id: datasetId,
  source_url: config.source_url,
  output: target,
});
