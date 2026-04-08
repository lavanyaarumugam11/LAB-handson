import { motion } from "framer-motion";
import type { AuditEntry } from "@/hooks/useModeration";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusColors: Record<string, string> = {
  pending: "bg-muted-foreground",
  moderating: "bg-violet",
  auto_approved: "bg-secondary",
  awaiting_review: "bg-amber",
  approved: "bg-teal",
  rejected: "bg-destructive",
  escalated: "bg-coral",
};

interface AuditLogProps {
  logs: AuditEntry[];
}

const AuditLog = ({ logs }: AuditLogProps) => {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No audit events yet.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 pr-4">
        {logs.slice(0, 50).map((log, i) => (
          <motion.div
            key={`${log.contentId}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-start gap-3 text-xs"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusColors[log.status] || "bg-muted"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="font-mono text-muted-foreground/60">#{log.contentId}</span>
              </div>
              <p className="text-card-foreground mt-0.5">{log.event}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default AuditLog;
