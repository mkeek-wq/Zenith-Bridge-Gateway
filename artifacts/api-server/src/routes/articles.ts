import { Router, type IRouter } from "express";
import { eq, desc, and, count } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  ListArticlesQueryParams,
  GetArticleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApiArticle(row: typeof articlesTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author: row.author,
    published: row.published,
    featured: row.featured,
    coverImage: row.coverImage ?? null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/articles", async (req, res): Promise<void> => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters", message: parsed.error.message });
    return;
  }

  const { page = 1, limit = 10, category } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(articlesTable.published, true)];
  if (category) {
    conditions.push(eq(articlesTable.category, category));
  }

  const where = and(...conditions);

  const [articles, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(articlesTable)
      .where(where)
      .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(articlesTable).where(where),
  ]);

  res.json({
    articles: articles.map(toApiArticle),
    total: Number(total),
    page,
    limit,
  });
});

router.get("/articles/featured", async (_req, res): Promise<void> => {
  const articles = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.published, true), eq(articlesTable.featured, true)))
    .orderBy(desc(articlesTable.publishedAt), desc(articlesTable.createdAt))
    .limit(3);

  res.json(articles.map(toApiArticle));
});

router.get("/articles/:id", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid article ID", message: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.id, params.data.id), eq(articlesTable.published, true)));

  if (!article) {
    res.status(404).json({ error: "not_found", message: "Article not found" });
    return;
  }

  res.json(toApiArticle(article));
});

export default router;
