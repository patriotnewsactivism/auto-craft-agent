import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
}

interface ExecutionLogsProps {
  logs: LogEntry[];
}

const getLevelColor = (level: LogEntry["level"]) => {
  switch (level) {
    case "success":
      return "text-accent";
    case "error":
      return "text-destructive";
    case "warning":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
};

export const ExecutionLogs = ({ logs }: ExecutionLogsProps) => {
  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="font-semibold code-font">Execution Logs</span>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-2 code-font text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No logs yet. Start a task to see execution details.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {log.timestamp}
                </span>
                <span className={`text-xs font-semibold ${getLevelColor(log.level)}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-foreground flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
