import { Router, type Request, type Response } from "express";
import { CreateArticleBody, UpdateArticleBody } from "@workspace/api-zod";
import { requireAuth } from "../../middleware/requireAuth.js";
import { getDb, articles, eq, desc } from "@workspace/db";
import { toArticleDTO } from "../../lib/articleMapper.js";
import { classifyArticleMetadata } from "../../lib/articleMetadataClassifier.js";

const router: Router = Router();

type Db = ReturnType<typeof getDb>["db"];

function toId(value: string | string[] | undefined): number {
  if (!value) return NaN;
  const v = Array.isArray(value) ? value[0] : value;
  return Number(v);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getMeta(body: unknown, key: string): string {
  if (!isPlainObject(body)) return "";
  return cleanString(body[key]);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "article"
  );
}

function makeStoredContent(html: unknown, content: unknown): string {
  return JSON.stringify({
    html: typeof html === "string" ? html : "",
    json: content ?? null,
  });
}

async function createUniqueSlug(
  db: Db,
  base: string,
  excludeId?: number,
): Promise<string> {
  const baseSlug = slugify(base);
  let safeSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, safeSlug));

    const conflicts = excludeId
      ? existing.filter((article) => article.id !== excludeId)
      : existing;

    if (!conflicts.length) return safeSlug;

    safeSlug = `${baseSlug}-${counter++}`;
  }
}

function addMetadataToUpdate(
  body: unknown,
  updateData: Partial<typeof articles.$inferInsert>,
) {
  if (!isPlainObject(body)) return;

  const metadataFields = [
    "primaryCountry",
    "secondaryCountries",
    "primaryCategory",
    "secondaryCategories",
    "sectorTags",
    "businessTopics",
    "workforceAttributes",
    "infrastructureAttributes",
    "incentiveTypes",
    "institutions",
    "strategicRisks",
  ] as const;

  for (const field of metadataFields) {
    if (body[field] !== undefined) {
      updateData[field] = cleanString(body[field]);
    }
  }
}

/**
 * CREATE ARTICLE
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const parsed = CreateArticleBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const body = parsed.data;
    const { db } = getDb();

    const title = cleanString(body.title);
    if (!title) {
      return res.status(400).json({ error: "title_required" });
    }

    const requestedSlug = cleanString(body.slug, title);
    const safeSlug = await createUniqueSlug(db, requestedSlug || title);

    const autoMetadata = classifyArticleMetadata({
      title,
      excerpt: cleanString(body.excerpt),
      category: cleanString(body.category),
      country: cleanString(body.country),
      content:
        typeof body.html === "string"
          ? body.html
          : JSON.stringify(body.content ?? ""),
    });

    const result = await db
      .insert(articles)
      .values({
        title,
        slug: safeSlug,
        excerpt: cleanString(body.excerpt),
        category: cleanString(body.category, "uncategorized") || "uncategorized",
        author: cleanString(body.author, "admin") || "admin",
        content: makeStoredContent(body.html, body.content),
        published: cleanBool(body.published) ?? false,
        featured: cleanBool(body.featured) ?? false,
        coverImage: cleanString(body.coverImage),
        country: cleanString(body.country),

                primaryCountry:
          getMeta(req.body, "primaryCountry") ||
          autoMetadata.primaryCountry,

        secondaryCountries:
          getMeta(req.body, "secondaryCountries") ||
          autoMetadata.secondaryCountries,

        primaryCategory:
          getMeta(req.body, "primaryCategory") ||
          autoMetadata.primaryCategory,

        secondaryCategories:
          getMeta(req.body, "secondaryCategories") ||
          autoMetadata.secondaryCategories,

        sectorTags:
          getMeta(req.body, "sectorTags") ||
          autoMetadata.sectorTags,

        businessTopics:
          getMeta(req.body, "businessTopics") ||
          autoMetadata.businessTopics,

        workforceAttributes:
          getMeta(req.body, "workforceAttributes") ||
          autoMetadata.workforceAttributes,

        infrastructureAttributes:
          getMeta(req.body, "infrastructureAttributes") ||
          autoMetadata.infrastructureAttributes,

        incentiveTypes:
          getMeta(req.body, "incentiveTypes") ||
          autoMetadata.incentiveTypes,

        institutions:
          getMeta(req.body, "institutions") ||
          autoMetadata.institutions,

        strategicRisks:
          getMeta(req.body, "strategicRisks") ||
          autoMetadata.strategicRisks,
      })
      .returning();

    return res.status(201).json(toArticleDTO(result[0]));
  } catch (err) {
    console.error("create_article_failed", err);
    return res.status(500).json({ error: "create_article_failed" });
  }
});

/**
 * LIST ARTICLES
 * Admin-only: returns all articles, including drafts.
 */
