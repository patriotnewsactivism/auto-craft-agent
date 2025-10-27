import { useState, useEffect } from "react";
import { TaskInput } from "@/components/TaskInput";
import { ExecutionStep, Step } from "@/components/ExecutionStep";
import { FileTreeView } from "@/components/FileTreeView";
import { CodePreview } from "@/components/CodePreview";
import { TerminalOutput } from "@/components/TerminalOutput";
import { AgentThinking } from "@/components/AgentThinking";
import { ExecutionMetrics } from "@/components/ExecutionMetrics";
import { Bot, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sampleCode } from "@/lib/sampleCode";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

interface TerminalLine {
  text: string;
  type: "command" | "output" | "error" | "success";
}

interface ThinkingStep {
  id: string;
  thought: string;
  timestamp: string;
}

const Index = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [metrics, setMetrics] = useState({ duration: 0, filesGenerated: 0, stepsCompleted: 0, errors: 0 });
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExecuting && startTime > 0) {
      interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting, startTime]);

  const addTerminalLine = (text: string, type: TerminalLine["type"]) => {
    setTerminalLines((prev) => [...prev, { text, type }]);
  };

  const addThought = (thought: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setThinkingSteps((prev) => [...prev, { id: Date.now().toString(), thought, timestamp }]);
  };

  const simulateExecution = async (task: string) => {
    setIsExecuting(true);
    setSteps([]);
    setFileTree([]);
    setTerminalLines([]);
    setThinkingSteps([]);
    setSelectedFile(null);
    setMetrics({ duration: 0, filesGenerated: 0, stepsCompleted: 0, errors: 0 });
    setStartTime(Date.now());

    addTerminalLine("Autonomous Code Wizard v2.0 initialized", "output");
    addTerminalLine(`Task: ${task}`, "command");
    addThought("Analyzing task requirements and complexity...");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Planning phase
    addThought("Breaking down task into atomic components and identifying dependencies...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addThought("Designing optimal architecture with scalability and maintainability in mind...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addThought("Generating execution plan with 5 stages and 12 sub-tasks...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    const taskSteps: Omit<Step, "status">[] = [
      {
        id: "1",
        title: "Requirements Analysis",
        description: "Deep analysis of task requirements, constraints, and success criteria",
        type: "analysis",
      },
      {
        id: "2",
        title: "Architecture Design",
        description: "Designing scalable component hierarchy, state management, and data flow patterns",
        type: "analysis",
      },
      {
        id: "3",
        title: "Core Components Generation",
        description: "Generating TypeScript interfaces, React components with full type safety",
        type: "coding",
        files: ["src/components/Dashboard.tsx", "src/components/UserPanel.tsx", "src/types/index.ts"],
      },
      {
        id: "4",
        title: "Business Logic Implementation",
        description: "Implementing hooks, API integration, state management, and error handling",
        type: "coding",
        files: ["src/hooks/useData.ts", "src/api/client.ts", "src/utils/validators.ts"],
      },
      {
        id: "5",
        title: "Testing & Validation",
        description: "Running comprehensive tests, checking type safety, and validating functionality",
        type: "testing",
      },
    ];

    const generatedFiles: FileNode[] = [
      {
        name: "src",
        type: "folder",
        children: [
          {
            name: "components",
            type: "folder",
            children: [
              { name: "Dashboard.tsx", type: "file", content: sampleCode.dashboard },
              { name: "UserPanel.tsx", type: "file", content: sampleCode.userPanel }
            ]
          },
          {
            name: "hooks",
            type: "folder",
            children: [
              { name: "useData.ts", type: "file", content: sampleCode.hook }
            ]
          },
          {
            name: "types",
            type: "folder",
            children: [
              { name: "index.ts", type: "file", content: sampleCode.types }
            ]
          }
        ]
      }
    ];

    for (let i = 0; i < taskSteps.length; i++) {
      const step = { ...taskSteps[i], status: "running" as const };
      
      setSteps((prev) => [...prev, step]);
      addTerminalLine(`Executing: ${step.title}`, "command");
      addThought(`Processing ${step.title.toLowerCase()}...`);

      // Simulate detailed work
      const workTime = 2000 + Math.random() * 2500;
      await new Promise((resolve) => setTimeout(resolve, workTime));

      if (step.files) {
        for (const file of step.files) {
          addTerminalLine(`✓ Generated ${file}`, "success");
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        setMetrics(prev => ({ ...prev, filesGenerated: prev.filesGenerated + step.files!.length }));
      }

      setSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, status: "completed" as const } : s))
      );
      addTerminalLine(`✓ ${step.title} completed`, "success");
      addThought(`Successfully completed ${step.title.toLowerCase()}`);
      setMetrics(prev => ({ ...prev, stepsCompleted: prev.stepsCompleted + 1 }));
    }

    // Generate file tree
    setFileTree(generatedFiles);
    await new Promise((resolve) => setTimeout(resolve, 500));

    addTerminalLine("All tasks completed successfully!", "success");
    addThought("Task execution completed. All files generated and validated.");
    setIsExecuting(false);
    
    toast({
      title: "Task Completed Successfully",
      description: `Generated ${metrics.filesGenerated} files in ${metrics.duration} seconds`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center space-y-4 max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
              <Bot className="h-16 w-16 text-primary relative" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Autonomous</span> Code Wizard
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl">
              Advanced autonomous agent with intelligent task breakdown, real-time code generation,
              and comprehensive execution monitoring.
            </p>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/30">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm code-font">Enterprise-Grade Automation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Task Input */}
        <TaskInput onSubmit={simulateExecution} isExecuting={isExecuting} />

        {/* Metrics */}
        {isExecuting || steps.length > 0 ? (
          <ExecutionMetrics {...metrics} />
        ) : null}

        {/* Agent Thinking */}
        {(isExecuting || thinkingSteps.length > 0) && (
          <AgentThinking steps={thinkingSteps} isThinking={isExecuting} />
        )}

        {/* Main Execution View */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Steps & Terminal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Execution Pipeline
                </h2>
                {steps.map((step, index) => (
                  <ExecutionStep key={step.id} step={step} index={index} />
                ))}
              </div>

              <TerminalOutput lines={terminalLines} />
            </div>

            {/* Right Column - Files & Code */}
            <div className="space-y-6">
              {fileTree.length > 0 && (
                <FileTreeView files={fileTree} onFileSelect={setSelectedFile} />
              )}

              {selectedFile && selectedFile.content && (
                <CodePreview 
                  fileName={selectedFile.name}
                  code={selectedFile.content}
                  language="typescript"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
