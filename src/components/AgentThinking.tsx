import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displaySteps = showAll ? steps : steps.slice(-10);
  const hiddenCount = steps.length - displaySteps.length;

  return (
    <Card className="p-4 bg-card border-primary/30 glow-border">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Agent Reasoning</h3>
            <Badge variant="outline" className="text-xs">
              {steps.length} thoughts
            </Badge>
            {isThinking && (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {steps.length > 10 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                {showAll ? "Show recent" : `Show all (${steps.length})`}
              </Button>
            )}
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

        {/* Content */}
        {isExpanded ? (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {displaySteps.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground italic">
                    Waiting for task...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will share its thinking process here
                  </p>
                </div>
              ) : (
                <>
                  {hiddenCount > 0 && (
                    <div className="text-center py-2 border-b border-border">
                      <p className="text-xs text-muted-foreground">
                        {hiddenCount} earlier thoughts hidden
                      </p>
                    </div>
                  )}
                  {displaySteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {index + 1 + (showAll ? 0 : Math.max(0, steps.length - 10))}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground code-font block mb-1">
                            {step.timestamp}
                          </span>
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {step.thought}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {displaySteps.slice(-5).map((step) => (
              <div key={step.id} className="text-sm">
                <span className="text-xs text-muted-foreground code-font">
                  {step.timestamp}
                </span>
                <p className="text-foreground mt-1 line-clamp-2">{step.thought}</p>
              </div>
            ))}
            {steps.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-2">
                Waiting for task...
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
