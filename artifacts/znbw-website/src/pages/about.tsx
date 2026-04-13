import { PublicLayout } from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";
import { Building2, Landmark, LineChart, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <section className="bg-primary text-primary-foreground py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
              Bridging Continents.<br />
              <span className="text-secondary">Building Legacies.</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 font-light leading-relaxed">
              Zenith Nova Bridge Wave was founded on a singular premise: European excellence requires embedded local intelligence to thrive in South East Asia.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-serif mb-6">The Singapore Advantage</h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  We operate from Singapore not by chance, but by design. As the financial and logistical nexus of South East Asia, it provides the perfect regulatory and commercial springboard for ambitious European enterprises.
                </p>
                <p>
                  However, operating from Singapore is not enough. The region is complex, fragmented, and deeply relationship-driven. Success requires a partner who understands the European corporate mind while moving fluidly through Asian business networks.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: ShieldCheck, title: "Regulatory Alignment", desc: "Navigating local compliance with European standards." },
                { icon: Landmark, title: "Cultural Bridge", desc: "Translating intent across cultural paradigms." },
                { icon: LineChart, title: "Market Acceleration", desc: "Bypassing typical entry delays." },
                { icon: Building2, title: "Local Presence", desc: "Your embedded team on the ground." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-muted/50 border border-border">
                  <item.icon className="w-8 h-8 text-secondary mb-4" />
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
          <h2 className="text-3xl font-serif mb-8">Our Approach</h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-12">
            We do not produce theoretical reports. We act as your embedded local unit. We negotiate on your behalf, establish your initial operations, vet your local partners, and manage the complexity of your market entry until your own team is ready to take the reins.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
