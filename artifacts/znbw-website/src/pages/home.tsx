import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import heroBg from "@/assets/hero-bg-clean.png";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Globe, Building2, TrendingUp } from "lucide-react";
import { apiFetch } from "@/api/client";

type Article = {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  category?: string;
  coverImage?: string;
};

export default function Home() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiFetch("/api/v1/articles/featured")
      .then((data) => {
        setFeaturedArticles(data ?? []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  if (process.env.NODE_ENV !== "production") {
    console.log("[featuredArticles]", featuredArticles);
    if (error) console.warn("[featuredArticles error]", error);
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Singapore Skyline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0d1f3c]/60" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0d1f3c]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Southeast Asia Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
              Business intelligence across <br />
              <span className="text-secondary">Southeast Asia.</span>
            </h1>

            <p className="text-xl text-white/80 mb-10 max-w-2xl font-light leading-relaxed">
              Zenith Nova Bridge Wave provides analysis, editorial intelligence, and strategic insight focused on Singapore and the broader Southeast Asian region.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 h-14 rounded-none">
                  Contact Zenith
                </Button>
              </Link>

              <Link href="/about">
                <Button size="lg" variant="outline" className="bg-[#0d1f3c]/70 text-white border-white/40 hover:bg-[#0d1f3c]/90 hover:text-white text-lg px-8 h-14 rounded-none backdrop-blur">
                  About Zenith
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">
              Regional insight with strategic perspective
            </h2>
            <p className="text-muted-foreground text-lg">
              Analysis and editorial perspectives focused on Singapore and Southeast Asia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Regional Intelligence",
                description: "Business, regulatory, and geopolitical developments across Southeast Asia."
              },
              {
                icon: Building2,
                title: "Singapore Perspective",
                description: "Insights from one of Asia’s leading financial and commercial hubs."
              },
              {
                icon: TrendingUp,
                title: "Strategic Analysis",
                description: "Focused commentary on markets, regulation, technology, and regional developments."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 border border-border bg-card">
                <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center mb-6 text-secondary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-serif mb-2">Latest Insights</h2>
          <p className="text-muted-foreground mb-12">
            Analysis and editorial perspectives on business, markets, regulation, and regional developments.
          </p>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/editorials/${article.slug ?? article.id}`}>
                  <div className="border bg-card hover:border-secondary transition cursor-pointer">
                    {article.coverImage && (
                      <img
                        src={article.coverImage}
                        className="h-48 w-full object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="text-xs text-secondary mb-2 uppercase">
                        {article.category}
                      </div>
                      <h3 className="text-xl font-serif mb-2">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 text-sm flex items-center gap-2">
                        Read More <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
