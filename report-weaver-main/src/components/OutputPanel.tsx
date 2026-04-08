interface OutputPanelProps {
  content: string;
  agentIndex: number;
  isTyping: boolean;
}

const borderColors = [
  "border-researcher/30",
  "border-writer/30",
  "border-editor/30",
];

const OutputPanel = ({ content, agentIndex, isTyping }: OutputPanelProps) => {
  if (agentIndex < 0 || !content) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted-foreground text-sm">Pipeline output will appear here...</p>
      </div>
    );
  }

  return (
    <div className={`glass-strong rounded-2xl p-6 md:p-8 animate-fade-in border ${borderColors[agentIndex]}`}>
      <pre className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-foreground/90 font-sans">
        {content}
        {isTyping && (
          <span className="inline-block w-2 h-5 bg-primary/80 animate-pulse-glow ml-0.5 align-text-bottom" />
        )}
      </pre>
    </div>
  );
};

export default OutputPanel;
