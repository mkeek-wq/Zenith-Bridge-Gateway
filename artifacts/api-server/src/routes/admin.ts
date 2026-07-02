import { z } from "zod";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc } from "drizzle-orm";
import { db, articlesTable, adminUsersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";


const AdminLoginBody = z.object({
  username: z.string(),
  password: z.string(),
});

const CreateArticleBody = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.string(),
  author: z.string(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  coverImage: z.string().nullable().optional(),
});

const UpdateArticleBody = CreateArticleBody.partial();

const UpdateArticleParams = z.object({
  id: z.string(),
});

const DeleteArticleParams = z.object({
  id: z.string(),
});


declare module "express-session" {
  interface SessionData {
    adminUsername?: string;
  }
}

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

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.adminUsername) {
    res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
    return;
  }
  next();
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid username or password" });
    return;
  }

  req.session.adminUsername = user.username;
  res.json({ authenticated: true, username: user.username });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, "Error destroying session");
    }
  });
  res.json({ success: true });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  if (!req.session.adminUsername) {
    res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
    return;
  }
  res.json({ authenticated: true, username: req.session.adminUsername });
});

router.get("/admin/articles", requireAdmin, async (_req, res): Promise<void> => {
  const articles = await db
    .select()
    .from(articlesTable)
    .orderBy(desc(articlesTable.createdAt));

  res.json(articles.map(toApiArticle));
});

router.post("/admin/articles", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { title, excerpt, content, category, author, published = false, featured = false, coverImage } = parsed.data;

  const baseSlug = slugify(title);
  const timestamp = Date.now();
  const slug = `${baseSlug}-${timestamp}`;

  const publishedAt = published ? new Date() : null;

  const [article] = await db
    .insert(articlesTable)
    .values({
      title,
      slug,
      excerpt,
      content,
      category,
      author,
      published,
      featured,
      coverImage: coverImage ?? null,
      publishedAt,
    })
    .returning();

  res.status(201).json(toApiArticle(article));
});

router.put("/admin/articles/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const parsed = UpdateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const existingArticle = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, Number(params.data.id)));

  if (!existingArticle[0]) {
    res.status(404).json({ error: "not_found", message: "Article not found" });
    return;
  }

  const updateData: Partial<typeof articlesTable.$inferInsert> = { ...parsed.data };

  if (parsed.data.published === true && !existingArticle[0].publishedAt) {
    updateData.publishedAt = new Date();
  } else if (parsed.data.published === false) {
    updateData.publishedAt = null;
  }

  const [updated] = await db
    .update(articlesTable)
    .set(updateData)
    .where(eq(articlesTable.id, Number(params.data.id)))
    .returning();

  res.json(toApiArticle(updated));
});

router.delete("/admin/articles/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(articlesTable)
    .where(eq(articlesTable.id, Number(params.data.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "not_found", message: "Article not found" });
    return;
  }

  res.json({ success: true, message: "Article deleted" });
});

export default router;
