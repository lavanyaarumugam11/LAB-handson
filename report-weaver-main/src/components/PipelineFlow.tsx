import { ArrowRight } from "lucide-react";

type AgentStatus = "idle" | "active" | "done";

interface PipelineFlowProps {
  activeAgent: number;
  statuses: AgentStatus[];
}

const activeStyles = [
  "bg-researcher/20 text-researcher border border-researcher/40 scale-110",
  "bg-writer/20 text-writer border border-writer/40 scale-110",
  "bg-editor/20 text-editor border border-editor/40 scale-110",
];
const doneStyles = [
  "bg-researcher/10 text-researcher/80 border border-researcher/20",
  "bg-writer/10 text-writer/80 border border-writer/20",
  "bg-editor/10 text-editor/80 border border-editor/20",
];
const dotActive = ["bg-researcher", "bg-writer", "bg-editor"];
const arrowColors = ["text-researcher", "text-writer", "text-editor"];

const PipelineFlow = ({ activeAgent, statuses }: PipelineFlowProps) => {
  const agents = ["Researcher", "Writer", "Editor"];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mt-6">
      {agents.map((name, i) => (
        <div key={name} className="flex items-center gap-2 md:gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-500 ${
              statuses[i] === "active"
                ? activeStyles[i]
                : statuses[i] === "done"
                ? doneStyles[i]
                : "glass text-muted-foreground"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                statuses[i] === "active"
                  ? `${dotActive[i]} animate-pulse-glow`
                  : statuses[i] === "done"
                  ? dotActive[i]
                  : "bg-muted-foreground/30"
              }`}
            />
            {name}
          </div>
          {i < 2 && (
            <ArrowRight
              className={`w-4 h-4 transition-all duration-500 ${
                statuses[i] === "done" && statuses[i + 1] !== "idle"
                  ? arrowColors[i + 1]
                  : "text-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PipelineFlow;
