import { PublicLayout } from "@/components/layout/PublicLayout";
import heroBg from "@/assets/hero-bg-sunny.png";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Globe, Building2, TrendingUp } from "lucide-react";
import { useGetFeaturedArticles } from "@workspace/api-client-react";

export default function Home() {
  const { data: featuredArticles, isLoading } = useGetFeaturedArticles();

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
          <div className="absolute inset-0 bg-[#0d1f3c]/55" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0d1f3c]/30 to-transparent" />
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
              Embedded Local Partner
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
              Bridge the Gap to <br />
              <span className="text-secondary">South East Asia.</span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-2xl font-light leading-relaxed">
              Measured authority. Understated elegance. We guide Fortune 500 companies through complex Asian expansions, using Singapore as your strategic gateway.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 h-14 rounded-none">
                  Schedule a Consultation
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 h-14 rounded-none">
                  Our Approach
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Strategic Expansion</h2>
            <p className="text-muted-foreground text-lg">We don't just advise. We embed ourselves as your local partner, navigating the nuances of the Asian market.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Global Mindset",
                description: "Deep understanding of European corporate culture combined with local Asian market intelligence."
              },
              {
                icon: Building2,
                title: "Singapore Hub",
                description: "Leveraging the most stable, business-friendly gateway to orchestrate your regional strategy."
              },
              {
                icon: TrendingUp,
                title: "Embedded Partner",
                description: "We act as your local team, reducing friction, establishing networks, and accelerating growth."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="p-8 border border-border bg-card"
              >
                <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center mb-6 text-secondary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Editorials */}
      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif mb-2">Latest Insights</h2>
              <p className="text-muted-foreground">Market intelligence from our experts.</p>
            </div>
            <Link href="/editorials" className="hidden md:flex items-center gap-2 text-primary font-medium hover:text-secondary transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredArticles?.map((article) => (
                <Link key={article.id} href={`/editorials/${article.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer border border-border bg-card h-full flex flex-col hover:border-secondary/50 transition-colors"
                  >
                    {article.coverImage && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={article.coverImage} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      </div>
                    )}
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="text-xs font-medium text-secondary mb-3 uppercase tracking-wider">{article.category}</div>
                      <h3 className="text-2xl font-serif mb-4 group-hover:text-secondary transition-colors">{article.title}</h3>
                      <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">{article.excerpt}</p>
                      <div className="flex items-center text-sm font-medium mt-auto pt-6 border-t border-border">
                        Read Article <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
