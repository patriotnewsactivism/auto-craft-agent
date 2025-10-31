import { useState, useEffect, useRef, useCallback } from "react";
import { TaskInput } from "@/components/TaskInput";
import { ExecutionStep, Step } from "@/components/ExecutionStep";
import { FileTreeView } from "@/components/FileTreeView";
import { CodePreview } from "@/components/CodePreview";
import { TerminalOutput } from "@/components/TerminalOutput";
import { AgentThinking } from "@/components/AgentThinking";
import { ExecutionMetrics } from "@/components/ExecutionMetrics";
import { Settings } from "@/components/Settings";
import { GitHubBrowser } from "@/components/GitHubBrowser";
import { SyncStatus } from "@/components/SyncStatus";
import { AutonomousInsights } from "@/components/AutonomousInsights";
import { ValidationReport } from "@/components/ValidationReport";
import { Bot, Zap, Settings as SettingsIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AutonomousAI } from "@/lib/autonomousAI";
import { AutonomousValidator } from "@/lib/autonomousValidator";
import { supabaseService } from "@/lib/supabaseService";
import { GitHubService, GitHubRepo } from "@/lib/githubService";
import { ExportService } from "@/lib/exportService";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [githubBrowserOpen, setGithubBrowserOpen] = useState(false);
  const [connectedRepo, setConnectedRepo] = useState<GitHubRepo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60000);
  
  // Autonomous features
  const [autonomousInsights, setAutonomousInsights] = useState<string[]>([]);
  const [innovationScore, setInnovationScore] = useState(0);
  const [learnedPatterns, setLearnedPatterns] = useState<string[]>([]);
  const [codeValidation, setCodeValidation] = useState<any>(null);
  const [architectureValidation, setArchitectureValidation] = useState<any>(null);
  const [securityAudit, setSecurityAudit] = useState<any>(null);
  
  const syncInFlightRef = useRef(false);
  const { toast } = useToast();

  const learningEnabled = supabaseService.isReady();

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

  // Load settings and insights on mount
  useEffect(() => {
    const savedRepo = localStorage.getItem("connected_repo");
    const savedAutoSync = localStorage.getItem("auto_sync_enabled");
    const savedInterval = localStorage.getItem("sync_interval");

    if (savedRepo) {
      try {
        setConnectedRepo(JSON.parse(savedRepo));
      } catch (e) {
        console.error("Failed to parse saved repo", e);
      }
    }
    if (savedAutoSync) setAutoSyncEnabled(savedAutoSync === "true");
    if (savedInterval) setSyncInterval(Number(savedInterval));

    // Load autonomous insights
    if (learningEnabled) {
      loadInsights();
    }
  }, [learningEnabled]);

  useEffect(() => {
    localStorage.setItem("auto_sync_enabled", String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    localStorage.setItem("sync_interval", String(syncInterval));
  }, [syncInterval]);

  const loadInsights = async () => {
    try {
      const ai = new AutonomousAI();
      const insights = await ai.getAutonomousInsights();
      setAutonomousInsights(insights);
    } catch (error) {
      console.error("Failed to load insights:", error);
    }
  };

  const addTerminalLine = useCallback((text: string, type: TerminalLine["type"]) => {
    setTerminalLines((prev) => [...prev, { text, type }]);
  }, []);

  const addThought = (thought: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setThinkingSteps((prev) => [...prev, { id: Date.now().toString(), thought, timestamp }]);
  };

  const executeWithAutonomousAI = async (task: string) => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Google AI API key in settings",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    setIsExecuting(true);
    setSteps([]);
    setFileTree([]);
    setTerminalLines([]);
    setThinkingSteps([]);
    setSelectedFile(null);
    setMetrics({ duration: 0, filesGenerated: 0, stepsCompleted: 0, errors: 0 });
    setCodeValidation(null);
    setArchitectureValidation(null);
    setSecurityAudit(null);
    setStartTime(Date.now());

    addTerminalLine("🤖 Autonomous Code Wizard v4.0 - Now with Self-Learning AI", "output");
    addTerminalLine(`Task: ${task}`, "command");
    
    if (learningEnabled) {
      addThought("🧠 Autonomous learning ENABLED - I'll learn from this task");
    } else {
      addThought("💡 Enable Supabase for autonomous learning and memory");
    }

    try {
      const autonomousAI = new AutonomousAI();
      const validator = new AutonomousValidator();
      
      // Step 1: Analyze with memory and learning
      addThought("📊 Analyzing task with past experiences and learned patterns...");
      const taskAnalysis = await autonomousAI.analyzeWithMemory(task);
      
      addThought(`✨ Innovation Score: ${(taskAnalysis.innovationOpportunities.length / 3 * 100).toFixed(0)}%`);
      addThought(`🎯 Complexity: ${taskAnalysis.complexity.toUpperCase()}`);
      addThought(`📝 Identified ${taskAnalysis.steps.length} autonomous steps`);
      
      if (taskAnalysis.learnedPatterns.length > 0) {
        addThought(`🎓 Applying ${taskAnalysis.learnedPatterns.length} learned patterns`);
        setLearnedPatterns(taskAnalysis.learnedPatterns);
      }

      if (taskAnalysis.innovationOpportunities.length > 0) {
        addTerminalLine(`💡 Innovation opportunities: ${taskAnalysis.innovationOpportunities.join(', ')}`, "output");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Plan autonomous execution
      addThought("🚀 Creating autonomous execution plan...");
      const executionPlan = await autonomousAI.planExecution(taskAnalysis);
      
      const generatedFiles: FileNode[] = [];
      const allGeneratedFiles: Array<{ path: string; content: string }> = [];

      // Step 3: Execute each step autonomously
      for (let i = 0; i < executionPlan.length; i++) {
        const stepDesc = executionPlan[i];
        const step: Step = {
          id: (i + 1).toString(),
          title: stepDesc,
          description: `Autonomous step ${i + 1}`,
          type: i === 0 ? "analysis" : i === executionPlan.length - 1 ? "testing" : "coding",
          status: "running",
          files: taskAnalysis.files.filter((_, idx) => idx % executionPlan.length === i)
        };
        
        setSteps((prev) => [...prev, step]);
        addTerminalLine(`⚡ Executing: ${stepDesc}`, "command");
        addThought(`🔨 Working autonomously on: ${stepDesc}`);

        // Generate code for coding steps
        if (step.type === "coding" && step.files && step.files.length > 0) {
          for (const filePath of step.files) {
            addThought(`🎨 Generating ${filePath} with innovation...`);
            
            try {
              const code = await autonomousAI.generateCodeAutonomously(
                `Generate ${filePath} for: ${task}`,
                `This is part of: ${stepDesc}`,
                taskAnalysis
              );

              // Autonomous validation
              addThought(`🔍 Autonomously validating ${filePath}...`);
              const validation = await validator.validateCode(filePath, code, task);
              
              let finalCode = code;
              if (!validation.isValid || validation.score < 70) {
                addThought(`🔧 Auto-correcting issues in ${filePath}...`);
                finalCode = await validator.autonomousCorrection(filePath, code, validation);
              }

              // Add to file tree
              const pathParts = filePath.split("/");
              const fileName = pathParts.pop()!;
              
              let currentLevel = generatedFiles;
              for (const part of pathParts) {
                let folder = currentLevel.find((f) => f.name === part && f.type === "folder");
                if (!folder) {
                  folder = { name: part, type: "folder", children: [] };
                  currentLevel.push(folder);
                }
                currentLevel = folder.children!;
              }
              
              currentLevel.push({ name: fileName, type: "file", content: finalCode });
              allGeneratedFiles.push({ path: filePath, content: finalCode });
              
              addTerminalLine(`✓ Generated ${filePath} (Quality: ${validation.score}/100)`, "success");
              setMetrics(prev => ({ ...prev, filesGenerated: prev.filesGenerated + 1 }));
              
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              addTerminalLine(`✗ Failed to generate ${filePath}`, "error");
              setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }));
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        setSteps((prev) =>
          prev.map((s) => (s.id === step.id ? { ...s, status: "completed" as const } : s))
        );
        addTerminalLine(`✓ ${stepDesc} completed autonomously`, "success");
        setMetrics(prev => ({ ...prev, stepsCompleted: prev.stepsCompleted + 1 }));
      }

      setFileTree(generatedFiles);

      // Step 4: Comprehensive validation
      if (allGeneratedFiles.length > 0) {
        addThought("🛡️ Running autonomous architecture and security validation...");
        
        const [archValidation, secAudit] = await Promise.all([
          validator.validateArchitecture(allGeneratedFiles, task),
          validator.securityAudit(allGeneratedFiles)
        ]);
        
        setArchitectureValidation(archValidation);
        setSecurityAudit(secAudit);
        
        addTerminalLine(`✓ Architecture Score: ${archValidation.score}/100`, "output");
        addTerminalLine(`✓ Security Score: ${secAudit.score}/100`, "output");
      }

      // Step 5: Self-reflection and learning
      const executionTime = Math.floor((Date.now() - startTime) / 1000);
      const success = metrics.errors === 0;
      
      addThought("🧠 Reflecting on execution and learning...");
      const reflection = await autonomousAI.reflectAndLearn(
        task,
        allGeneratedFiles,
        success,
        executionTime
      );
      
      setInnovationScore(reflection.innovationScore);
      
      if (learningEnabled) {
        await autonomousAI.saveTaskExecution(
          taskAnalysis,
          taskAnalysis.files,
          success,
          executionTime,
          reflection
        );
        
        addThought(`📚 Learned ${reflection.newPatterns.length} new patterns for future tasks`);
        addTerminalLine(`✓ Knowledge saved - AI will improve for next time!`, "success");
        
        // Reload insights
        await loadInsights();
      }

      addTerminalLine("🎉 All tasks completed autonomously!", "success");
      addThought(`✨ Innovation Score: ${(reflection.innovationScore * 100).toFixed(0)}%`);
      
      toast({
        title: "Autonomous Execution Complete",
        description: `Generated ${allGeneratedFiles.length} files with ${(reflection.innovationScore * 100).toFixed(0)}% innovation`,
      });
    } catch (error) {
      addTerminalLine(`✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // GitHub sync methods (keeping existing functionality)
  const handleSelectRepo = async (repo: GitHubRepo) => {
    setConnectedRepo(repo);
    localStorage.setItem("connected_repo", JSON.stringify(repo));
    toast({
      title: "Repository Connected",
      description: `Connected to ${repo.full_name}`,
    });
    await handleSyncFromGitHub(repo);
  };

  const handleSyncFromGitHub = useCallback(async (repo?: GitHubRepo) => {
    const targetRepo = repo || connectedRepo;
    if (!targetRepo) return;

    const token = import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem("github_token");
    if (!token) {
      toast({
        title: "GitHub Token Required",
        description: "Add your token in Settings",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    setIsSyncing(true);
    addTerminalLine(`Syncing from GitHub: ${targetRepo.full_name}`, "command");

    try {
      const service = new GitHubService(token);
      const [owner, repoName] = targetRepo.full_name.split("/");
      
      const files = await service.syncFromGitHub(owner, repoName);
      
      const pulledTree: FileNode[] = [];
      for (const file of files) {
        const pathParts = file.path.split("/");
        const fileName = pathParts.pop()!;
        
        let currentLevel = pulledTree;
        for (const part of pathParts) {
          let folder = currentLevel.find((f) => f.name === part && f.type === "folder");
          if (!folder) {
            folder = { name: part, type: "folder", children: [] };
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
        
        currentLevel.push({ name: fileName, type: "file", content: file.content });
      }

      setFileTree(pulledTree);
      setLastSyncTime(new Date());
      addTerminalLine(`✓ Synced ${files.length} files from ${targetRepo.name}`, "success");
      
      toast({
        title: "Synced from GitHub",
        description: `Pulled ${files.length} files`,
      });
    } catch (error) {
      addTerminalLine(`✗ Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [connectedRepo, toast, addTerminalLine]);

  const handleSyncToGitHub = useCallback(async () => {
    if (!connectedRepo || fileTree.length === 0) return;

    const token = import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem("github_token");
    if (!token) return;

    setIsSyncing(true);
    addTerminalLine(`Syncing to GitHub: ${connectedRepo.full_name}`, "command");

    try {
      const service = new GitHubService(token);
      const [owner, repoName] = connectedRepo.full_name.split("/");
      
      const files = ExportService.flattenFileTree(fileTree);
      const result = await service.syncToGitHub(owner, repoName, files);
      
      setLastSyncTime(new Date());
      addTerminalLine(`✓ Pushed ${result.pushed.length} files to ${connectedRepo.name}`, "success");
      
      if (result.failed.length > 0) {
        addTerminalLine(`⚠ ${result.failed.length} files failed to sync`, "error");
      }
      
      toast({
        title: "Synced to GitHub",
        description: `Pushed ${result.pushed.length} files`,
      });
    } catch (error) {
      addTerminalLine(`✗ Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [connectedRepo, fileTree, toast, addTerminalLine]);

  const handleBidirectionalSync = useCallback(async () => {
    if (!connectedRepo) return;
    await handleSyncFromGitHub();
    await handleSyncToGitHub();
  }, [connectedRepo, handleSyncFromGitHub, handleSyncToGitHub]);

  useEffect(() => {
    if (!autoSyncEnabled || !connectedRepo) return;

    const performAutoSync = async () => {
      if (syncInFlightRef.current || isSyncing) return;
      syncInFlightRef.current = true;
      try {
        await handleBidirectionalSync();
      } finally {
        syncInFlightRef.current = false;
      }
    };

    const interval = setInterval(performAutoSync, syncInterval);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, connectedRepo, syncInterval, isSyncing, handleBidirectionalSync]);

  const handleExport = async () => {
    if (fileTree.length === 0) {
      toast({
        title: "No Files to Export",
        description: "Generate some files first",
        variant: "destructive",
      });
      return;
    }

    try {
      await ExportService.exportAsZip(fileTree, "generated-code");
      toast({
        title: "Export Successful",
        description: "Files downloaded as ZIP",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
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
              Truly autonomous AI that learns from experience, makes independent decisions,
              and improves continuously without constant guidance.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configure API Keys
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={fileTree.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export ZIP
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GitHubBrowser open={githubBrowserOpen} onOpenChange={setGithubBrowserOpen} onSelectRepo={handleSelectRepo} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* GitHub Sync Status */}
        <SyncStatus
          connectedRepo={connectedRepo}
          onSelectRepo={() => setGithubBrowserOpen(true)}
          onSyncToGitHub={handleSyncToGitHub}
          onSyncFromGitHub={() => handleSyncFromGitHub()}
          lastSyncTime={lastSyncTime}
          isSyncing={isSyncing}
          autoSyncEnabled={autoSyncEnabled}
          onAutoSyncChange={setAutoSyncEnabled}
          syncInterval={syncInterval}
          onSyncIntervalChange={setSyncInterval}
        />

        {/* Autonomous Insights */}
        <AutonomousInsights
          insights={autonomousInsights}
          innovationScore={innovationScore}
          learningEnabled={learningEnabled}
          patternsLearned={learnedPatterns}
        />

        {/* Task Input */}
        <TaskInput onSubmit={executeWithAutonomousAI} isExecuting={isExecuting} />

        {/* Metrics */}
        {(isExecuting || steps.length > 0) && (
          <ExecutionMetrics {...metrics} />
        )}

        {/* Agent Thinking */}
        {(isExecuting || thinkingSteps.length > 0) && (
          <AgentThinking steps={thinkingSteps} isThinking={isExecuting} />
        )}

        {/* Validation Report */}
        {(codeValidation || architectureValidation || securityAudit) && (
          <ValidationReport
            codeValidation={codeValidation}
            architectureValidation={architectureValidation}
            securityAudit={securityAudit}
          />
        )}

        {/* Main Execution View */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Steps & Terminal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Autonomous Execution Pipeline
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
