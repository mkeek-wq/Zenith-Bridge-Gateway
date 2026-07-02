import fs from "fs";
import path from "path";

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing input file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const root = process.cwd();
const publication = readJson(path.join(root, "exports/article-generator/publication-package-v0.1.json"));

const title = publication.publication_identity.title;
const excerpt = publication.article.excerpt;
const snapshot = publication.smurf_snapshot ?? {};
const status = publication.publication_status ?? {};

const driver = snapshot.primary_driver ?? "selected SMURF driver";
const confidence = typeof snapshot.confidence_score === "number"
  ? `${(snapshot.confidence_score * 100).toFixed(1)}%`
  : "not specified";

const linkedInPost = `Singapore's petroleum output is not just a sector datapoint.

In the latest SMURF article package, the signal is interpreted through:

• ${driver}
• ${snapshot.historical_cases ?? "multiple"} historical cases
• ${confidence} confidence score
• recurring evidence patterns including fuel demand, jet fuel demand, refinery maintenance, and refining margins

The key point is not that one indicator moved.

The key point is what that movement may reveal about Singapore's exposure to global energy cycles, travel recovery, logistics activity, and refining conditions.

This draft remains pending verified metrics, so exact figures and quantitative charts are deliberately blocked.

That is the point of the ZNBW workflow:

Evidence first.
Interpretation second.
Publication only with governance.

#Singapore #ASEAN #Energy #Manufacturing #Trade #BusinessIntelligence #ZNBW`;

const output = {
  package_version: "linkedin-post-package-v0.1",
  generated_at: new Date().toISOString(),
  source_publication_package: publication.package_version,
  article_identity: publication.publication_identity,
  linkedin: {
    hook: "Singapore's petroleum output is not just a sector datapoint.",
    post: linkedInPost,
    suggested_hashtags: [
      "Singapore",
      "ASEAN",
      "Energy",
      "Manufacturing",
      "Trade",
      "BusinessIntelligence",
      "ZNBW",
    ],
    publish_status:
      status.exact_figures_allowed === true
        ? "ready_for_editorial_review"
        : "draft_ready_pending_verified_metrics",
    governance_note:
      "Do not add exact figures, rankings, or quantitative chart claims until verified metrics are approved.",
  },
};

const outDir = path.join(root, "exports/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "linkedin-post-package-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  title,
  publish_status: output.linkedin.publish_status,
  output: outPath,
});
