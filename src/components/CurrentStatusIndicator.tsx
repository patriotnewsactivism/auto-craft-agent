import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface CurrentStatusIndicatorProps {
  currentTask: string | null;
  progress: number;
  status: "idle" | "analyzing" | "generating" | "validating" | "learning" | "error" | "completed";
  details?: string;
  estimatedTimeRemaining?: number;
}

export const CurrentStatusIndicator = ({
  currentTask,
  progress,
  status,
  details,
  estimatedTimeRemaining,
}: CurrentStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "analyzing":
        return {
          icon: <Activity className="h-5 w-5 text-blue-500 animate-pulse" />,
          label: "Analyzing Task",
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
        };
      case "generating":
        return {
          icon: <Activity className="h-5 w-5 text-purple-500 animate-pulse" />,
          label: "Generating Code",
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
        };
      case "validating":
        return {
          icon: <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />,
          label: "Validating",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
        };
      case "learning":
        return {
          icon: <Activity className="h-5 w-5 text-green-500 animate-pulse" />,
          label: "Learning & Reflecting",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          label: "Completed",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          label: "Error",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
        };
      default:
        return {
          icon: <Activity className="h-5 w-5 text-muted-foreground" />,
          label: "Idle",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
        };
    }
  };

  const config = getStatusConfig();

  if (status === "idle" && !currentTask) {
    return null;
  }

  return (
    <Card className={`p-4 border-2 ${config.borderColor} ${config.bgColor}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <h3 className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </h3>
              {currentTask && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentTask}
                </p>
              )}
            </div>
          </div>
          
          <Badge variant="outline" className={config.color}>
            {progress}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Details */}
        {details && (
          <p className="text-xs text-muted-foreground border-t border-border pt-2">
            {details}
          </p>
        )}

        {/* Estimated Time */}
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Est. {estimatedTimeRemaining < 60
                ? `${estimatedTimeRemaining}s`
                : `${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s`} remaining
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
