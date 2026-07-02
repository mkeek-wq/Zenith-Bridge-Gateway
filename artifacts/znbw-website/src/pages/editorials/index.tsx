import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { apiFetch } from "@/api/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Article = {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  category?: string | null;
  country?: string | null;
  featured?: boolean;
  coverImage?: string | null;
  publishedAt?: string | null;
};

type ArticlesResponse = {
  articles: Article[];
  total: number;
  limit: number;
  page?: number;
  categories?: string[];
  countries?: string[];
};

function buildEditorialsUrl(updates: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  return `/editorials?${params.toString()}`;
}

export default function Editorials() {
  const searchParams = new URLSearchParams(window.location.search);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const featured = searchParams.get("featured") || "";

  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    apiFetch(
      `/api/v1/articles/public?page=${page}&limit=9` +
        `&search=${encodeURIComponent(search)}` +
        `&category=${encodeURIComponent(category)}` +
        `&country=${encodeURIComponent(country)}` +
        `&featured=${encodeURIComponent(featured)}`,
    )
      .then((res: ArticlesResponse) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [page, search, category, country, featured]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <PublicLayout>
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            News & Editorials
          </h1>
          <p className="text-xl text-primary-foreground/80 font-light max-w-2xl">
            Market intelligence, strategic insights, and updates from the Zenith Nova Bridge Wave team.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              defaultValue={search}
              placeholder="Search articles..."
              className="border border-border bg-background px-4 py-3 rounded-sm"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  window.location.href = buildEditorialsUrl({
                    page: "1",
                    search: event.currentTarget.value,
                  });
                }
              }}
            />

            <select
              value={category}
              className="border border-border bg-background px-4 py-3 rounded-sm"
              onChange={(event) => {
                window.location.href = buildEditorialsUrl({
                  page: "1",
                  category: event.target.value || null,
                });
              }}
            >
              <option value="">All categories</option>
              {(data?.categories ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={country}
              className="border border-border bg-background px-4 py-3 rounded-sm"
              onChange={(event) => {
                window.location.href = buildEditorialsUrl({
                  page: "1",
                  country: event.target.value || null,
                });
              }}
            >
              <option value="">All countries</option>
              {(data?.countries ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={featured}
              className="border border-border bg-background px-4 py-3 rounded-sm"
              onChange={(event) => {
                window.location.href = buildEditorialsUrl({
                  page: "1",
                  featured: event.target.value || null,
                });
              }}
            >
              <option value="">Latest articles</option>
              <option value="true">Featured only</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : (data?.articles?.length ?? 0) === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-2">No articles found</h2>
              <p className="text-muted-foreground">
                Check back later for new insights.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(data?.articles ?? []).map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/editorials/${article.slug ?? article.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="group cursor-pointer border border-border bg-card h-full flex flex-col overflow-hidden hover:border-secondary/60 hover:shadow-lg transition-all"
                    >
                      <div className="relative h-52 overflow-hidden bg-muted">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-gradient-to-br from-primary/10 via-muted to-secondary/10 flex items-center justify-center">
                            <span className="font-serif text-5xl text-muted-foreground/20 tracking-widest">
                              ZNBW
                            </span>
                            <div className="absolute inset-0 bg-background/20" />
                          </div>
                        )}

                        {article.featured && (
                          <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider px-3 py-1">
                            Featured
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-4 text-xs font-medium uppercase tracking-wider">
                          {article.category && (
                            <span className="border border-secondary/40 text-secondary px-2 py-1">
                              {article.category}
                            </span>
                          )}

                          {article.country && (
                            <span className="border border-border text-muted-foreground px-2 py-1">
                              {article.country}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-serif mb-3 leading-snug group-hover:text-secondary transition-colors">
                          {article.title}
                        </h3>

                        <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-sm font-medium mt-auto pt-4 border-t border-border">
                          <span className="inline-flex items-center">
                            Read Article
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {article.publishedAt
                              ? format(new Date(article.publishedAt), "MMM d, yyyy")
                              : ""}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-16 flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const nextPage = i + 1;

                    return (
                      <a
                        key={nextPage}
                        href={buildEditorialsUrl({ page: String(nextPage) })}
                        className={`w-10 h-10 flex items-center justify-center border cursor-pointer transition-colors ${
                          page === nextPage
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {nextPage}
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
