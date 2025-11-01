import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  FolderOpen,
  Play,
  Trash2,
  FileCode,
  CheckCircle,
  Pause,
  XCircle
} from "lucide-react";
import { backgroundTaskManager, ProjectState } from "@/lib/backgroundTaskManager";
import { TimeEstimator } from "@/lib/timeEstimator";

interface ProjectHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResumeProject: (project: ProjectState) => void;
}

export const ProjectHistory = ({ open, onOpenChange, onResumeProject }: ProjectHistoryProps) => {
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  useEffect(() => {
    const unsubscribe = backgroundTaskManager.onProjectsUpdate((updatedProjects) => {
      setProjects(updatedProjects);
    });
    return unsubscribe;
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await backgroundTaskManager.getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await backgroundTaskManager.deleteProject(projectId);
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    }
  };

  const handleResumeProject = (project: ProjectState) => {
    onResumeProject(project);
    onOpenChange(false);
  };

  const getStatusIcon = (status: ProjectState['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ProjectState['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project History
          </DialogTitle>
          <DialogDescription>
            Resume previous projects or start fresh. All work is automatically saved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
          {/* Project List */}
          <ScrollArea className="md:col-span-1 border rounded-lg p-4">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs mt-1">Start your first project!</p>
                </div>
              ) : (
                projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                      selectedProject?.id === project.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">{project.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </p>
                        </div>
                        {getStatusIcon(project.status)}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileCode className="h-3 w-3" />
                          {project.metrics.filesGenerated} files
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {new Date(project.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Project Details */}
          <div className="md:col-span-2">
            {selectedProject ? (
              <Card className="p-6 h-full flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{selectedProject.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedProject.description}
                        </p>
                      </div>
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <p className="text-sm">
                        {new Date(selectedProject.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Modified</p>
                      <p className="text-sm">
                        {new Date(selectedProject.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3 bg-secondary/50">
                        <p className="text-xs text-muted-foreground">Files Generated</p>
                        <p className="text-2xl font-bold">{selectedProject.metrics.filesGenerated}</p>
                      </Card>
                      <Card className="p-3 bg-secondary/50">
                        <p className="text-xs text-muted-foreground">Steps Completed</p>
                        <p className="text-2xl font-bold">{selectedProject.metrics.stepsCompleted}</p>
                      </Card>
                      <Card className="p-3 bg-secondary/50">
                        <p className="text-xs text-muted-foreground">Total Time</p>
                        <p className="text-2xl font-bold">
                          {TimeEstimator.formatTime(selectedProject.metrics.totalExecutionTime)}
                        </p>
                      </Card>
                      <Card className="p-3 bg-secondary/50">
                        <p className="text-xs text-muted-foreground">Errors</p>
                        <p className="text-2xl font-bold">{selectedProject.metrics.errors}</p>
                      </Card>
                    </div>
                  </div>

                  {selectedProject.currentTask && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Current Task</p>
                      <Card className="p-3 bg-secondary/50">
                        <p className="text-sm font-medium">{selectedProject.currentTask.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${selectedProject.currentTask.progress}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedProject.currentTask.progress}%
                          </p>
                        </div>
                      </Card>
                    </div>
                  )}

                  {selectedProject.taskHistory.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Recent Tasks ({selectedProject.taskHistory.length})
                      </p>
                      <ScrollArea className="h-32">
                        <div className="space-y-1">
                          {selectedProject.taskHistory.slice(-5).map((task, idx) => (
                            <div key={idx} className="text-xs p-2 rounded bg-secondary/30">
                              <div className="flex items-center justify-between">
                                <span className="truncate flex-1">{task.description}</span>
                                <Badge variant="outline" className="text-xs ml-2">
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleResumeProject(selectedProject)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Project
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={(e) => handleDeleteProject(selectedProject.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a project to view details</p>
                  <p className="text-xs mt-1">or start a new project</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
