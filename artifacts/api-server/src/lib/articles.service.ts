import { getDb, articles } from "@workspace/db";
import { eq, desc, and } from "@workspace/db";

/**
 * GET ALL PUBLISHED ARTICLES
 */
export const getArticles = async () => {
  const { db } = getDb();

  try {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.createdAt));
  } catch (err) {
    console.error("🔥 DB ERROR getArticles:", err);
    throw err;
  }
};

/**
 * GET FEATURED ARTICLES
 */
export const getFeaturedArticles = async () => {
  const { db } = getDb();

  try {
    return await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.published, true),
          eq(articles.featured, true)
        )
      )
      .orderBy(desc(articles.createdAt))
      .limit(3);
  } catch (err) {
    console.error("🔥 DB ERROR getFeaturedArticles:", err);
    throw err;
  }
};

/**
 * GET ARTICLE BY ID
 */
export const getArticleById = async (id: number) => {
  const { db } = getDb();

  try {
    const result = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    return result[0] ?? null;
  } catch (err) {
    console.error("🔥 DB ERROR getArticleById:", err);
    throw err;
  }
};
