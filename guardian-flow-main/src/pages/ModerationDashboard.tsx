import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ShieldCheck, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModeration, type ContentItem } from "@/hooks/useModeration";
import PipelineVisualizer from "@/components/moderation/PipelineVisualizer";
import ReviewQueue from "@/components/moderation/ReviewQueue";
import AuditLog from "@/components/moderation/AuditLog";
import StatsOverview from "@/components/moderation/StatsOverview";
import ApprovalPanel from "@/components/moderation/ApprovalPanel";
import { Link } from "react-router-dom";

const EXAMPLE_SAFE = [
  "Great article about machine learning trends!",
  "The new product launch looks amazing.",
  "I love the redesign — clean and modern.",
];

const EXAMPLE_RISKY = [
  "This is hate speech and spam content",
  "Scam alert: send money now before it's too late",
  "Violence and threats are unacceptable here",
];

const ModerationDashboard = () => {
  const { items, submitContent, reviewContent, pendingReview, allAuditLogs } = useModeration();
  const [inputText, setInputText] = useState("");
  const [lastPipelineStep, setLastPipelineStep] = useState(-1);
  const [lastStatus, setLastStatus] = useState<string | undefined>();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    const result = submitContent(inputText.trim());

    setLastPipelineStep(0);
    setTimeout(() => setLastPipelineStep(1), 400);
    setTimeout(() => setLastPipelineStep(2), 800);
    setTimeout(() => {
      if (result.status === "auto_approved") {
        setLastPipelineStep(4);
        setLastStatus("auto_approved");
      } else {
        setLastPipelineStep(3);
        setLastStatus("awaiting_review");
        // Auto-open approval panel for flagged content
        setSelectedItem(result);
      }
    }, 1200);

    setInputText("");
  };

  const handleDecision = (id: string, decision: "approved" | "rejected" | "escalated", note?: string) => {
    reviewContent(id, decision, note);
    // Update selected item to reflect the new status
    setSelectedItem((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, status: decision, reviewedAt: new Date(), reviewer: "Human Moderator", reviewerNote: note };
    });
    // Animate pipeline to final step
    setLastPipelineStep(4);
    setLastStatus(decision);
    // Close panel after a brief delay
    setTimeout(() => setSelectedItem(null), 800);
  };

  const handleSelectItem = (item: ContentItem) => {
    // Get the latest version from items
    const latest = items.find((i) => i.id === item.id) || item;
    setSelectedItem(latest);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 glass sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl gradient-vibrant flex items-center justify-center shadow-glow-primary">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">HITL Moderation</h1>
              <p className="text-xs text-muted-foreground">Human-in-the-Loop Content Review</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingReview.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 rounded-full bg-amber/10 text-amber text-xs font-medium"
              >
                {pendingReview.length} pending
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <StatsOverview items={items} />

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="text-sm font-medium font-display text-muted-foreground mb-2">Pipeline Flow</h2>
          <PipelineVisualizer activeStep={lastPipelineStep} status={lastStatus} />
        </div>

        {/* Submit Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <h2 className="text-sm font-medium font-display text-muted-foreground mb-4">Submit Content</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type user-generated content to moderate..."
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <Button variant="vibrant" onClick={handleSubmit} disabled={!inputText.trim()} className="rounded-xl px-6">
              <Send className="w-4 h-4 mr-2" /> Submit
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Quick examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_SAFE.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInputText(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary/30 text-secondary hover:bg-secondary/50 transition-colors"
                >
                  ✓ {ex.slice(0, 30)}…
                </button>
              ))}
              {EXAMPLE_RISKY.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInputText(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  ⚠ {ex.slice(0, 30)}…
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="queue">
              Review Queue
              {pendingReview.length > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-amber text-primary-foreground text-[10px] inline-flex items-center justify-center">
                  {pendingReview.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="queue">
            <ReviewQueue items={pendingReview} onSelectItem={handleSelectItem} />
          </TabsContent>
          <TabsContent value="all">
            <ReviewQueue items={items} onSelectItem={handleSelectItem} />
          </TabsContent>
          <TabsContent value="audit">
            <div className="bg-card rounded-2xl p-6 shadow-soft">
              <AuditLog logs={allAuditLogs} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Approval Panel Modal */}
      {selectedItem && (
        <ApprovalPanel
          item={selectedItem}
          onDecision={handleDecision}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default ModerationDashboard;
