import { Check, Loader2, FileCode, GitBranch, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface Step {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  type: "analysis" | "coding" | "testing" | "deployment";
  files?: string[];
}

interface ExecutionStepProps {
  step: Step;
  index: number;
}

const getIcon = (type: Step["type"]) => {
  switch (type) {
    case "analysis":
      return GitBranch;
    case "coding":
      return FileCode;
    case "testing":
    case "deployment":
      return Terminal;
  }
};

const getStatusColor = (status: StepStatus) => {
  switch (status) {
    case "completed":
      return "text-accent border-accent/50";
    case "running":
      return "text-primary border-primary/50 glow-border";
    case "error":
      return "text-destructive border-destructive/50";
    default:
      return "text-muted-foreground border-border";
  }
};

export const ExecutionStep = ({ step, index }: ExecutionStepProps) => {
  const Icon = getIcon(step.type);
  const statusColor = getStatusColor(step.status);

  return (
    <Card className={`p-4 bg-card border transition-all duration-300 ${statusColor}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          {step.status === "completed" ? (
            <Check className="h-5 w-5 text-accent" />
          ) : step.status === "running" ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground code-font">STEP {index + 1}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground code-font">
              {step.type.toUpperCase()}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {step.files && step.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {step.files.map((file, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded bg-secondary border border-border code-font text-accent"
                >
                  {file}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
