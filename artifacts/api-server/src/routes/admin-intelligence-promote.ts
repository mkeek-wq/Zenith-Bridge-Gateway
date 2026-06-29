import { Router, type Router as ExpressRouter } from "express";
import fs from "fs";
import path from "path";

const router: ExpressRouter = Router();
const ROOT = process.cwd();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

router.post("/:candidateId/promote-to-cms", async (req, res) => {
  const { candidateId } = req.params;
  const { title, markdown, candidate } = req.body || {};

  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Missing article markdown",
    });
  }

  const articleTitle =
    title ||
    candidate?.title ||
    candidate?.article_title ||
    `ZNBW Intelligence Draft ${candidateId}`;

  const slug = slugify(articleTitle);

  const safeMarkdown = markdown
    .replace(/\bSMURF\b/g, "ZNBW Intelligence Engine")
    .replace(/\bSmurf\b/g, "ZNBW Intelligence Engine")
    .replace(/\bsmurf\b/g, "ZNBW Intelligence Engine");

  const draft = {
    id: `cms_draft_${Date.now()}`,
    source: "znbw_intelligence_engine",
    candidate_id: candidateId,
    status: "draft",
    title: articleTitle,
    slug,
    markdown: safeMarkdown,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    governance: {
      publication_ready: false,
      requires_editorial_review: true,
      requires_source_review: true,
      generated_from_candidate: true,
    },
  };

  const outDir = path.join(ROOT, "data", "cms", "drafts");
  ensureDir(outDir);

  const outPath = path.join(outDir, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));

  return res.json({
    ok: true,
    message: "Candidate promoted to CMS draft",
    draft,
    output: outPath,
  });
});

export default router;
