import fs from "fs";

const content = fs.readFileSync(
  "data/replay/replay-quality-summary-v0.1.json",
  "utf8"
);

console.log(content);
