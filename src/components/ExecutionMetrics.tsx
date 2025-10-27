import { Card } from "@/components/ui/card";
import { Clock, FileCode, CheckCircle, AlertCircle } from "lucide-react";

interface MetricsProps {
  duration: number;
  filesGenerated: number;
  stepsCompleted: number;
  errors: number;
}

export const ExecutionMetrics = ({ duration, filesGenerated, stepsCompleted, errors }: MetricsProps) => {
  const metrics = [
    {
      label: "Duration",
      value: `${duration}s`,
      icon: Clock,
      color: "text-primary"
    },
    {
      label: "Files Generated",
      value: filesGenerated,
      icon: FileCode,
      color: "text-accent"
    },
    {
      label: "Steps Completed",
      value: stepsCompleted,
      icon: CheckCircle,
      color: "text-accent"
    },
    {
      label: "Errors",
      value: errors,
      icon: AlertCircle,
      color: errors > 0 ? "text-destructive" : "text-muted-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4 bg-secondary border-border">
          <div className="flex items-center gap-2 mb-2">
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
            <span className="text-xs text-muted-foreground">{metric.label}</span>
          </div>
          <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
        </Card>
      ))}
    </div>
  );
};
