import { useState, useEffect, useCallback } from "react";
import { Search, Sparkles, ArrowRight, Bot, BookOpen, Pencil, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentCard from "@/components/AgentCard";
import PipelineFlow from "@/components/PipelineFlow";
import OutputPanel from "@/components/OutputPanel";
import ParticleField from "@/components/ParticleField";

const SAMPLE_QUERIES = [
  "Explain how retrieval-augmented generation (RAG) works and why it reduces hallucinations",
  "What are the key differences between transformers and RNNs in NLP?",
  "How do multi-agent systems improve collaborative AI reasoning?",
];

const MOCK_RESEARCH = `• RAG combines a retriever with a generator to ground outputs in external knowledge, reducing hallucinations [Doc 4]
• The retriever component uses dense passage retrieval to find relevant documents from a knowledge base [Doc 4]
• Transformer models (Vaswani et al., 2017) form the backbone of both retriever and generator components [Doc 1]
• ChromaDB serves as the vector store, supporting persistent storage and metadata filtering [Doc 6]
• Without retrieval grounding, large models like GPT-3 can generate plausible but unfounded claims [Doc 3]
• LangChain provides abstractions for building RAG pipelines including chains, agents, and memory [Doc 5]
• Multi-agent architectures can wrap RAG in a modular pipeline where retrieval is specialized [Doc 7]
• Gap: Retrieved docs do not cover specific hallucination metrics or benchmarks.`;

const MOCK_DRAFT = `# Retrieval-Augmented Generation: Grounding LLMs in Facts

## Summary
Retrieval-Augmented Generation (RAG) is an architecture that pairs a document retrieval system with a generative language model to produce outputs grounded in verified external knowledge, significantly reducing the hallucination problem inherent in standalone LLMs.

## Background
Modern language models, built on the transformer architecture introduced by Vaswani et al. in 2017 [Doc 1], have demonstrated remarkable text generation capabilities. However, models like GPT-3 with 175 billion parameters [Doc 3] can generate plausible but factually incorrect statements—a phenomenon known as hallucination.

## Key Findings
RAG addresses this by introducing a retrieval step before generation [Doc 4]. The system queries a vector database (such as ChromaDB [Doc 6]) using dense passage retrieval to find relevant source documents. These retrieved documents are then provided as context to the generator, constraining its output to information supported by evidence.

## Analysis
The modular nature of RAG makes it well-suited for integration with frameworks like LangChain [Doc 5] and multi-agent architectures [Doc 7]. By separating retrieval from generation, each component can be independently optimized, tested, and scaled.

## Conclusion
RAG represents a practical and effective approach to reducing hallucinations in LLM applications by grounding generation in retrieved evidence.`;

const MOCK_FINAL = `# Retrieval-Augmented Generation: Grounding LLMs in Facts

## Summary
Retrieval-Augmented Generation (RAG) pairs a document retrieval system with a generative language model, producing outputs anchored in verified external knowledge. This architecture directly addresses the hallucination problem that plagues standalone LLMs.

## Background
The transformer architecture (Vaswani et al., 2017) [Doc 1] revolutionized natural language processing by enabling parallel sequence processing through self-attention mechanisms. While subsequent models such as GPT-3 (175B parameters) [Doc 3] achieved remarkable generative capabilities, they remain prone to producing plausible yet factually incorrect outputs—hallucinations.

## Key Findings
RAG mitigates hallucinations by introducing a retrieval stage before generation [Doc 4]:

1. **Query encoding** — The user's query is converted into a dense vector representation.
2. **Document retrieval** — A vector database (e.g., ChromaDB [Doc 6]) returns the most semantically similar source documents.
3. **Grounded generation** — Retrieved documents are injected as context, constraining the model's output to evidence-backed claims.

## Analysis
RAG's modular design integrates naturally with orchestration frameworks such as LangChain [Doc 5] and multi-agent pipelines [Doc 7]. Each component—retriever, generator, and orchestrator—can be independently optimized, enabling targeted improvements without system-wide regressions.

## Conclusion
RAG is the most practical current approach to reducing LLM hallucinations. By grounding every generated claim in retrieved evidence, it transforms language models from creative text generators into reliable knowledge synthesis tools.

---
*Editor's Notes: Restructured Key Findings as a numbered list for clarity. Tightened prose throughout, removing ~60 words of redundancy. All claims verified against research notes. No unsupported assertions detected.*`;

type AgentStatus = "idle" | "active" | "done";

const Index = () => {
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<number>(-1);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(["idle", "idle", "idle"]);
  const [outputs, setOutputs] = useState<string[]>(["", "", ""]);
  const [selectedOutput, setSelectedOutput] = useState<number>(-1);
  const [typingText, setTypingText] = useState("");
  const [showResults, setShowResults] = useState(false);

  const mockOutputs = [MOCK_RESEARCH, MOCK_DRAFT, MOCK_FINAL];

  const typeText = useCallback((text: string, onComplete: () => void) => {
    let i = 0;
    setTypingText("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypingText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 8);
    return () => clearInterval(interval);
  }, []);

  const runPipeline = useCallback(async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setShowResults(true);
    setSelectedOutput(-1);
    setOutputs(["", "", ""]);
    setAgentStatuses(["idle", "idle", "idle"]);

    for (let i = 0; i < 3; i++) {
      setActiveAgent(i);
      setAgentStatuses(prev => prev.map((s, idx) => idx === i ? "active" : s));
      
      await new Promise<void>(resolve => {
        const cleanup = typeText(mockOutputs[i], () => {
          setOutputs(prev => prev.map((o, idx) => idx === i ? mockOutputs[i] : o));
          setAgentStatuses(prev => prev.map((s, idx) => idx === i ? "done" : s));
          setSelectedOutput(i);
          resolve();
        });
      });

      if (i < 2) await new Promise(r => setTimeout(r, 600));
    }

    setActiveAgent(-1);
    setIsRunning(false);
  }, [query, typeText]);

  const scrollToResults = () => {
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleField />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="animate-fade-in text-center max-w-4xl mx-auto">
          {/* Logo/Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Multi-Agent Research Pipeline</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient-hero">3 AI Agents.</span>
            <br />
            <span className="text-foreground">One Polished Report.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Watch a Researcher, Writer, and Editor collaborate in real-time to transform your query into a grounded, structured report.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <div className="glass-strong rounded-2xl p-2 flex items-center gap-2 hover:border-primary/30 transition-colors duration-300">
              <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isRunning && runPipeline()}
                placeholder="Ask a research question..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3 px-2 text-base"
              />
              <Button
                variant="hero"
                size="lg"
                onClick={runPipeline}
                disabled={isRunning || !query.trim()}
                className="rounded-xl px-6"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Run Pipeline
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sample queries */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {SAMPLE_QUERIES.map((sq, i) => (
              <button
                key={i}
                onClick={() => setQuery(sq)}
                className="text-xs px-3 py-1.5 rounded-full glass text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
              >
                {sq.slice(0, 50)}...
              </button>
            ))}
          </div>

          {/* Agent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <AgentCard
              icon={BookOpen}
              title="Researcher"
              description="Retrieves & synthesizes evidence from ChromaDB"
              gradient="researcher"
              status={agentStatuses[0]}
              delay={0}
            />
            <AgentCard
              icon={Pencil}
              title="Writer"
              description="Drafts structured, well-organized reports"
              gradient="writer"
              status={agentStatuses[1]}
              delay={100}
            />
            <AgentCard
              icon={CheckCircle2}
              title="Editor"
              description="Refines clarity, accuracy & coherence"
              gradient="editor"
              status={agentStatuses[2]}
              delay={200}
            />
          </div>

          {/* Pipeline Flow Visualization */}
          <PipelineFlow activeAgent={activeAgent} statuses={agentStatuses} />

          {showResults && (
            <button onClick={scrollToResults} className="mt-8 animate-bounce-subtle text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="w-6 h-6" />
            </button>
          )}
        </div>
      </section>

      {/* Results Section */}
      {showResults && (
        <section id="results" className="relative z-10 px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            {/* Tab selector */}
            <div className="flex gap-2 mb-6 justify-center">
              {["Research Notes", "Draft Report", "Final Report"].map((label, i) => (
                <button
                  key={i}
                  onClick={() => outputs[i] && setSelectedOutput(i)}
                  disabled={!outputs[i]}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedOutput === i
                      ? i === 0
                        ? "bg-researcher/20 text-researcher border border-researcher/30"
                        : i === 1
                        ? "bg-writer/20 text-writer border border-writer/30"
                        : "bg-editor/20 text-editor border border-editor/30"
                      : outputs[i]
                      ? "glass text-muted-foreground hover:text-foreground"
                      : "glass text-muted-foreground/30 cursor-not-allowed"
                  }`}
                >
                  {label}
                  {agentStatuses[i] === "active" && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
                  {agentStatuses[i] === "done" && <CheckCircle2 className="inline w-3 h-3 ml-2" />}
                </button>
              ))}
            </div>

            {/* Output Panel */}
            <OutputPanel
              content={
                activeAgent >= 0 && selectedOutput === activeAgent
                  ? typingText
                  : outputs[selectedOutput] || ""
              }
              agentIndex={selectedOutput}
              isTyping={activeAgent === selectedOutput}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
