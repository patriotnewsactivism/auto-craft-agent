import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Lightbulb, Target, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AutonomousInsightsProps {
  insights: string[];
  innovationScore: number;
  learningEnabled: boolean;
  patternsLearned: string[];
}

export const AutonomousInsights = ({ 
  insights, 
  innovationScore, 
  learningEnabled,
  patternsLearned 
}: AutonomousInsightsProps) => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Autonomous Intelligence</CardTitle>
          </div>
          <Badge variant={learningEnabled ? "default" : "secondary"}>
            {learningEnabled ? "Learning Active" : "Learning Disabled"}
          </Badge>
        </div>
        <CardDescription>
          {learningEnabled 
            ? "AI is learning from experience and improving autonomously" 
            : "Connect Supabase to enable autonomous learning"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Innovation Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Innovation Score
            </span>
            <span className="font-bold">{Math.round(innovationScore * 100)}%</span>
          </div>
          <Progress value={innovationScore * 100} className="h-2" />
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Autonomous Insights
            </div>
            <div className="space-y-1">
              {insights.map((insight, idx) => (
                <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Target className="h-3 w-3 mt-1 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learned Patterns */}
        {patternsLearned.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-blue-500" />
              Patterns Applied
            </div>
            <div className="flex flex-wrap gap-2">
              {patternsLearned.map((pattern, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!learningEnabled && (
          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            💡 Enable Supabase integration to unlock:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Learning from past tasks</li>
              <li>Pattern recognition</li>
              <li>Autonomous decision-making</li>
              <li>Self-improvement over time</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