router.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const result = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.createdAt));

    return res.json(result.map(toArticleDTO));
  } catch (err) {
    console.error("list_articles_failed", err);
    return res.status(500).json({ error: "list_articles_failed" });
  }
});

/**
 * PUBLIC ARTICLES LIST
 * Public: paginated published articles only.
 */
router.get("/public", async (req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 9)));

    const search = cleanString(req.query.search).toLowerCase();
    const category = cleanString(req.query.category).toLowerCase();
    const country = cleanString(req.query.country).toLowerCase();
    const featured = cleanString(req.query.featured).toLowerCase();

    const result = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.createdAt));

    let filtered = result.filter((article) => article.published === true);

    if (search) {
      filtered = filtered.filter((article) => {
        const haystack = [
          article.title,
          article.excerpt,
          article.category,
          article.country,
          article.primaryCountry,
          article.secondaryCountries,
          article.primaryCategory,
          article.secondaryCategories,
          article.sectorTags,
          article.businessTopics,
          article.workforceAttributes,
          article.infrastructureAttributes,
          article.incentiveTypes,
          article.institutions,
          article.strategicRisks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    if (category) {
      filtered = filtered.filter(
        (article) => cleanString(article.category).toLowerCase() === category,
      );
    }

    if (country) {
      filtered = filtered.filter(
        (article) => cleanString(article.country).toLowerCase() === country,
      );
    }

    if (featured === "true") {
      filtered = filtered.filter((article) => article.featured === true);
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const categories = Array.from(
      new Set(
        result
          .filter((article) => article.published === true)
          .map((article) => article.category)
          .filter(Boolean),
      ),
    );

    const countries = Array.from(
      new Set(
        result
          .filter((article) => article.published === true)
          .map((article) => article.country)
          .filter(Boolean),
      ),
    );

    return res.json({
      articles: paginated.map(toArticleDTO),
      total: filtered.length,
      limit,
      page,
      categories,
      countries,
    });
  } catch (err) {
    console.error("public_articles_failed", err);
    return res.status(500).json({ error: "public_articles_failed" });
  }
});

/**
 * GET FEATURED ARTICLES
 * Public: only returns published featured articles.
 */
router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const result = await db
      .select()
      .from(articles)
      .where(eq(articles.featured, true))
      .orderBy(desc(articles.createdAt));

    const publishedOnly = result.filter(
      (article) => article.published === true,
    );

    return res.json(publishedOnly.map(toArticleDTO));
  } catch (err) {
    console.error("featured_articles_failed", err);
    return res.status(500).json({ error: "featured_articles_failed" });
  }
});

/**
 * GET SINGLE ARTICLE FOR ADMIN
 * Admin-only: returns published and draft articles.
 */
router.get("/admin/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const raw = cleanString(req.params.id);
    const numericId = Number(raw);

    const result =
      !Number.isNaN(numericId) && raw !== ""
        ? await db.select().from(articles).where(eq(articles.id, numericId))
        : await db.select().from(articles).where(eq(articles.slug, raw));

    if (!result.length) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json(toArticleDTO(result[0]));
  } catch (err) {
    console.error("get_admin_article_failed", err);
    return res.status(500).json({ error: "get_admin_article_failed" });
  }
});

