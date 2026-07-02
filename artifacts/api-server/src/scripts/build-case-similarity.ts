import { readFile, writeFile } from "node:fs/promises";

const INPUT = "data/intelligence/case-fingerprints-v0.1.json";
const OUTPUT = "data/intelligence/case-similarity-v0.1.json";

type Fingerprint = {
  case_id: string;
  sector: string;
  priority: string;
  confidence: string;
  evidence_quality: string;
  yoy_band: string;
  mom_band: string;
};

const MAX_SCORE = 110;

function compare(a: Fingerprint, b: Fingerprint) {
  let score = 0;
  const reasons: string[] = [];

  if (a.case_id === b.case_id) {
    return null;
  }

  if (a.sector === b.sector) {
    score += 35;
    reasons.push("same_sector");
  }

  if (a.yoy_band === b.yoy_band) {
    score += 25;
    reasons.push("same_yoy_band");
  }

  if (a.mom_band === b.mom_band) {
    score += 15;
    reasons.push("same_mom_band");
  }

  if (a.priority === b.priority) {
    score += 15;
    reasons.push("same_priority");
  }

  if (a.evidence_quality === b.evidence_quality) {
    score += 10;
    reasons.push("same_evidence_quality");
  }

  if (a.confidence === b.confidence) {
    score += 10;
    reasons.push("same_confidence");
  }

  return {
    case_id: b.case_id,
    similarity_score: score,
    similarity_percent: Number(((score / MAX_SCORE) * 100).toFixed(2)),
    reasons,
  };
}

async function main() {
  const input = JSON.parse(await readFile(INPUT, "utf8"));
  const fingerprints: Fingerprint[] = input.fingerprints ?? [];

  const similarities = fingerprints.map((source) => {
    const matches = fingerprints
      .map((candidate) => compare(source, candidate))
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          b.similarity_score - a.similarity_score ||
          a.case_id.localeCompare(b.case_id),
      );

    return {
      case_id: source.case_id,
      fingerprint: source,
      similar_cases: matches,
    };
  });

  const output = {
    similarity_version: "case-similarity-v0.1",
    generated_at: new Date().toISOString(),
    source_file: INPUT,
    scoring_model: {
      max_score: MAX_SCORE,
      weights: {
        same_sector: 35,
        same_yoy_band: 25,
        same_mom_band: 15,
        same_priority: 15,
        same_evidence_quality: 10,
        same_confidence: 10,
      },
    },
    cases_compared: fingerprints.length,
    similarities,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2), "utf8");

  console.log({
    similarity_version: "case-similarity-v0.1",
    cases_compared: fingerprints.length,
    output: OUTPUT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
