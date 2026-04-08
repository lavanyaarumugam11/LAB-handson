import { cn } from "@/lib/utils";
import type { RouteResult } from "@/lib/sentiment";

interface WorkflowGraphProps {
  result: RouteResult | null;
  isAnalyzing: boolean;
}

const nodes = [
  { id: 'input', label: 'User Query', x: 50, y: 50, icon: '📝' },
  { id: 'sentiment', label: 'Sentiment Analysis', x: 50, y: 150, icon: '🧠' },
  { id: 'router', label: 'Conditional Router', x: 50, y: 250, icon: '🔀' },
  { id: 'positive', label: 'Positive Handler', x: 0, y: 360, icon: '😊' },
  { id: 'neutral', label: 'Neutral Handler', x: 50, y: 360, icon: '😐' },
  { id: 'negative', label: 'Escalation Handler', x: 100, y: 360, icon: '🚨' },
];

function getActiveNodes(result: RouteResult | null, isAnalyzing: boolean): Set<string> {
  if (!result && !isAnalyzing) return new Set();
  if (isAnalyzing) return new Set(['input', 'sentiment']);
  if (!result) return new Set();
  const active = new Set(['input', 'sentiment', 'router']);
  active.add(result.route);
  return active;
}

function getActiveEdge(result: RouteResult | null): string | null {
  if (!result) return null;
  return result.route;
}

export default function WorkflowGraph({ result, isAnalyzing }: WorkflowGraphProps) {
  const activeNodes = getActiveNodes(result, isAnalyzing);
  const activeEdge = getActiveEdge(result);

  const routeColor = (route: string) => {
    if (route === 'positive') return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (route === 'negative') return 'text-red-400 border-red-500/50 bg-red-500/10';
    return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
  };

  return (
    <div className="relative w-full" style={{ minHeight: 440 }}>
      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: 440 }}>
        {/* input → sentiment */}
        <line x1="50%" y1="85" x2="50%" y2="140" stroke={activeNodes.has('sentiment') ? '#818cf8' : '#334155'} strokeWidth={2} />
        {/* sentiment → router */}
        <line x1="50%" y1="195" x2="50%" y2="240" stroke={activeNodes.has('router') ? '#818cf8' : '#334155'} strokeWidth={2} />
        {/* router → positive */}
        <line x1="50%" y1="295" x2="20%" y2="350" stroke={activeEdge === 'positive' ? '#34d399' : '#334155'} strokeWidth={2} />
        {/* router → neutral */}
        <line x1="50%" y1="295" x2="50%" y2="350" stroke={activeEdge === 'neutral' ? '#fbbf24' : '#334155'} strokeWidth={2} />
        {/* router → negative */}
        <line x1="50%" y1="295" x2="80%" y2="350" stroke={activeEdge === 'negative' ? '#f87171' : '#334155'} strokeWidth={2} />
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const isActive = activeNodes.has(node.id);
        const isRouteNode = ['positive', 'neutral', 'negative'].includes(node.id);
        const left = node.x === 0 ? '20%' : node.x === 100 ? '80%' : '50%';

        return (
          <div
            key={node.id}
            className={cn(
              "absolute -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-500",
              isActive && isRouteNode
                ? routeColor(node.id)
                : isActive
                ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-500/20'
                : 'border-border/40 bg-card/50 text-muted-foreground'
            )}
            style={{ left, top: node.y }}
          >
            <span className="text-base">{node.icon}</span>
            <span className="whitespace-nowrap">{node.label}</span>
            {isActive && isAnalyzing && node.id === 'sentiment' && (
              <span className="ml-1 animate-pulse text-xs">⏳</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
