import { motion } from "framer-motion";
import type { ContentItem } from "@/hooks/useModeration";
import { ShieldCheck, ShieldAlert, ShieldX, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface StatsOverviewProps {
  items: ContentItem[];
}

const StatsOverview = ({ items }: StatsOverviewProps) => {
  const total = items.length;
  const autoApproved = items.filter((i) => i.status === "auto_approved").length;
  const approved = items.filter((i) => i.status === "approved").length;
  const rejected = items.filter((i) => i.status === "rejected").length;
  const pending = items.filter((i) => i.status === "awaiting_review").length;
  const escalated = items.filter((i) => i.status === "escalated").length;

  const stats = [
    { label: "Total", value: total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Auto-Approved", value: autoApproved, icon: ShieldCheck, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Approved", value: approved, icon: CheckCircle2, color: "text-teal", bg: "bg-teal/10" },
    { label: "Rejected", value: rejected, icon: ShieldX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber", bg: "bg-amber/10" },
    { label: "Escalated", value: escalated, icon: ShieldAlert, color: "text-coral", bg: "bg-coral/10" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-3 shadow-soft text-center"
        >
          <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <p className="text-xl font-bold font-display text-card-foreground">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsOverview;
