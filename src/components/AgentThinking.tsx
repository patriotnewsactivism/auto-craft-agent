import { Card } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";

interface ThinkingStep {
  id: string;
  thought: string;
  timestamp: string;
}

interface AgentThinkingProps {
  steps: ThinkingStep[];
  isThinking: boolean;
}

export const AgentThinking = ({ steps, isThinking }: AgentThinkingProps) => {
  return (
    <Card className="p-4 bg-card border-primary/30 glow-border">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Agent Reasoning</h3>
        {isThinking && <Loader2 className="h-4 w-4 text-primary animate-spin ml-auto" />}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {steps.map((step) => (
          <div key={step.id} className="text-sm">
            <span className="text-xs text-muted-foreground code-font">{step.timestamp}</span>
            <p className="text-foreground mt-1">{step.thought}</p>
          </div>
        ))}
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Waiting for task...</p>
        )}
      </div>
    </Card>
  );
};
