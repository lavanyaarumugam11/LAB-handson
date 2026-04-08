import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  FileText,
  User,
  ArrowRight,
  Timer,
} from "lucide-react";
import type { ContentItem } from "@/hooks/useModeration";

interface ApprovalPanelProps {
  item: ContentItem | null;
  onDecision: (id: string, decision: "approved" | "rejected" | "escalated", note?: string) => void;
  onClose: () => void;
}

const TIMEOUT_SECONDS = 120;

const riskLevelConfig = (score: number) => {
  if (score >= 0.7) return { label: "High Risk", color: "text-destructive", bg: "bg-destructive/10", barColor: "bg-destructive" };
  if (score >= 0.3) return { label: "Medium Risk", color: "text-amber", bg: "bg-amber/10", barColor: "bg-amber" };
  return { label: "Low Risk", color: "text-secondary", bg: "bg-secondary/10", barColor: "bg-secondary" };
};

const ApprovalPanel = ({ item, onDecision, onClose }: ApprovalPanelProps) => {
  const [note, setNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approved" | "rejected" | "escalated" | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

  // Reset state when item changes
  useEffect(() => {
    setNote("");
    setConfirmAction(null);
    setTimeLeft(TIMEOUT_SECONDS);
  }, [item?.id]);

  // Countdown timer
  useEffect(() => {
    if (!item || item.status !== "awaiting_review") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecision(item.id, "escalated", "Auto-escalated: review timeout");
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [item?.id, item?.status, onDecision]);

  const handleConfirm = () => {
    if (!item || !confirmAction) return;
    onDecision(item.id, confirmAction, note || undefined);
    setConfirmAction(null);
    setNote("");
  };

  if (!item) return null;

  const risk = riskLevelConfig(item.riskScore);
  const isPending = item.status === "awaiting_review";
  const timePercent = (timeLeft / TIMEOUT_SECONDS) * 100;
  const isUrgent = timeLeft < 30;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-card rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card rounded-t-2xl border-b border-border p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-aurora flex items-center justify-center shadow-glow-primary">
                <ShieldAlert className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-card-foreground">Human Review</h2>
                <p className="text-xs text-muted-foreground font-mono">#{item.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Timeout timer */}
            {isPending && (
              <div className={`rounded-xl p-4 ${isUrgent ? "bg-destructive/5 border border-destructive/20" : "bg-muted"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className={`w-4 h-4 ${isUrgent ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                      Review Timeout
                    </span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${isUrgent ? "text-destructive" : "text-card-foreground"}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <Progress value={timePercent} className={`h-2 ${isUrgent ? "[&>div]:bg-destructive" : ""}`} />
                {isUrgent && (
                  <p className="text-xs text-destructive mt-2">Content will auto-escalate when timer expires.</p>
                )}
              </div>
            )}

            {/* Content preview */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium font-display text-card-foreground">Content</h3>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border">
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
            </div>

            {/* Risk analysis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium font-display text-card-foreground">Risk Analysis</h3>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${risk.bg} ${risk.color} border-none text-xs`}>{risk.label}</Badge>
                    <span className="text-2xl font-bold font-display text-card-foreground">
                      {(item.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.riskScore * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${risk.barColor}`}
                  />
                </div>
                {item.flaggedTerms.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Flagged terms:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.flaggedTerms.map((term) => (
                        <span
                          key={term}
                          className="text-xs px-3 py-1 rounded-full bg-destructive/10 text-destructive font-medium"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit trail */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium font-display text-card-foreground">Audit Trail</h3>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                {item.auditLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="text-xs">
                      <span className="text-muted-foreground font-mono">{entry.timestamp.toLocaleTimeString()}</span>
                      <span className="text-card-foreground ml-2">{entry.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewer note */}
            {isPending && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium font-display text-card-foreground">Reviewer Note (optional)</h3>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note explaining your decision..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                />
              </div>
            )}

            {/* Confirmation step */}
            <AnimatePresence mode="wait">
              {confirmAction ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-xl p-4 border ${
                    confirmAction === "approved"
                      ? "bg-teal/5 border-teal/20"
                      : confirmAction === "rejected"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-coral/5 border-coral/20"
                  }`}
                >
                  <p className="text-sm font-medium text-card-foreground mb-1">
                    Confirm{" "}
                    <span
                      className={
                        confirmAction === "approved"
                          ? "text-teal"
                          : confirmAction === "rejected"
                          ? "text-destructive"
                          : "text-coral"
                      }
                    >
                      {confirmAction}
                    </span>
                    ?
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {confirmAction === "approved" && "This content will be published and visible to users."}
                    {confirmAction === "rejected" && "This content will be permanently blocked."}
                    {confirmAction === "escalated" && "This content will be sent to a senior moderator."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={
                        confirmAction === "approved" ? "ocean" : confirmAction === "rejected" ? "destructive" : "sunset"
                      }
                      className="rounded-lg"
                      onClick={handleConfirm}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Yes, {confirmAction === "approved" ? "Approve" : confirmAction === "rejected" ? "Reject" : "Escalate"}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setConfirmAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                isPending && (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-3"
                  >
                    <Button
                      variant="ocean"
                      className="flex-1 rounded-xl py-6 text-sm"
                      onClick={() => setConfirmAction("approved")}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Approve
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-xl py-6 text-sm"
                      onClick={() => setConfirmAction("rejected")}
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="sunset"
                      className="flex-1 rounded-xl py-6 text-sm"
                      onClick={() => setConfirmAction("escalated")}
                    >
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Escalate
                    </Button>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Already reviewed */}
            {!isPending && (
              <div className="text-center py-4">
                <Badge
                  className={`text-sm px-4 py-2 ${
                    item.status === "approved"
                      ? "bg-teal text-primary-foreground"
                      : item.status === "rejected"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-coral text-primary-foreground"
                  } border-none`}
                >
                  {item.status === "approved" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                  {item.status === "rejected" && <XCircle className="w-4 h-4 mr-1" />}
                  {item.status === "escalated" && <AlertTriangle className="w-4 h-4 mr-1" />}
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
                {item.reviewerNote && (
                  <p className="text-sm text-muted-foreground mt-3 italic">"{item.reviewerNote}"</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApprovalPanel;
