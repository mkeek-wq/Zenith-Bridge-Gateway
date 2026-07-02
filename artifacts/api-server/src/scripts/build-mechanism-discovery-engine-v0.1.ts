import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

const evidenceAssessment =
  readJsonSafe(path.join(ROOT, "data/intelligence/evidence-assessment-engine-v0.2.json")) || {};

const linker =
  readJsonSafe(path.join(ROOT, "data/intelligence/mechanism-evidence-linker-v0.1.json")) || {};

const assessedEvidence: any[] = evidenceAssessment.assessed_evidence || [];
const existingLinks: any[] = linker.links || [];

const linkedEvidenceIds = new Set(existingLinks.map((l) => l.evidence_id));

const strongOrUsefulUnlinked = assessedEvidence.filter(
  (e) =>
    ["strong_evidence", "useful_evidence"].includes(String(e.assessment?.status)) &&
    !linkedEvidenceIds.has(e.evidence_id)
);

const candidateThemes = [
  {
    theme_id: "DISC_THEME_001",
    suggested_mechanism_name: "Household Balance Sheet Transmission",
    terms: ["household", "saving", "net worth", "income", "consumption"],
    mechanism_statement:
      "Household balance sheet changes may transmit into demand conditions through income, savings, wealth, and consumption channels.",
  },
  {
    theme_id: "DISC_THEME_002",
    suggested_mechanism_name: "Services Receipts Momentum",
    terms: ["services", "business receipts", "receipts", "accommodation", "finance", "real estate"],
    mechanism_statement:
      "Services-sector receipts may act as an early signal for domestic demand, tourism-linked activity, or business services momentum.",
  },
  {
    theme_id: "DISC_THEME_003",
    suggested_mechanism_name: "Investment Flow Reallocation",
    terms: ["direct investment abroad", "fdi", "investment", "capital", "flows"],
    mechanism_statement:
      "Investment flow changes may reflect capital reallocation, regional expansion, or changing corporate confidence.",
  },
];

const discoveryCandidates = candidateThemes.map((theme, index) => {
  const matches = strongOrUsefulUnlinked.filter((e) => {
    const text = `${e.metric_name || ""} ${e.evidence_window || ""}`.toLowerCase();
    return theme.terms.some((term) => text.includes(term));
  });

  const avgEvidenceScore =
    matches.length > 0
      ? matches.reduce((sum, e) => sum + Number(e.scores?.evidence_score ?? 0), 0) / matches.length
      : 0;

  const discoveryScore = clamp(
    avgEvidenceScore * 0.55 +
      clamp(matches.length / 20) * 0.35 +
      (matches.some((e) => e.assessment?.status === "strong_evidence") ? 0.1 : 0)
  );

  return {
    discovery_id: `MDISC_${String(index + 1).padStart(3, "0")}`,
    theme_id: theme.theme_id,
    suggested_mechanism_name: theme.suggested_mechanism_name,
    suggested_mechanism_statement: theme.mechanism_statement,
    discovery_status:
      discoveryScore >= 0.65
        ? "candidate_discovery"
        : discoveryScore >= 0.45
          ? "watch_theme"
          : "insufficient_signal",
    discovery_score: Number(discoveryScore.toFixed(3)),
    evidence_items_matched: matches.length,
    average_evidence_score: Number(avgEvidenceScore.toFixed(3)),
    top_supporting_evidence: matches
      .slice()
      .sort((a, b) => Number(b.scores?.evidence_score ?? 0) - Number(a.scores?.evidence_score ?? 0))
      .slice(0, 8)
      .map((e) => ({
        evidence_id: e.evidence_id,
        metric_name: e.metric_name,
        period: e.period,
        direction: e.direction,
        evidence_score: e.scores?.evidence_score,
        status: e.assessment?.status,
      })),
    governance: {
      discovery_is_not_validation: true,
      discovery_is_not_lifecycle_creation: true,
      human_review_required_to_create_mechanism_candidate: true,
      evidence_remains_primary: true,
    },
  };
});

const output = {
  registry_version: "mechanism-discovery-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    discovery_is_suggestion_not_truth: true,
    discovery_does_not_create_validated_mechanism: true,
    human_review_required_to_seed_new_mechanisms: true,
    evidence_remains_primary: true,
  },
  inputs: {
    assessed_evidence_items: assessedEvidence.length,
    existing_mechanism_links: existingLinks.length,
    strong_or_useful_unlinked_evidence: strongOrUsefulUnlinked.length,
  },
  summary: {
    discovery_candidates: discoveryCandidates.length,
    candidate_discoveries: discoveryCandidates.filter((x) => x.discovery_status === "candidate_discovery").length,
    watch_themes: discoveryCandidates.filter((x) => x.discovery_status === "watch_theme").length,
    insufficient_signal: discoveryCandidates.filter((x) => x.discovery_status === "insufficient_signal").length,
  },
  discovery_candidates: discoveryCandidates,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-discovery-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-discovery-engine-v0.1.json",
});

console.table(
  discoveryCandidates.map((x) => ({
    discovery_id: x.discovery_id,
    suggested: x.suggested_mechanism_name,
    matched: x.evidence_items_matched,
    score: x.discovery_score,
    status: x.discovery_status,
  }))
);
