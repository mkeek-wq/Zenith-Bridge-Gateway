import { GetFeaturedArticlesResponse } from "@workspace/api-zod";
import { Router } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";

const router = Router();

// 1️⃣ ALL ARTICLES
router.get("/", async (_req, res) => {
  const articles = await db.select().from(articlesTable);
  res.json(articles);
});

// 2️⃣ FEATURED (MUST COME BEFORE :id)
router.get("/featured", async (_req, res) => {
  try {
    const articles = await db
      .select()
      .from(articlesTable)
      .where(
        and(
          eq(articlesTable.published, true),
          eq(articlesTable.featured, true),
        ),
      )
      .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt))
      .limit(3);

    const safeArticles = GetFeaturedArticlesResponse.parse(articles);
    
    res.json(safeArticles);
  } catch (err) {
    console.error("❌ Featured articles query failed:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// 3️⃣ SINGLE ARTICLE
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid article ID" });
  }

  const article = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);

  return res.json(article[0] ?? null);
});

export default router;
