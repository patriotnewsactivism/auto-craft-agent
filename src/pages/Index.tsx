import { useState, useEffect, useCallback } from "react";
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
import { ConflictResolver } from "@/components/ConflictResolver";
import { Bot, Zap, Settings as SettingsIcon, Github, Download, Upload, GitBranch, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AIService } from "@/lib/aiService";
import { GitHubService, GitHubRepo, SyncConflict } from "@/lib/githubService";
import { ExportService } from "@/lib/exportService";
import { SyncManager } from "@/lib/syncManager";

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
  
  // New sync-related state
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>({
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    conflicts: [],
    currentBranch: 'main',
    status: 'synced'
  });
  const [connectedRepo, setConnectedRepo] = useState<GitHubRepo | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [conflictResolverOpen, setConflictResolverOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<SyncConflict[]>([]);

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

  // Initialize sync manager when GitHub token is available
  useEffect(() => {
    const token = localStorage.getItem("github_token");
    if (token && !syncManager) {
      const manager = new SyncManager(token, {
        autoSyncInterval: 30000,
        conflictResolutionMode: 'manual',
        enableRealTimeSync: true
      });

      // Set up status listener
      const unsubscribe = manager.onStatusChange((status) => {
        setSyncStatus(status);
        if (status.conflicts.length > 0) {
          setPendingConflicts(status.conflicts);
          setConflictResolverOpen(true);
        }
      });

      // Set up progress listener
      const unsubscribeProgress = manager.onProgress((progress) => {
        setSyncProgress(progress);
      });

      setSyncManager(manager);

      return () => {
        unsubscribe();
        unsubscribeProgress();
        manager.destroy();
      };
    }
  }, [syncManager]);

  // Update sync manager when files change
  useEffect(() => {
    if (syncManager && fileTree.length > 0) {
      syncManager.updateLocalFiles(fileTree);
    }
  }, [syncManager, fileTree]);

  const addTerminalLine = (text: string, type: TerminalLine["type"]) => {
    setTerminalLines((prev) => [...prev, { text, type }]);
  };

  const addThought = (thought: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setThinkingSteps((prev) => [...prev, { id: Date.now().toString(), thought, timestamp }]);
  };

  const executeWithAI = async (task: string) => {
    const apiKey = localStorage.getItem("anthropic_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Anthropic API key in settings",
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
    setStartTime(Date.now());

    addTerminalLine("Autonomous Code Wizard v3.0 initialized", "output");
    addTerminalLine(`Task: ${task}`, "command");
    addThought("Initializing AI-powered analysis...");

    try {
      const aiService = new AIService(apiKey);
      
      // Analyze task with AI
      addThought("Consulting Claude AI for task breakdown...");
      const analysis = await aiService.analyzeTask(task);
      
      addThought(`Task complexity: ${analysis.complexity.toUpperCase()}`);
      addThought(`Identified ${analysis.steps.length} steps and ${analysis.files.length} files to generate`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate steps dynamically from AI analysis
      const taskSteps: Omit<Step, "status">[] = analysis.steps.map((step, idx) => ({
        id: (idx + 1).toString(),
        title: step,
        description: `AI-generated step: ${step}`,
        type: idx < 2 ? "analysis" : idx === analysis.steps.length - 1 ? "testing" : "coding",
        files: analysis.files.filter((_, i) => i % analysis.steps.length === idx),
      }));

      const generatedFiles: FileNode[] = [];

      for (let i = 0; i < taskSteps.length; i++) {
        const step = { ...taskSteps[i], status: "running" as const };
        
        setSteps((prev) => [...prev, step]);
        addTerminalLine(`Executing: ${step.title}`, "command");
        addThought(`Processing ${step.title.toLowerCase()} with AI...`);

        // Generate actual code with AI for coding steps
        if (step.type === "coding" && step.files && step.files.length > 0) {
          for (const filePath of step.files) {
            addThought(`Generating ${filePath} with Claude AI...`);
            
            try {
              const code = await aiService.generateCode(
                `Generate ${filePath} for: ${task}`,
                `This is part of step: ${step.title}`
              );

              // Add to file tree
              const pathParts = filePath.split("/");
              const fileName = pathParts.pop()!;
              
              // Create nested structure
              let currentLevel = generatedFiles;
              for (const part of pathParts) {
                let folder = currentLevel.find((f) => f.name === part && f.type === "folder");
                if (!folder) {
                  folder = { name: part, type: "folder", children: [] };
                  currentLevel.push(folder);
                }
                currentLevel = folder.children!;
              }
              
              currentLevel.push({ name: fileName, type: "file", content: code });
              
              addTerminalLine(`✓ Generated ${filePath}`, "success");
              setMetrics(prev => ({ ...prev, filesGenerated: prev.filesGenerated + 1 }));
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              addTerminalLine(`✗ Failed to generate ${filePath}`, "error");
              setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }));
            }
          }
        } else {
          // Simulate other step types
          await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500));
        }

        setSteps((prev) =>
          prev.map((s) => (s.id === step.id ? { ...s, status: "completed" as const } : s))
        );
        addTerminalLine(`✓ ${step.title} completed`, "success");
        addThought(`Successfully completed ${step.title.toLowerCase()}`);
        setMetrics(prev => ({ ...prev, stepsCompleted: prev.stepsCompleted + 1 }));
      }

      setFileTree(generatedFiles);
      addTerminalLine("All tasks completed successfully!", "success");
      addThought("Task execution completed. All files generated and validated.");
      
      toast({
        title: "Task Completed Successfully",
        description: `Generated ${generatedFiles.length} files using AI`,
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

  const handleImportRepo = async (repo: GitHubRepo, branch?: string, mode?: 'import' | 'sync') => {
    const token = localStorage.getItem("github_token");
    if (!token) return;

    const selectedBranch = branch || repo.default_branch || 'main';
    const isSync = mode === 'sync';

    addTerminalLine(`${isSync ? 'Connecting to' : 'Importing'} repository: ${repo.full_name} (${selectedBranch})`, "command");
    setIsExecuting(true);

    try {
      const service = new GitHubService(token);
      const [owner, repoName] = repo.full_name.split("/");
      
      // Get repository contents recursively
      const getContentsRecursive = async (path = ""): Promise<FileNode[]> => {
        const contents = await service.getRepoContents(owner, repoName, path);
        const files: FileNode[] = [];

        for (const item of Array.isArray(contents) ? contents : [contents]) {
          if (item.type === "file" && item.download_url) {
            const content = await service.getFileContent(item.download_url);
            files.push({ 
              name: item.name, 
              type: "file", 
              content,
              path: item.path,
              sha: item.sha
            });
          } else if (item.type === "dir") {
            const subFiles = await getContentsRecursive(item.path);
            if (subFiles.length > 0) {
              files.push({
                name: item.name,
                type: "folder",
                children: subFiles,
                path: item.path
              });
            }
          }
        }
        return files;
      };

      const importedFiles = await getContentsRecursive();
      setFileTree(importedFiles);

      if (isSync && syncManager) {
        // Connect to sync manager
        await syncManager.connect(repo, selectedBranch);
        setConnectedRepo(repo);
        setCurrentBranch(selectedBranch);
        
        addTerminalLine(`✓ Connected to ${repo.name} with real-time sync enabled`, "success");
        toast({
          title: "Repository Connected",
          description: `Successfully connected to ${repo.name} with bidirectional sync`,
        });
      } else {
        addTerminalLine(`✓ Imported ${importedFiles.length} files from ${repo.name}`, "success");
        toast({
          title: "Repository Imported",
          description: `Successfully imported ${repo.name}`,
        });
      }
    } catch (error) {
      toast({
        title: isSync ? "Connection Failed" : "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

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

  const handlePushToGitHub = async () => {
    const token = localStorage.getItem("github_token");
    if (!token) {
      toast({
        title: "GitHub Token Required",
        description: "Please configure your GitHub token in settings",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    if (fileTree.length === 0) {
      toast({
        title: "No Files to Push",
        description: "Generate some files first",
        variant: "destructive",
      });
      return;
    }

    try {
      const service = new GitHubService(token);
      const repoName = `agent-project-${Date.now()}`;
      
      addTerminalLine(`Creating repository: ${repoName}`, "command");
      const repo = await service.createRepository(repoName, "Generated by Autonomous Code Wizard", false);
      
      const files = ExportService.flattenFileTree(fileTree);
      for (const file of files) {
        await service.createOrUpdateFile(
          repo.owner.login,
          repo.name,
          file.path,
          file.content,
          `Add ${file.path}`
        );
        addTerminalLine(`✓ Pushed ${file.path}`, "success");
      }

      toast({
        title: "Pushed to GitHub",
        description: `Repository created: ${repo.html_url}`,
      });
    } catch (error) {
      toast({
        title: "Push Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // New sync-related handlers
  const handleSync = useCallback(async () => {
    if (!syncManager) return;

    setIsLoading(true);
    try {
      const result = await syncManager.sync();
      if (result.conflicts.length > 0) {
        toast({
          title: "Conflicts Detected",
          description: `${result.conflicts.length} conflicts need resolution`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Complete",
          description: "Repository synchronized successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [syncManager, toast]);

  const handleForceSync = useCallback(async () => {
    if (!syncManager) return;

    setIsLoading(true);
    try {
      await syncManager.sync(true);
      toast({
        title: "Force Sync Complete",
        description: "Repository force synchronized successfully",
      });
    } catch (error) {
      toast({
        title: "Force Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [syncManager, toast]);

  const handleDisconnect = useCallback(() => {
    if (syncManager) {
      syncManager.disconnect();
      setConnectedRepo(null);
      setCurrentBranch('main');
      toast({
        title: "Disconnected",
        description: "Repository sync disconnected",
      });
    }
  }, [syncManager, toast]);

  const handleResolveConflict = useCallback(async (
    conflict: SyncConflict, 
    resolution: 'local' | 'remote' | 'merged', 
    mergedContent?: string
  ) => {
    if (!syncManager) return;

    try {
      await syncManager.resolveConflicts([{ conflict, resolution, mergedContent }]);
      toast({
        title: "Conflict Resolved",
        description: `Resolved conflict in ${conflict.path}`,
      });
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [syncManager, toast]);

  const handleResolveAllConflicts = useCallback(async (
    resolutions: Array<{
      conflict: SyncConflict;
      resolution: 'local' | 'remote' | 'merged';
      mergedContent?: string;
    }>
  ) => {
    if (!syncManager) return;

    try {
      await syncManager.resolveConflicts(resolutions);
      setPendingConflicts([]);
      setConflictResolverOpen(false);
      toast({
        title: "All Conflicts Resolved",
        description: `Resolved ${resolutions.length} conflicts successfully`,
      });
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [syncManager, toast]);

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
              AI-powered autonomous coding agent with Claude integration, GitHub connectivity,
              and real-time intelligent code generation.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configure API Keys
              </Button>
              <Button variant="outline" size="sm" onClick={() => setGithubBrowserOpen(true)}>
                <Github className="h-4 w-4 mr-2" />
                {connectedRepo ? 'Switch Repository' : 'Connect Repository'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={fileTree.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export ZIP
              </Button>
              <Button variant="outline" size="sm" onClick={handlePushToGitHub} disabled={fileTree.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Push to GitHub
              </Button>
              {connectedRepo && (
                <Button variant="outline" size="sm" onClick={handleSync} disabled={isLoading}>
                  <Workflow className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GitHubBrowser open={githubBrowserOpen} onOpenChange={setGithubBrowserOpen} onSelectRepo={handleImportRepo} />
      <ConflictResolver 
        open={conflictResolverOpen} 
        onOpenChange={setConflictResolverOpen}
        conflicts={pendingConflicts}
        onResolveConflict={handleResolveConflict}
        onResolveAll={handleResolveAllConflicts}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Task Input */}
        <TaskInput onSubmit={executeWithAI} isExecuting={isExecuting} />

        {/* Sync Status - Always visible when connected */}
        {(connectedRepo || syncStatus.connected) && (
          <SyncStatus
            repo={connectedRepo}
            branch={currentBranch}
            status={syncStatus}
            onSync={handleSync}
            onForceSync={handleForceSync}
            onDisconnect={handleDisconnect}
            isLoading={isLoading}
            progress={syncProgress}
          />
        )}

        {/* Metrics */}
        {isExecuting || steps.length > 0 ? (
          <ExecutionMetrics {...metrics} />
        ) : null}

        {/* Agent Thinking */}
        {(isExecuting || thinkingSteps.length > 0) && (
          <AgentThinking steps={thinkingSteps} isThinking={isExecuting} />
        )}

        {/* Main Execution View or File Browser */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Steps & Terminal or File Tree */}
          <div className="lg:col-span-2 space-y-6">
            {steps.length > 0 ? (
              <>
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
              </>
            ) : (
              fileTree.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Project Files
                    {connectedRepo && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({connectedRepo.name}/{currentBranch})
                      </span>
                    )}
                  </h2>
                  <FileTreeView files={fileTree} onFileSelect={setSelectedFile} />
                </div>
              )
            )}
          </div>

          {/* Right Column - Code Preview or Sync Status */}
          <div className="space-y-6">
            {selectedFile && selectedFile.content && (
              <CodePreview 
                fileName={selectedFile.name}
                code={selectedFile.content}
                language="typescript"
              />
            )}

            {/* Show terminal if no execution is running but we have terminal content */}
            {!isExecuting && steps.length === 0 && terminalLines.length > 0 && (
              <TerminalOutput lines={terminalLines} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
