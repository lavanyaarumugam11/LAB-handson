import { useState, useCallback } from "react";

export type ContentStatus =
  | "pending"
  | "moderating"
  | "auto_approved"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "escalated"
  | "timed_out";

export interface AuditEntry {
  timestamp: Date;
  event: string;
  contentId: string;
  status: ContentStatus;
}

export interface ContentItem {
  id: string;
  text: string;
  status: ContentStatus;
  riskScore: number;
  flaggedTerms: string[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewer?: string;
  reviewerNote?: string;
  auditLog: AuditEntry[];
}

const FLAGGED_TERMS = ["hate", "spam", "scam", "violence", "kill", "threat", "abuse", "attack", "fraud", "phishing"];
const SAFE_TERMS = ["great", "love", "amazing", "beautiful", "wonderful", "thanks", "helpful", "nice", "good", "excellent"];
const AUTO_APPROVE_THRESHOLD = 0.2;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function moderateContent(text: string): { riskScore: number; flaggedTerms: string[] } {
  const lower = text.toLowerCase();
  const matched = FLAGGED_TERMS.filter((t) => lower.includes(t));
  const safeMatched = SAFE_TERMS.filter((t) => lower.includes(t));

  // Base risk of 0.4 — most content goes to human review
  // Flagged terms increase risk, safe terms decrease it
  let riskScore = 0.4 + matched.length * 0.25 - safeMatched.length * 0.15;
  riskScore = Math.max(0, Math.min(riskScore, 1.0));

  return { riskScore, flaggedTerms: matched };
}

export function useModeration() {
  const [items, setItems] = useState<ContentItem[]>([]);

  const addEntry = (item: ContentItem, event: string, status: ContentStatus): AuditEntry => ({
    timestamp: new Date(),
    event,
    contentId: item.id,
    status,
  });

  const submitContent = useCallback((text: string) => {
    const id = generateId();
    const { riskScore, flaggedTerms } = moderateContent(text);

    const status: ContentStatus = "awaiting_review";

    const item: ContentItem = {
      id,
      text,
      status,
      riskScore,
      flaggedTerms,
      submittedAt: new Date(),
      auditLog: [],
    };

    item.auditLog.push(addEntry(item, "content_submitted", "pending"));
    item.auditLog.push(addEntry(item, `moderated: score=${riskScore.toFixed(2)}, terms=[${flaggedTerms.join(", ")}]`, "moderating"));
    item.auditLog.push(addEntry(item, "flagged_for_human_review", status));

    setItems((prev) => [item, ...prev]);
    return item;
  }, []);

  const reviewContent = useCallback((id: string, decision: "approved" | "rejected" | "escalated", note?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = {
          ...item,
          status: decision as ContentStatus,
          reviewedAt: new Date(),
          reviewer: "Human Moderator",
          reviewerNote: note || undefined,
          auditLog: [
            ...item.auditLog,
            {
              timestamp: new Date(),
              event: `human_decision: ${decision}${note ? ` — "${note}"` : ""}`,
              contentId: id,
              status: decision as ContentStatus,
            },
          ],
        };
        return updated;
      })
    );
  }, []);

  const pendingReview = items.filter((i) => i.status === "awaiting_review");
  const allAuditLogs = items.flatMap((i) => i.auditLog).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return { items, submitContent, reviewContent, pendingReview, allAuditLogs };
}
