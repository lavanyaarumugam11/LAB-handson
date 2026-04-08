import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  label: string;
  color: string;
}

const AnimatedCounter = ({ target, suffix = "", label, color }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className={`text-4xl md:text-5xl font-bold font-display ${color}`}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
};

const StatsBar = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto glass rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter target={12847} label="Active Users" color="text-primary" />
          <AnimatedCounter target={99} suffix="%" label="Uptime" color="text-secondary" />
          <AnimatedCounter target={340} suffix="+" label="Components" color="text-coral" />
          <AnimatedCounter target={4.9} suffix="★" label="Rating" color="text-amber" />
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
