import { Router, type Request, type Response } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/requireAuth.js";

const router: Router = Router();

// TEMP in-memory store (safe fallback only)
type Article = {
  id: number;
  title: string;
  slug?: string;
  content?: unknown;
  html?: string;
  status: string;
  createdAt: Date;
};

let articles: Article[] = [];
let idCounter = 1;

/**
 * CREATE
 */
router.post("/", requireAuth, (req: AuthRequest, res: Response) => {
  const { title, slug, content, html, status } = req.body;

  const article: Article = {
    id: idCounter++,
    title,
    slug,
    content,
    html,
    status: status || "draft",
    createdAt: new Date(),
  };

  articles.push(article);

  res.json(article);
});

/**
 * LIST
 */
router.get("/", requireAuth, (_req: AuthRequest, res: Response) => {
  res.json(articles);
});

/**
 * GET ONE
 */
router.get("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const article = articles.find(a => a.id === id);

  if (!article) return res.status(404).json({ error: "not_found" });

  res.json(article);
});

/**
 * UPDATE
 */
router.patch("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const idx = articles.findIndex(a => a.id === id);

  if (idx === -1) return res.status(404).json({ error: "not_found" });

  articles[idx] = {
    ...articles[idx],
    ...req.body,
  };

  res.json(articles[idx]);
});

/**
 * DELETE
 */
router.delete("/:id", requireAuth, (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  articles = articles.filter(a => a.id !== id);

  res.json({ ok: true });
});

export default router;

