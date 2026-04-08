import type { RouteResult } from "@/lib/sentiment";
import { cn } from "@/lib/utils";

interface QueryLogProps {
  logs: Array<{ query: string; result: RouteResult; timestamp: Date }>;
}

export default function QueryLog({ logs }: QueryLogProps) {
  if (logs.length === 0) return null;

  const routeBadge = (route: string) => {
    const styles = {
      positive: 'bg-emerald-500/20 text-emerald-300',
      negative: 'bg-red-500/20 text-red-300',
      neutral: 'bg-amber-500/20 text-amber-300',
    };
    return styles[route as keyof typeof styles] || styles.neutral;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Routing Log ({logs.length})
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 text-xs border border-border/30 rounded-lg p-3 bg-card/30">
            <span className={cn("px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0", routeBadge(log.result.route))}>
              {log.result.route.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-foreground/80 truncate">{log.query}</p>
              <p className="text-muted-foreground mt-0.5">
                {log.result.sentiment.score >= 0.7 ? '✓' : '⚠'} {(log.result.sentiment.score * 100).toFixed(0)}% → {log.result.action}
              </p>
            </div>
            <span className="text-muted-foreground/50 shrink-0">
              {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
