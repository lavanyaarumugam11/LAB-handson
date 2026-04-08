import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldAlert, User, Send, Ban, AlertTriangle } from "lucide-react";

interface PipelineVisualizerProps {
  activeStep: number; // 0-4
  status?: string;
}

const steps = [
  { label: "Input", icon: Send, gradient: "gradient-ocean" },
  { label: "Moderate", icon: ShieldAlert, gradient: "gradient-vibrant" },
  { label: "Decision", icon: AlertTriangle, gradient: "gradient-sunset" },
  { label: "Human Review", icon: User, gradient: "gradient-aurora" },
  { label: "Final Action", icon: CheckCircle2, gradient: "gradient-ocean" },
];

const PipelineVisualizer = ({ activeStep, status }: PipelineVisualizerProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 py-6">
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isDone = i < activeStep;
        const isSkipped = status === "auto_approved" && i === 3;

        return (
          <div key={step.label} className="flex items-center gap-2 md:gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col items-center gap-1.5`}
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isSkipped
                    ? "bg-muted text-muted-foreground opacity-40 line-through"
                    : isDone
                    ? `${step.gradient} text-primary-foreground shadow-glow-primary`
                    : isActive
                    ? `${step.gradient} text-primary-foreground shadow-glow-primary animate-pulse-glow`
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] md:text-xs font-medium font-display ${
                  isSkipped ? "text-muted-foreground line-through" : isActive || isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
            {i < steps.length - 1 && (
              <ArrowRight
                className={`w-4 h-4 flex-shrink-0 ${
                  isDone ? "text-primary" : "text-muted-foreground/40"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PipelineVisualizer;
