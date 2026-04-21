import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function Editorials() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading } = useListArticles({ page, limit: 9 });

  return (
    <PublicLayout>
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">News & Editorials</h1>
          <p className="text-xl text-primary-foreground/80 font-light max-w-2xl">
            Market intelligence, strategic insights, and updates from the Zenith Nova Bridge Wave team.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : data?.articles.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-2">No articles found</h2>
              <p className="text-muted-foreground">Check back later for new insights.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(data?.articles ?? []).map((article, i) => (
                  <Link key={article.id} href={`/editorials/${article.id}`}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="group cursor-pointer border border-border bg-card h-full flex flex-col hover:border-secondary/50 transition-colors"
                    >
                      {article.coverImage ? (
                        <div className="h-48 overflow-hidden bg-muted">
                          <img 
                            src={article.coverImage} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-muted flex items-center justify-center">
                          <span className="font-serif text-3xl text-muted-foreground/30">ZNBW</span>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3 text-xs font-medium uppercase tracking-wider">
                          <span className="text-secondary">{article.category}</span>
                          <span className="text-muted-foreground">
                            {article.publishedAt ? format(new Date(article.publishedAt), 'MMM d, yyyy') : ''}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif mb-3 group-hover:text-secondary transition-colors">{article.title}</h3>
                        <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm">{article.excerpt}</p>
                        <div className="flex items-center text-sm font-medium mt-auto pt-4 border-t border-border">
                          Read Article <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {data && data.total > data.limit && (
                <div className="mt-16 flex justify-center gap-2">
                  {Array.from({ length: Math.ceil(data.total / data.limit) }).map((_, i) => (
                    <Link key={i} href={`/editorials?page=${i + 1}`}>
                      <div className={`w-10 h-10 flex items-center justify-center border cursor-pointer transition-colors ${page === i + 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}>
                        {i + 1}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
