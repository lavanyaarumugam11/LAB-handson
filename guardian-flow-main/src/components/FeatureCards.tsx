import { motion } from "framer-motion";
import { Zap, Shield, Palette, Layers, Code2, Rocket } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized rendering with zero layout shifts and instant interactions.",
    gradient: "gradient-vibrant",
    shadow: "shadow-glow-primary",
  },
  {
    icon: Shield,
    title: "Rock Solid",
    description: "Type-safe architecture with comprehensive error boundaries.",
    gradient: "gradient-ocean",
    shadow: "shadow-glow-teal",
  },
  {
    icon: Palette,
    title: "Design System",
    description: "Semantic tokens, consistent spacing, and cohesive color palette.",
    gradient: "gradient-sunset",
    shadow: "shadow-glow-accent",
  },
  {
    icon: Layers,
    title: "Composable",
    description: "Small, focused components that snap together like building blocks.",
    gradient: "gradient-aurora",
    shadow: "shadow-glow-primary",
  },
  {
    icon: Code2,
    title: "Clean Code",
    description: "Modular architecture with clear separation of concerns.",
    gradient: "gradient-ocean",
    shadow: "shadow-glow-teal",
  },
  {
    icon: Rocket,
    title: "Ship Faster",
    description: "Pre-built patterns and variants accelerate development velocity.",
    gradient: "gradient-vibrant",
    shadow: "shadow-glow-primary",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Packed with <span className="gradient-text">Features</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every component is crafted with care, following best practices for performance and accessibility.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-elevated transition-shadow duration-300 cursor-pointer overflow-hidden"
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 ${feature.shadow} transition-all duration-300 group-hover:scale-110`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>

              <h3 className="text-lg font-semibold font-display mb-2 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
