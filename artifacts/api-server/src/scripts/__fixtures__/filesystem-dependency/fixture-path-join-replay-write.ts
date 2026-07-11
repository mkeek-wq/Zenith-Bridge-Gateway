import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const outputPath = path.join(
  apiRoot,
  "data/replay",
  "replay-quality-summary-v0.1.json"
);

fs.writeFileSync(outputPath, "{}");
