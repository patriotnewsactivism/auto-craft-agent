import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <Textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe your coding task in detail... e.g., 'Build a responsive dashboard with user authentication, data visualization charts, and a settings page'"
          className="min-h-[150px] bg-secondary border-primary/30 focus:border-primary resize-none text-base code-font"
          disabled={isExecuting}
          autoComplete="off"
          data-form-type="other"
        />
        <div className="absolute top-3 right-3 text-xs text-muted-foreground code-font">
          {task.length} chars
        </div>
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={!task.trim() || isExecuting}
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-6 text-lg group"
      >
        <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
        {isExecuting ? "Agent is Working..." : "Start Autonomous Agent"}
      </Button>
    </div>
  );
};
