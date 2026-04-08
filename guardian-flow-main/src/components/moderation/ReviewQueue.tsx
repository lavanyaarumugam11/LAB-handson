import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Eye } from "lucide-react";
import type { ContentItem } from "@/hooks/useModeration";

interface ReviewQueueProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  awaiting_review: { color: "bg-amber text-primary-foreground", icon: Clock, label: "Pending" },
  auto_approved: { color: "bg-secondary text-secondary-foreground", icon: CheckCircle2, label: "Auto-Approved" },
  approved: { color: "bg-teal text-primary-foreground", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "bg-destructive text-destructive-foreground", icon: XCircle, label: "Rejected" },
  escalated: { color: "bg-coral text-primary-foreground", icon: AlertTriangle, label: "Escalated" },
};

const ReviewQueue = ({ items, onSelectItem }: ReviewQueueProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-display">No items to display</p>
        <p className="text-sm mt-1">Submit content to see the moderation pipeline in action.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const config = statusConfig[item.status] || statusConfig.awaiting_review;
          const StatusIcon = config.icon;
          const isPending = item.status === "awaiting_review";

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={() => onSelectItem(item)}
              className={`bg-card rounded-xl p-4 shadow-soft border transition-all duration-200 cursor-pointer hover:shadow-elevated ${
                isPending ? "border-amber/30 hover:border-amber/60" : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`${config.color} border-none text-xs`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">#{item.id}</span>
                    {item.riskScore > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.riskScore >= 0.7
                            ? "border-destructive text-destructive"
                            : item.riskScore >= 0.3
                            ? "border-amber text-amber"
                            : "border-secondary text-secondary"
                        }`}
                      >
                        Risk: {(item.riskScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed truncate">
                    {item.text}
                  </p>
                  {item.flaggedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.flaggedTerms.map((term) => (
                        <span
                          key={term}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.reviewerNote && (
                    <p className="text-xs text-muted-foreground mt-2 italic truncate">
                      Note: "{item.reviewerNote}"
                    </p>
                  )}
                </div>
                <span className="text-xs text-primary font-medium flex-shrink-0">
                  {isPending ? "Review →" : "View →"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ReviewQueue;
