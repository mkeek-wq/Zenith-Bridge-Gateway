import { GetFeaturedArticlesResponse } from "@workspace/api-zod";
import { Router } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";

const router = Router();

function toPublicArticle(row: typeof articlesTable.$inferSelect) {
  return {
    ...row,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

// ALL ARTICLES
router.get("/", async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 9);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 9;
  const offset = (safePage - 1) * safeLimit;

  const allArticles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt));

  const articles = allArticles.slice(offset, offset + safeLimit);

  res.json({
    articles: articles.map(toPublicArticle),
    total: allArticles.length,
    page: safePage,
    limit: safeLimit,
  });
});

// PUBLIC ARTICLES
router.get("/public", async (req, res) => {
  const limit = Number(req.query.limit ?? 12);

  const articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt))
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 12);

  res.json(articles.map(toPublicArticle));
});

// FEATURED ARTICLES
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

    const safeArticles = GetFeaturedArticlesResponse.parse(
      articles.map(toPublicArticle),
    );

    res.json(safeArticles);
  } catch (err) {
    console.error("❌ Featured articles query failed:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// SINGLE ARTICLE BY ID
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

  return res.json(article[0] ? toPublicArticle(article[0]) : null);
});

export default router;
