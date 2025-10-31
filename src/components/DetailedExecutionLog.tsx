import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Clock,
  Filter,
  Download
} from "lucide-react";

export interface ExecutionLogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "success" | "warning" | "error" | "debug";
  category: string;
  message: string;
  details?: string;
  data?: any;
}

interface DetailedExecutionLogProps {
  logs: ExecutionLogEntry[];
  isExecuting: boolean;
}

export const DetailedExecutionLog = ({ logs, isExecuting }: DetailedExecutionLogProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ExecutionLogEntry | null>(null);

  const filteredLogs = logs.filter(log => 
    filterLevel === "all" || log.level === filterLevel
  );

  const getLevelIcon = (level: ExecutionLogEntry["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "debug":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: ExecutionLogEntry["level"]) => {
    switch (level) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "debug":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.category}]\n${log.message}${log.details ? '\nDetails: ' + log.details : ''}${log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''}\n`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-log-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const levelCounts = {
    all: logs.length,
    info: logs.filter(l => l.level === "info").length,
    success: logs.filter(l => l.level === "success").length,
    warning: logs.filter(l => l.level === "warning").length,
    error: logs.filter(l => l.level === "error").length,
    debug: logs.filter(l => l.level === "debug").length,
  };

  return (
    <Card className="p-4 bg-card border-primary/30">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Detailed Execution Log</h3>
            <Badge variant="outline" className="text-xs">
              {filteredLogs.length} entries
            </Badge>
            {isExecuting && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 animate-pulse" />
                <span>Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {Object.entries(levelCounts).map(([level, count]) => (
            <Button
              key={level}
              variant={filterLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterLevel(level)}
              className="text-xs h-7"
              disabled={count === 0}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
              <Badge variant="secondary" className="ml-1 text-xs">
                {count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Log Content */}
        {isExpanded ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Log List */}
            <ScrollArea className="h-96 lg:col-span-2">
              <div className="space-y-2 pr-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No log entries yet</p>
                    <p className="text-xs mt-1">Execute a task to see detailed logs</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedLog?.id === log.id ? "bg-accent border-primary" : "bg-card"
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start gap-2">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getLevelColor(log.level)}`}>
                              {log.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground code-font">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm break-words">{log.message}</p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Details Panel */}
            <div className="lg:col-span-1">
              {selectedLog ? (
                <Card className="p-4 bg-secondary/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    {getLevelIcon(selectedLog.level)}
                    Log Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                      <p className="text-sm code-font">{selectedLog.timestamp.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Level</p>
                      <Badge className={getLevelColor(selectedLog.level)}>
                        {selectedLog.level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <p className="text-sm">{selectedLog.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message</p>
                      <p className="text-sm break-words">{selectedLog.message}</p>
                    </div>
                    {selectedLog.details && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Details</p>
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {selectedLog.details}
                        </p>
                      </div>
                    )}
                    {selectedLog.data && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Data</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-48">
                          {JSON.stringify(selectedLog.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-4 bg-secondary/50 h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a log entry</p>
                    <p className="text-xs mt-1">to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-32">
            <div className="space-y-1 pr-4">
              {filteredLogs.slice(-5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent/50 transition-colors"
                >
                  {getLevelIcon(log.level)}
                  <span className="text-xs text-muted-foreground code-font min-w-[60px]">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {log.category}
                  </Badge>
                  <span className="flex-1 truncate">{log.message}</span>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No log entries yet. Execute a task to see detailed logs.
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};
