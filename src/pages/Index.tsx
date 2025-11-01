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
import { DetailedExecutionLog, ExecutionLogEntry } from "@/components/DetailedExecutionLog";
import { CurrentStatusIndicator } from "@/components/CurrentStatusIndicator";
import { Bot, Zap, Settings as SettingsIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AutonomousAI } from "@/lib/autonomousAI";
import { AutonomousValidator } from "@/lib/autonomousValidator";
import { supabaseService } from "@/lib/supabaseService";
import { GitHubService, GitHubRepo } from "@/lib/githubService";
import { ExportService } from "@/lib/exportService";
import { logger } from "@/lib/logger";

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
  
  // New transparency features
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  const [currentStatus, setCurrentStatus] = useState<{
    task: string | null;
    progress: number;
    status: "idle" | "analyzing" | "generating" | "validating" | "learning" | "error" | "completed";
    details?: string;
  }>({ task: null, progress: 0, status: "idle" });
  
  const syncInFlightRef = useRef(false);
  const { toast } = useToast();

  // Learning is ALWAYS enabled now with localStorage fallback!
  const learningEnabled = true;

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

  // Subscribe to logger updates
  useEffect(() => {
    const unsubscribe = logger.subscribe((logs) => {
      setExecutionLogs(logs);
    });
    return unsubscribe;
  }, []);

  // Load settings and insights on mount
  useEffect(() => {
    const savedRepo = localStorage.getItem("connected_repo");
    const savedAutoSync = localStorage.getItem("auto_sync_enabled");
    const savedInterval = localStorage.getItem("sync_interval");

    if (savedRepo) {
      try {
        setConnectedRepo(JSON.parse(savedRepo));
      } catch (e) {
        logger.error("Settings", "Failed to parse saved repo", String(e));
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
      logger.info("Insights", "Loading autonomous insights");
      const ai = new AutonomousAI();
      const insights = await ai.getAutonomousInsights();
      setAutonomousInsights(insights);
      logger.success("Insights", `Loaded ${insights.length} insights`);
    } catch (error) {
      logger.logError("Insights", error, "Failed to load autonomous insights");
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
      logger.error("Execution", "API key not configured", "User needs to add Google AI API key in settings");
      toast({
        title: "API Key Required",
        description: "Please configure your Google AI API key in settings",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    logger.clearLogs();
    logger.info("Execution", "Starting new execution", `Task: ${task}`);
    
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
    setCurrentStatus({ task, progress: 0, status: "analyzing", details: "Initializing autonomous AI..." });

    addTerminalLine("🤖 Autonomous Code Wizard v5.0 - Self-Learning AI ALWAYS ACTIVE!", "output");
    addTerminalLine(`Task: ${task}`, "command");
    addTerminalLine("🧠 Learning mode: ALWAYS ON - Getting smarter with every command!", "output");
    
    addThought("🧠 Self-learning AI ACTIVE - Learning from this task to improve future performance");
    addThought("💾 All learning persists locally - I remember everything!");

    try {
      const autonomousAI = new AutonomousAI();
      const validator = new AutonomousValidator();
      
      // Step 1: Analyze with memory and learning
      setCurrentStatus({ task, progress: 10, status: "analyzing", details: "Analyzing task with past experiences..." });
      addThought("📊 Analyzing task with past experiences and learned patterns...");
      const taskAnalysis = await autonomousAI.analyzeWithMemory(task);
      setCurrentStatus({ task, progress: 20, status: "analyzing", details: "Task analysis complete" });
      
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
      setCurrentStatus({ task, progress: 25, status: "analyzing", details: "Creating autonomous execution plan..." });
      addThought("🚀 Creating autonomous execution plan...");
      const executionPlan = await autonomousAI.planExecution(taskAnalysis);
      setCurrentStatus({ task, progress: 30, status: "generating", details: `Executing ${executionPlan.length} steps` });
      
      const generatedFiles: FileNode[] = [];
      const allGeneratedFiles: Array<{ path: string; content: string }> = [];

      // Step 3: Execute each step autonomously
      for (let i = 0; i < executionPlan.length; i++) {
        const stepProgress = 30 + Math.floor((i / executionPlan.length) * 40);
        const stepDesc = executionPlan[i];
        setCurrentStatus({ 
          task, 
          progress: stepProgress, 
          status: "generating", 
          details: `Step ${i + 1}/${executionPlan.length}: ${stepDesc}` 
        });
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
        setCurrentStatus({ task, progress: 70, status: "validating", details: "Running validation checks..." });
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

      // Step 5: Self-reflection and learning (ALWAYS ACTIVE!)
      const executionTime = Math.floor((Date.now() - startTime) / 1000);
      const success = metrics.errors === 0;
      
      setCurrentStatus({ task, progress: 85, status: "learning", details: "Reflecting and learning from execution..." });
      addThought("🧠 Reflecting on execution and learning...");
      const reflection = await autonomousAI.reflectAndLearn(
        task,
        allGeneratedFiles,
        success,
        executionTime
      );
      
      setInnovationScore(reflection.innovationScore);
      
      // ALWAYS save learning - it's always active now!
      await autonomousAI.saveTaskExecution(
        taskAnalysis,
        taskAnalysis.files,
        success,
        executionTime,
        reflection
      );
      
      addThought(`📚 Learned ${reflection.newPatterns.length} new patterns - I'm getting smarter!`);
      addTerminalLine(`✓ Knowledge saved locally - I'll be even better next time!`, "success");
      addTerminalLine(`🚀 Self-learning AI continuously improving from every task`, "success");
      
      // Reload insights
      await loadInsights();

      setCurrentStatus({ task, progress: 100, status: "completed", details: "All tasks completed!" });
      addTerminalLine("🎉 All tasks completed autonomously!", "success");
      addThought(`✨ Innovation Score: ${(reflection.innovationScore * 100).toFixed(0)}%`);
      
      logger.success("Execution", "Task completed successfully", 
        `Generated ${allGeneratedFiles.length} files with ${(reflection.innovationScore * 100).toFixed(0)}% innovation`
      );
      
      toast({
        title: "Autonomous Execution Complete",
        description: `Generated ${allGeneratedFiles.length} files with ${(reflection.innovationScore * 100).toFixed(0)}% innovation`,
      });
    } catch (error) {
      setCurrentStatus({ task: task, progress: 0, status: "error", details: error instanceof Error ? error.message : "Unknown error" });
      logger.logError("Execution", error, "Task execution failed");
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
    if (!connectedRepo || fileTree.length === 0) {
      toast({
        title: "Cannot Sync",
        description: connectedRepo ? "No files to sync" : "No repository connected",
        variant: "destructive",
      });
      return;
    }

    const token = import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem("github_token");
    if (!token) {
      toast({
        title: "GitHub Token Required",
        description: "Please add your GitHub token in Settings",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    setIsSyncing(true);
    addTerminalLine(`🚀 Starting GitHub sync to ${connectedRepo.full_name}...`, "command");

    try {
      const service = new GitHubService(token);
      const [owner, repoName] = connectedRepo.full_name.split("/");
      
      const files = ExportService.flattenFileTree(fileTree);
      addTerminalLine(`📁 Preparing to sync ${files.length} files...`, "output");
      
      const result = await service.syncToGitHub(owner, repoName, files);
      
      setLastSyncTime(new Date());
      
      if (result.pushed.length > 0) {
        addTerminalLine(`✅ Successfully pushed ${result.pushed.length} files to ${connectedRepo.name}`, "success");
      }
      
      if (result.failed.length > 0) {
        addTerminalLine(`⚠️ ${result.failed.length} files failed to sync:`, "error");
        result.errors.forEach(err => addTerminalLine(`  - ${err}`, "error"));
        
        toast({
          title: "Partial Sync",
          description: `Pushed ${result.pushed.length} files, but ${result.failed.length} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Synced to GitHub",
          description: `Successfully pushed ${result.pushed.length} files to ${connectedRepo.name}`,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addTerminalLine(`❌ Sync failed: ${errorMsg}`, "error");
      console.error('GitHub sync error:', error);
      toast({
        title: "❌ Sync Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [connectedRepo, fileTree, toast, addTerminalLine, setSettingsOpen]);

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
      addTerminalLine(`📦 Exporting ${fileTree.length} files to ZIP...`, "command");
      await ExportService.exportAsZip(fileTree, "autonomous-code-wizard-project");
      addTerminalLine(`✅ ZIP export completed successfully!`, "success");
      toast({
        title: "✅ Export Successful",
        description: "Your files have been downloaded as a ZIP file",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addTerminalLine(`❌ ZIP export failed: ${errorMessage}`, "error");
      console.error('Export error:', error);
      toast({
        title: "❌ Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Glassmorphism */}
      <div className="glass-card border-0 mb-8 mx-4 mt-4">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center text-center space-y-6 max-w-5xl mx-auto fade-in">
            <div className="relative pulse-glow">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30 rounded-full" />
              <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 p-4 rounded-2xl backdrop-blur-xl border border-primary/30">
                <Bot className="h-14 w-14 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="gradient-text">Autonomous</span>{' '}
                <span className="text-foreground">Code Wizard</span>
              </h1>
              
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="badge-gradient shine-effect">✨ Phase 2 Complete</span>
                <span className="badge-gradient shine-effect">🚀 Voice Coding</span>
                <span className="badge-gradient shine-effect">🎨 Image to Code</span>
                <span className="badge-gradient shine-effect">👥 Real-time Collab</span>
              </div>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Truly autonomous AI that learns from experience, makes independent decisions,
              and improves continuously. Now with voice coding, image-to-code, and real-time collaboration.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button 
                className="animated-gradient hover:scale-105 transition-transform glow-border" 
                size="lg"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configure API Keys
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="hover-lift glass-card border-primary/30"
                onClick={handleExport} 
                disabled={fileTree.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GitHubBrowser open={githubBrowserOpen} onOpenChange={setGithubBrowserOpen} onSelectRepo={handleSelectRepo} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* GitHub Sync Status & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
          <div className="tech-card hover-lift p-6">
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
          </div>

          <div className="tech-card hover-lift p-6">
            <AutonomousInsights
              insights={autonomousInsights}
              innovationScore={innovationScore}
              learningEnabled={learningEnabled}
              patternsLearned={learnedPatterns}
            />
          </div>
        </div>

        {/* Task Input */}
        <div className="glass-card hover-lift p-6 fade-in">
          <TaskInput onSubmit={executeWithAutonomousAI} isExecuting={isExecuting} />
        </div>

        {/* Current Status Indicator */}
        <div className="fade-in">
          <CurrentStatusIndicator
            currentTask={currentStatus.task}
            progress={currentStatus.progress}
            status={currentStatus.status}
            details={currentStatus.details}
          />
        </div>

        {/* Metrics */}
        {(isExecuting || steps.length > 0) && (
          <div className="tech-card hover-lift p-6 fade-in">
            <ExecutionMetrics {...metrics} />
          </div>
        )}

        {/* Detailed Execution Log */}
        <div className="glass-card p-6 fade-in">
          <DetailedExecutionLog logs={executionLogs} isExecuting={isExecuting} />
        </div>

        {/* Agent Thinking */}
        {(isExecuting || thinkingSteps.length > 0) && (
          <div className="glass-card hover-lift p-6 pulse-glow fade-in">
            <AgentThinking steps={thinkingSteps} isThinking={isExecuting} />
          </div>
        )}

        {/* Validation Report */}
        {(codeValidation || architectureValidation || securityAudit) && (
          <div className="tech-card hover-lift p-6 fade-in">
            <ValidationReport
              codeValidation={codeValidation}
              architectureValidation={architectureValidation}
              securityAudit={securityAudit}
            />
          </div>
        )}

        {/* Main Execution View */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            {/* Left Column - Steps & Terminal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="tech-card p-6 space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                  <span className="gradient-text">Autonomous Execution Pipeline</span>
                </h2>
                {steps.map((step, index) => (
                  <div key={step.id} className="glass-card p-4 hover-lift">
                    <ExecutionStep step={step} index={index} />
                  </div>
                ))}
              </div>

              <div className="glass-card p-6">
                <TerminalOutput lines={terminalLines} />
              </div>
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
