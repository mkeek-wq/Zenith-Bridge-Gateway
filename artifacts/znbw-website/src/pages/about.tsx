import { PublicLayout } from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";

export default function About() {
  return (
    <PublicLayout>
      <section className="bg-primary text-primary-foreground py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
              Observing Southeast Asia in motion.
            </h1>

            <p className="text-xl text-primary-foreground/80 font-light leading-relaxed max-w-3xl">
              A regional perspective on business, policy, and change.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-serif mb-6">
                Why this platform exists
              </h2>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Southeast Asia is one of the most dynamic regions in the
                  global economy, yet understanding it often requires navigating
                  fragmented information, rapidly evolving policy environments,
                  and highly localized business realities.
                </p>

                <p>
                  Zenith Nova Bridge Wave was created as a regional editorial
                  platform focused on long-term developments across business,
                  regulation, infrastructure, finance, and economic
                  transformation.
                </p>
              </div>
            </div>

            <div className="pt-12">
              <h2 className="text-3xl font-serif mb-6">
                Regional signals. Local context.
              </h2>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  We follow developments across Southeast Asia with attention to
                  both macroeconomic direction and local nuance.
                </p>

                <p>
                  Our focus includes market developments, public policy,
                  investment activity, institutional shifts, infrastructure, and
                  the evolving relationship between regional and global
                  economies.
                </p>

                <p>
                  Rather than chasing headlines alone, the platform aims to
                  provide context, continuity, and perspective over time.
                </p>
              </div>
            </div>

            <div className="pt-12">
              <h2 className="text-3xl font-serif mb-6">
                Based in Singapore.
              </h2>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Operating from Singapore provides proximity to one of the
                  region’s most important financial and logistical hubs, while
                  offering a broader vantage point on developments across
                  Southeast Asia.
                </p>

                <p>
                  The region cannot be understood through a single market alone.
                  Each country operates within its own political, regulatory,
                  and cultural context — often moving at very different speeds.
                </p>
              </div>
            </div>

            <div className="pt-14 border-t border-border">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Zenith Nova Bridge Wave is an independent platform following
                the forces shaping Southeast Asia — one development, market, and
                signal at a time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
