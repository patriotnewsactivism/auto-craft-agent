import { useState } from "react";
import { TaskInput } from "@/components/TaskInput";
import { ExecutionStep, Step } from "@/components/ExecutionStep";
import { ExecutionLogs } from "@/components/ExecutionLogs";
import { Bot, Sparkles, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
}

const Index = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const addLog = (level: LogEntry["level"], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, level, message }]);
  };

  const simulateExecution = async (task: string) => {
    setIsExecuting(true);
    setSteps([]);
    setLogs([]);

    addLog("info", "Autonomous agent initialized");
    addLog("info", `Processing task: ${task}`);

    // Simulate step-by-step execution
    const taskSteps: Omit<Step, "status">[] = [
      {
        id: "1",
        title: "Analyzing Requirements",
        description: "Breaking down the task into actionable components and identifying dependencies",
        type: "analysis",
      },
      {
        id: "2",
        title: "Planning Architecture",
        description: "Designing component structure, data flow, and file organization",
        type: "analysis",
      },
      {
        id: "3",
        title: "Generating Components",
        description: "Creating React components with TypeScript and proper typing",
        type: "coding",
        files: ["src/components/Dashboard.tsx", "src/components/Header.tsx", "src/lib/api.ts"],
      },
      {
        id: "4",
        title: "Implementing Features",
        description: "Adding state management, API integration, and business logic",
        type: "coding",
        files: ["src/hooks/useData.ts", "src/utils/helpers.ts"],
      },
      {
        id: "5",
        title: "Running Tests",
        description: "Validating functionality, checking for errors, and ensuring quality",
        type: "testing",
      },
    ];

    for (let i = 0; i < taskSteps.length; i++) {
      const step = { ...taskSteps[i], status: "running" as const };
      
      // Add step as running
      setSteps((prev) => [...prev, step]);
      addLog("info", `Started: ${step.title}`);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));

      // Complete step
      setSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, status: "completed" as const } : s))
      );
      addLog("success", `Completed: ${step.title}`);

      if (step.files) {
        step.files.forEach((file) => {
          addLog("info", `Generated file: ${file}`);
        });
      }
    }

    addLog("success", "All tasks completed successfully!");
    setIsExecuting(false);
    
    toast({
      title: "Task Completed",
      description: "The autonomous agent has finished executing your task.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
              <Bot className="h-20 w-20 text-primary relative" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Autonomous</span>
              <br />
              Code Wizard
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              An intelligent AI agent that breaks down complex coding tasks, generates production-ready code,
              and executes multi-step workflows autonomously.
            </p>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/30">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm code-font">Powered by Advanced AI Models</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Task Input */}
        <TaskInput onSubmit={simulateExecution} isExecuting={isExecuting} />

        {/* Execution Steps */}
        {steps.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" />
              Execution Progress
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <ExecutionStep key={step.id} step={step} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {logs.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <ExecutionLogs logs={logs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
