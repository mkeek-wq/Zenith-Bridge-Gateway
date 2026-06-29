import { PublicLayout } from "@/components/layout/PublicLayout";
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { apiFetch } from "@/api/client";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Article = {
  id: string | number;
  slug?: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string | null;
  country?: string | null;
  author?: string;
  coverImage?: string | null;
  featured?: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
};

type ArticlesResponse = {
  articles?: Article[];
};

function normalizeArticleHtml(html: string) {
  return html
    .replaceAll("http://www.zenithnovabridgewave.com/uploads/", "/uploads/")
    .replaceAll("http://zenithnovabridgewave.com/uploads/", "/uploads/")
    .replaceAll("https://www.zenithnovabridgewave.com/uploads/", "/uploads/")
    .replaceAll("https://zenithnovabridgewave.com/uploads/", "/uploads/");
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function enhanceArticleHtml(html: string) {
  const sectionHeadings: string[] = [];

  const htmlWithAnchors = html.replace(/<h([2-3])>(.*?)<\/h\1>/g, (_match, level, text) => {
    const plainText = text.replace(/<[^>]+>/g, "").trim();
    const id = slugifyHeading(plainText);

    if (level === "2" && plainText.toLowerCase() !== "key takeaways") {
      sectionHeadings.push(id);
    }

    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  let takeawayIndex = 0;

  return htmlWithAnchors.replace(
    /(<h2 id="key-takeaways">.*?<\/h2>\s*<ul>)(.*?)(<\/ul>)/is,
    (_match, opening, listItems, closing) => {
      const linkedItems = listItems.replace(/<li>(.*?)<\/li>/gis, (_liMatch: string, itemText: string) => {
        const target = sectionHeadings[takeawayIndex];
        takeawayIndex += 1;

        if (!target) return `<li>${itemText}</li>`;

        return `<li><a href="#${target}">${itemText}</a></li>`;
      });

      return `${opening}${linkedItems}${closing}`;
    },
  );
}

export default function EditorialDetail() {
  const params = useParams();
  const id = params.id;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    setRelatedArticles([]);

    apiFetch(`/api/v1/articles/${id}`)
      .then((res: Article) => {
        setArticle(res);

        return apiFetch("/api/v1/articles/public?limit=12")
          .then((relatedRes: ArticlesResponse) => {
            const filtered = (relatedRes.articles ?? [])
              .filter((item) => {
                if (String(item.slug ?? item.id) === String(id)) return false;

                return (
                  (res.category && item.category && res.category === item.category) ||
                  (res.country && item.country && res.country === item.country)
                );
              })
              .slice(0, 3);

            setRelatedArticles(filtered);
          })
          .catch(() => {
            setRelatedArticles([]);
          });
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load article");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 md:px-8 py-20 max-w-4xl">
          <Skeleton className="h-4 w-24 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-6 w-1/3 mb-12" />
          <Skeleton className="h-80 w-full mb-12" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 md:px-8 py-32 text-center">
          <h1 className="text-3xl font-serif mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The editorial you are looking for does not exist or has been removed.
          </p>
          <Link href="/editorials" className="text-secondary hover:underline">
            Return to Editorials
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="pb-24">
        <header className="relative bg-primary text-primary-foreground overflow-hidden">
          {article.coverImage && (
            <div className="absolute inset-0 z-0 flex items-stretch justify-center pointer-events-none">
              <div className="w-full max-w-5xl px-4 md:px-8 py-10">
                <div className="relative h-full min-h-[420px] overflow-hidden opacity-100">
                  <img
                    src={article.coverImage}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover saturate-90"
                  />

                  <div className="absolute inset-0 bg-primary/10" />
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-primary via-primary/75 to-transparent" />
                  <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/70 to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary to-transparent" />

                  {article.featured && (
                    <div className="absolute top-6 right-6 z-20 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider px-4 py-2 shadow-md">
                      Featured Article
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/50" />

          <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-4xl pt-24 pb-24">
            <Link
              href="/editorials"
              className="inline-flex items-center text-sm font-medium text-primary-foreground/70 hover:text-secondary mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Editorials
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-sm font-medium uppercase tracking-wider text-secondary mb-5">
              {article.country && <span>{article.country}</span>}
              {article.country && article.category && (
                <span className="w-1 h-1 rounded-full bg-secondary/50" />
              )}
              {article.category && <span>{article.category}</span>}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6">
              {article.title}
            </h1>

            <div className="text-sm text-primary-foreground/60">
              Published{" "}
              {article.publishedAt || article.createdAt
                ? format(new Date(article.publishedAt ?? article.createdAt!), "MMMM d, yyyy")
                : "by Zenith Nova Bridge Wave"}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-8 max-w-4xl mt-14">
          <div className="article-content">
            {(() => {
              if (!article.content) return <p>No content available.</p>;

              try {
                const parsed = JSON.parse(article.content);

                if (parsed?.html) {
                  return (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: enhanceArticleHtml(normalizeArticleHtml(parsed.html)),
                      }}
                    />
                  );
                }
              } catch {
                // fallback to plain text rendering
              }

              return article.content.split("\n").map((paragraph, i) =>
                paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />,
              );
            })()}
          </div>
        </div>

        {(relatedArticles.length > 0 || article.country || article.category) && (
          <section className="container mx-auto px-4 md:px-8 max-w-5xl mt-24 border-t border-border pt-14">
            {relatedArticles.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-serif mb-8">Related Editorials</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((item) => (
                    <Link key={item.id} href={`/editorials/${item.slug ?? item.id}`}>
                      <div className="group border border-border bg-card overflow-hidden cursor-pointer hover:border-secondary/50 transition-all h-full">
                        <div className="h-44 overflow-hidden bg-muted">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-secondary mb-3">
                            {item.country && <span>{item.country}</span>}
                            {item.country && item.category && <span>·</span>}
                            {item.category && <span>{item.category}</span>}
                          </div>

                          <h3 className="font-serif text-xl leading-snug mb-4 group-hover:text-secondary transition-colors">
                            {item.title}
                          </h3>

                          <div className="flex items-center text-sm font-medium">
                            Read Editorial
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(article.country || article.category) && (
              <div>
                <h3 className="text-lg font-serif mb-4">Explore Topics</h3>

                <div className="flex flex-wrap gap-3">
                  {article.country && (
                    <Link href={`/editorials?country=${encodeURIComponent(article.country)}`}>
                      <span className="border border-border px-4 py-2 text-sm cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                        {article.country}
                      </span>
                    </Link>
                  )}

                  {article.category && (
                    <Link href={`/editorials?category=${encodeURIComponent(article.category)}`}>
                      <span className="border border-border px-4 py-2 text-sm cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                        {article.category}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </article>
    </PublicLayout>
  );
}