/**
 * GET SINGLE ARTICLE
 * Public: supports numeric IDs and slugs.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const raw = cleanString(req.params.id);
    const numericId = Number(raw);

    const result =
      !Number.isNaN(numericId) && raw !== ""
        ? await db.select().from(articles).where(eq(articles.id, numericId))
        : await db.select().from(articles).where(eq(articles.slug, raw));

    if (!result.length) {
      return res.status(404).json({ error: "not_found" });
    }

    const article = result[0];

    if (!article.published) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json(toArticleDTO(article));
  } catch (err) {
    console.error("get_article_failed", err);
    return res.status(500).json({ error: "get_article_failed" });
  }
});

/**
 * UPDATE ARTICLE
 */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const parsed = UpdateArticleBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const body = parsed.data;
    const { db } = getDb();

    const id = toId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const updateData: Partial<typeof articles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      const title = cleanString(body.title);
      if (!title) {
        return res.status(400).json({ error: "title_required" });
      }
      updateData.title = title;
    }

    if (body.slug !== undefined) {
      const slug = cleanString(body.slug);
      if (!slug) {
        return res.status(400).json({ error: "invalid_slug" });
      }
      updateData.slug = await createUniqueSlug(db, slug, id);
    }

    if (body.excerpt !== undefined) {
      updateData.excerpt = cleanString(body.excerpt);
    }

    if (body.category !== undefined) {
      updateData.category =
        cleanString(body.category, "uncategorized") || "uncategorized";
    }

    if (body.author !== undefined) {
      updateData.author = cleanString(body.author, "admin") || "admin";
    }

    if (body.published !== undefined) {
      const published = cleanBool(body.published);
      if (published === undefined) {
        return res.status(400).json({ error: "invalid_published" });
      }
      updateData.published = published;
    }

    if (body.featured !== undefined) {
      const featured = cleanBool(body.featured);
      if (featured === undefined) {
        return res.status(400).json({ error: "invalid_featured" });
      }
      updateData.featured = featured;
    }

    if (body.coverImage !== undefined) {
      updateData.coverImage = cleanString(body.coverImage);
    }

    if (body.country !== undefined) {
      updateData.country = cleanString(body.country);
    }

        const existingForMetadata = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));

    if (!existingForMetadata.length) {
      return res.status(404).json({ error: "not_found" });
    }

    const currentArticle = existingForMetadata[0];

    let currentContentForMetadata = currentArticle.content;

    if (body.content !== undefined || body.html !== undefined) {
      let parsedExistingContent: { html?: unknown; json?: unknown } = {};

      try {
        parsedExistingContent =
          typeof currentArticle.content === "string"
            ? JSON.parse(currentArticle.content)
            : {};
      } catch {
        parsedExistingContent = {
          html: currentArticle.content,
          json: null,
        };
      }

      currentContentForMetadata = makeStoredContent(
        body.html !== undefined ? body.html : parsedExistingContent.html,
        body.content !== undefined ? body.content : parsedExistingContent.json,
      );
    }

    const autoMetadata = classifyArticleMetadata({
      title: updateData.title ?? currentArticle.title,
      excerpt: updateData.excerpt ?? currentArticle.excerpt,
      category: updateData.category ?? currentArticle.category,
      country: updateData.country ?? currentArticle.country,
      content: currentContentForMetadata,
    });

    updateData.primaryCountry =
      getMeta(req.body, "primaryCountry") ||
      autoMetadata.primaryCountry;

    updateData.secondaryCountries =
      getMeta(req.body, "secondaryCountries") ||
      autoMetadata.secondaryCountries;

    updateData.primaryCategory =
      getMeta(req.body, "primaryCategory") ||
      autoMetadata.primaryCategory;

    updateData.secondaryCategories =
      getMeta(req.body, "secondaryCategories") ||
      autoMetadata.secondaryCategories;

    updateData.sectorTags =
      getMeta(req.body, "sectorTags") ||
      autoMetadata.sectorTags;

    updateData.businessTopics =
      getMeta(req.body, "businessTopics") ||
      autoMetadata.businessTopics;

    updateData.workforceAttributes =
      getMeta(req.body, "workforceAttributes") ||
      autoMetadata.workforceAttributes;

    updateData.infrastructureAttributes =
      getMeta(req.body, "infrastructureAttributes") ||
      autoMetadata.infrastructureAttributes;

    updateData.incentiveTypes =
      getMeta(req.body, "incentiveTypes") ||
      autoMetadata.incentiveTypes;

    updateData.institutions =
      getMeta(req.body, "institutions") ||
      autoMetadata.institutions;

    updateData.strategicRisks =
      getMeta(req.body, "strategicRisks") ||
      autoMetadata.strategicRisks;

    if (body.content !== undefined || body.html !== undefined) {
      const existing = await db
        .select()
        .from(articles)
        .where(eq(articles.id, id));

      if (!existing.length) {
        return res.status(404).json({ error: "not_found" });
      }

      let existingContent: { html?: unknown; json?: unknown } = {};

      try {
        existingContent =
          typeof existing[0].content === "string"
            ? JSON.parse(existing[0].content)
            : {};
      } catch {
        existingContent = { html: existing[0].content, json: null };
      }

      updateData.content = makeStoredContent(
        body.html !== undefined ? body.html : existingContent.html,
        body.content !== undefined ? body.content : existingContent.json,
      );
    }

    const result = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json(toArticleDTO(result[0]));
  } catch (err) {
    console.error("update_article_failed", err);
    return res.status(500).json({ error: "update_article_failed" });
  }
});

/**
 * DELETE ARTICLE
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { db } = getDb();

    const id = toId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const result = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("delete_article_failed", err);
    return res.status(500).json({ error: "delete_article_failed" });
  }
});

export default router;
