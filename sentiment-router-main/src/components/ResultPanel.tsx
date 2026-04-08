import type { RouteResult } from "@/lib/sentiment";
import { cn } from "@/lib/utils";

interface ResultPanelProps {
  result: RouteResult;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const { sentiment, route, action, response } = result;

  const routeStyles = {
    positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    negative: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
    neutral: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  };

  const s = routeStyles[route];

  return (
    <div className={cn("rounded-xl border p-5 space-y-4 transition-all duration-300", s.bg, s.border)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-widest", s.text)}>
          {route} sentiment
        </span>
        <span className={cn("text-xs font-mono px-2 py-1 rounded-md", s.badge)}>
          {(sentiment.score * 100).toFixed(0)}% confidence
        </span>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Confidence</span>
          <span>Threshold: {(result.confidenceThreshold * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", {
              'bg-emerald-500': route === 'positive',
              'bg-red-500': route === 'negative',
              'bg-amber-500': route === 'neutral',
            })}
            style={{ width: `${sentiment.score * 100}%` }}
          />
        </div>
      </div>

      {/* Route action */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Routed to</p>
        <p className={cn("text-sm font-semibold", s.text)}>{action}</p>
      </div>

      {/* Response */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Response</p>
        <p className="text-sm text-foreground/80 leading-relaxed">{response}</p>
      </div>
    </div>
  );
}
