import { LucideIcon, Loader2, CheckCircle2 } from "lucide-react";

type AgentStatus = "idle" | "active" | "done";

interface AgentCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: "researcher" | "writer" | "editor";
  status: AgentStatus;
  delay: number;
}

const gradientClasses = {
  researcher: {
    border: "border-researcher/30",
    shadow: "shadow-researcher",
    text: "text-gradient-researcher",
    bg: "bg-researcher/10",
    dot: "bg-researcher",
  },
  writer: {
    border: "border-writer/30",
    shadow: "shadow-writer",
    text: "text-gradient-writer",
    bg: "bg-writer/10",
    dot: "bg-writer",
  },
  editor: {
    border: "border-editor/30",
    shadow: "shadow-editor",
    text: "text-gradient-editor",
    bg: "bg-editor/10",
    dot: "bg-editor",
  },
};

const AgentCard = ({ icon: Icon, title, description, gradient, status, delay }: AgentCardProps) => {
  const g = gradientClasses[gradient];
  const isActive = status === "active";
  const isDone = status === "done";

  return (
    <div
      className={`group relative glass rounded-2xl p-6 transition-all duration-500 hover:scale-105 ${
        isActive ? `${g.border} ${g.shadow}` : isDone ? `${g.border} border-opacity-50` : "hover:border-muted-foreground/20"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow ring when active */}
      {isActive && (
        <div className={`absolute inset-0 rounded-2xl ${g.bg} animate-pulse-glow`} />
      )}

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl ${g.bg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${isActive || isDone ? `text-${gradient}` : "text-muted-foreground"}`} />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className={`text-lg font-semibold ${isActive || isDone ? g.text : "text-foreground"}`}>
            {title}
          </h3>
          {isActive && <Loader2 className={`w-4 h-4 animate-spin text-${gradient}`} />}
          {isDone && <CheckCircle2 className={`w-4 h-4 text-${gradient}`} />}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isActive ? `${g.dot} animate-pulse-glow` : isDone ? g.dot : "bg-muted-foreground/30"
          }`} />
          <span className="text-xs text-muted-foreground">
            {isActive ? "Processing..." : isDone ? "Complete" : "Waiting"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
