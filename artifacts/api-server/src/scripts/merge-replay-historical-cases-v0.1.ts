import fs from "fs";
import path from "path";

const apiRoot = process.cwd();

const registryPath =
  "data/replay/cases/replay-historical-case-registry-v0.1.json";

const waveDir =
  "data/replay/cases/waves";

const registry = JSON.parse(
  fs.readFileSync(registryPath, "utf8")
);

const files = fs
  .readdirSync(waveDir)
  .filter((f) => f.endsWith(".json"));

const existing = new Set(
  registry.cases.map((c: any) => c.case_id)
);

for (const file of files) {
  const wave = JSON.parse(
    fs.readFileSync(path.join(waveDir, file), "utf8")
  );

  for (const c of wave.cases ?? []) {
    if (existing.has(c.case_id)) continue;

    registry.cases.push(c);
    existing.add(c.case_id);
  }
}

fs.writeFileSync(
  registryPath,
  JSON.stringify(registry, null, 2)
);

console.log({
  registry: registry.version,
  case_count: registry.cases.length
});
