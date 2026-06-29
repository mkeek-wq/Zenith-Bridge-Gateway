import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function decision(row: any) {
  if (row.readiness === "strong_data_coverage") {
    return {
      generation_allowed: true,
      status: "ai_draft_allowed",
      reason: "Strong verified data coverage is available.",
    };
  }

  if (row.readiness === "partial_data_coverage") {
    return {
      generation_allowed: true,
      status: "ai_draft_allowed_with_caution",
      reason: "Partial verified data coverage is available. Article should include data limitations.",
    };
  }

  if (row.readiness === "thin_data_coverage") {
    return {
      generation_allowed: false,
      status: "blocked_until_more_data",
      reason: "Only thin verified data coverage is available. Add required datasets before AI drafting.",
    };
  }

  return {
    generation_allowed: false,
    status: "blocked_no_verified_data",
    reason: "No verified data is available.",
  };
}

const coveragePath = path.join(
  ROOT,
  "data",
  "intelligence",
  "dataset-coverage-engine-v0.1.json"
);

const coverage = readJson(coveragePath).coverage || [];

const decisions = coverage.map((row: any) => {
  const d = decision(row);

  return {
    candidate_id: row.candidate_id,
    candidate_title: row.candidate_title,
    coverage_score: row.coverage_score,
    readiness: row.readiness,
    required_dataset_count: row.required_dataset_count,
    verified_dataset_count: row.verified_dataset_count,
    missing_dataset_count: row.missing_dataset_count,
    graph_readiness: row.graph_readiness,
    generation_allowed: d.generation_allowed,
    generation_status: d.status,
    decision_reason: d.reason,
    missing_datasets: (row.datasets || [])
      .filter((dataset: any) => !dataset.available_for_graphs)
      .map((dataset: any) => ({
        dataset_id: dataset.dataset_id,
        name: dataset.name,
        importance: dataset.importance,
        verification_status: dataset.verification_status,
      })),
    generated_at: new Date().toISOString(),
  };
});

const output = {
  gate_version: "article-data-readiness-gate-v0.1",
  generated_at: new Date().toISOString(),
  purpose: "Blocks or allows AI draft generation based on verified data coverage.",
  candidate_count: decisions.length,
  allowed: decisions.filter((d: any) => d.generation_allowed).length,
  blocked: decisions.filter((d: any) => !d.generation_allowed).length,
  decisions,
};

const outDir = path.join(ROOT, "data", "intelligence");
ensureDir(outDir);

const outPath = path.join(outDir, "article-data-readiness-gate-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  gate_version: output.gate_version,
  candidate_count: output.candidate_count,
  allowed: output.allowed,
  blocked: output.blocked,
  output: outPath,
});

for (const d of decisions) {
  console.log(`${d.candidate_id} | ${d.generation_status} | ${d.verified_dataset_count}/${d.required_dataset_count}`);
}
