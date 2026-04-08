import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden px-6 py-20">
      {/* Floating gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-primary/20 blur-3xl"
          style={{ top: "10%", left: "10%" }}
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-accent/15 blur-3xl"
          style={{ bottom: "10%", right: "10%" }}
          animate={{ y: [15, -15, 15], x: [10, -10, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-secondary/20 blur-3xl"
          style={{ top: "40%", right: "30%" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium font-display">Interactive Experience</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6"
        >
          Build Something{" "}
          <span className="gradient-text">Beautiful</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          A colorful, interactive dashboard with smooth animations, 
          modular components, and a design system built for delight.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/moderation">
            <Button variant="vibrant" size="lg" className="rounded-full px-8 text-base">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Moderation Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
            Explore Features
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
