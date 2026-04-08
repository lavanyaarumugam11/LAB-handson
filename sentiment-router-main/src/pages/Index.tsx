import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import WorkflowGraph from "@/components/WorkflowGraph";
import ResultPanel from "@/components/ResultPanel";
import QueryLog from "@/components/QueryLog";
import { routeQuery, type RouteResult } from "@/lib/sentiment";

const SAMPLE_QUERIES = [
  "I love this product! It's absolutely amazing and works perfectly.",
  "This is terrible. The service is broken and nobody responds.",
  "I'd like to know more about your return policy.",
  "Great experience but shipping was a bit slow.",
];

export default function Index() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<Array<{ query: string; result: RouteResult; timestamp: Date }>>([]);

  const analyze = useCallback((text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    // Simulate processing delay for visual effect
    setTimeout(() => {
      const r = routeQuery(text);
      setResult(r);
      setIsAnalyzing(false);
      setLogs((prev) => [{ query: text, result: r, timestamp: new Date() }, ...prev]);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🔀</span>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              LangGraph Sentiment Router
            </h1>
            <p className="text-xs text-muted-foreground">
              Conditional branching workflow · Sentiment-based query routing
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input + Results */}
          <div className="space-y-6">
            {/* Query input */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Enter Query
              </label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a customer query to analyze sentiment..."
                className="min-h-[100px] bg-card/50 border-border/50 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    analyze(query);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => analyze(query)}
                  disabled={!query.trim() || isAnalyzing}
                  className="px-6"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze & Route'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setResult(null); }}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Sample queries */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Try a sample:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUERIES.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(sq); analyze(sq); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/40 bg-card/30 text-muted-foreground hover:text-foreground hover:border-border transition-colors text-left"
                  >
                    {sq.length > 50 ? sq.slice(0, 50) + '…' : sq}
                  </button>
                ))}
              </div>
            </div>

            {/* Result panel */}
            {result && <ResultPanel result={result} />}

            {/* Log */}
            <QueryLog logs={logs} />
          </div>

          {/* Right: Workflow visualization */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Workflow Graph
            </label>
            <div className="border border-border/40 rounded-xl bg-card/20 p-6">
              <WorkflowGraph result={result} isAnalyzing={isAnalyzing} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Active Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Neutral</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Negative</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
