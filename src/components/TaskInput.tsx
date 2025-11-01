import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, Loader2 } from "lucide-react";

interface TaskInputProps {
  onSubmit: (task: string) => void;
  isExecuting: boolean;
}

export const TaskInput = ({ onSubmit, isExecuting }: TaskInputProps) => {
  const [task, setTask] = useState("");

  const handleSubmit = () => {
    if (task.trim() && !isExecuting) {
      onSubmit(task);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto tech-card border-primary/20 glow-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-accent/3 to-primary/3 pointer-events-none"></div>
      <CardContent className="relative p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h2 className="text-base sm:text-lg font-semibold gradient-text">What would you like to build?</h2>
        </div>
        
        <div className="relative">
          <Textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: Create a modern todo app with drag-and-drop, dark mode, and local storage. Make it fully responsive and add smooth animations..."
            className="min-h-[120px] sm:min-h-[150px] bg-input border-border focus:border-primary resize-none text-sm sm:text-base pr-20"
            disabled={isExecuting}
            autoComplete="off"
            data-form-type="other"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground code-font bg-background/80 px-2 py-1 rounded">
              {task.length}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!task.trim() || isExecuting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 sm:py-6 text-base sm:text-lg group glow-border transition-all"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="hidden sm:inline">Agent is Working...</span>
                <span className="sm:hidden">Working...</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Start Autonomous Agent</span>
                <span className="sm:hidden">Start Agent</span>
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          <span className="hidden sm:inline">Tip: Press </span>
          <kbd className="px-2 py-0.5 text-xs font-semibold bg-secondary border border-border rounded">
            {navigator.platform.includes('Mac') ? '?' : 'Ctrl'}+Enter
          </kbd>
          <span className="hidden sm:inline"> to submit quickly</span>
        </p>
      </CardContent>
    </Card>
  );
};
