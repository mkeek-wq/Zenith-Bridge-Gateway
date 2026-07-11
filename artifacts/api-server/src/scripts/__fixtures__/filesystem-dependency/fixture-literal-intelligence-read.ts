import fs from "fs";

const content = fs.readFileSync(
  "data/intelligence/example-input-v0.1.json",
  "utf8"
);

console.log(content);
