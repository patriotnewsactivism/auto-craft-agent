import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SyncConflict } from "@/lib/githubService";
import { AlertTriangle, ArrowLeft, ArrowRight, Merge, Save } from "lucide-react";

interface ConflictResolverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SyncConflict[];
  onResolveConflict: (conflict: SyncConflict, resolution: 'local' | 'remote' | 'merged', mergedContent?: string) => void;
  onResolveAll: (resolutions: Array<{ conflict: SyncConflict; resolution: 'local' | 'remote' | 'merged'; mergedContent?: string }>) => void;
}

export const ConflictResolver = ({ 
  open, 
  onOpenChange, 
  conflicts, 
  onResolveConflict, 
  onResolveAll 
}: ConflictResolverProps) => {
  const [selectedConflictIndex, setSelectedConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<number, { resolution: 'local' | 'remote' | 'merged'; mergedContent?: string }>>(new Map());
  const [mergedContent, setMergedContent] = useState("");

  const currentConflict = conflicts[selectedConflictIndex];

  const handleResolution = (resolution: 'local' | 'remote' | 'merged') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(selectedConflictIndex, { 
      resolution, 
      mergedContent: resolution === 'merged' ? mergedContent : undefined 
    });
    setResolutions(newResolutions);
  };

  const handleResolveAll = () => {
    const allResolutions = conflicts.map((conflict, index) => {
      const resolution = resolutions.get(index) || { resolution: 'local' as const };
      return {
        conflict,
        resolution: resolution.resolution,
        mergedContent: resolution.mergedContent
      };
    });
    onResolveAll(allResolutions);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (selectedConflictIndex < conflicts.length - 1) {
      setSelectedConflictIndex(selectedConflictIndex + 1);
      const nextResolution = resolutions.get(selectedConflictIndex + 1);
      if (nextResolution?.resolution === 'merged' && nextResolution.mergedContent) {
        setMergedContent(nextResolution.mergedContent);
      } else {
        setMergedContent(conflicts[selectedConflictIndex + 1]?.localContent || "");
      }
    }
  };

  const handlePrevious = () => {
    if (selectedConflictIndex > 0) {
      setSelectedConflictIndex(selectedConflictIndex - 1);
      const prevResolution = resolutions.get(selectedConflictIndex - 1);
      if (prevResolution?.resolution === 'merged' && prevResolution.mergedContent) {
        setMergedContent(prevResolution.mergedContent);
      } else {
        setMergedContent(conflicts[selectedConflictIndex - 1]?.localContent || "");
      }
    }
  };

  const getConflictTypeIcon = (type: SyncConflict['type']) => {
    switch (type) {
      case 'content':
        return '📝';
      case 'deletion':
        return '🗑️';
      case 'creation':
        return '➕';
      default:
        return '⚠️';
    }
  };

  const getConflictTypeDescription = (type: SyncConflict['type']) => {
    switch (type) {
      case 'content':
        return 'Content differs between local and remote';
      case 'deletion':
        return 'File exists remotely but not locally';
      case 'creation':
        return 'File exists locally but not remotely';
      default:
        return 'Unknown conflict type';
    }
  };

  if (!currentConflict) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Resolve Sync Conflicts ({conflicts.length} conflicts)
          </DialogTitle>
          <DialogDescription>
            Review and resolve conflicts between local and remote versions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Conflict Navigation */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {selectedConflictIndex + 1} of {conflicts.length}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getConflictTypeIcon(currentConflict.type)}</span>
                <div>
                  <p className="font-medium">{currentConflict.path}</p>
                  <p className="text-sm text-muted-foreground">
                    {getConflictTypeDescription(currentConflict.type)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={selectedConflictIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                disabled={selectedConflictIndex === conflicts.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conflict Resolution */}
          <div className="flex-1">
            <Tabs defaultValue="side-by-side" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                <TabsTrigger value="merge">Manual Merge</TabsTrigger>
              </TabsList>

              <TabsContent value="side-by-side" className="flex-1 mt-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Local Version */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Local Version</h3>
                      <Button 
                        size="sm" 
                        variant={resolutions.get(selectedConflictIndex)?.resolution === 'local' ? 'default' : 'outline'}
                        onClick={() => handleResolution('local')}
                      >
                        Use Local
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px] border rounded-md">
                      <pre className="p-4 text-sm whitespace-pre-wrap font-mono">
                        {currentConflict.localContent || '(Empty file)'}
                      </pre>
                    </ScrollArea>
                  </div>

                  {/* Remote Version */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Remote Version</h3>
                      <Button 
                        size="sm" 
                        variant={resolutions.get(selectedConflictIndex)?.resolution === 'remote' ? 'default' : 'outline'}
                        onClick={() => handleResolution('remote')}
                      >
                        Use Remote
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px] border rounded-md">
                      <pre className="p-4 text-sm whitespace-pre-wrap font-mono">
                        {currentConflict.remoteContent || '(Empty file)'}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="merge" className="flex-1 mt-4">
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Manual Merge</h3>
                    <Button 
                      size="sm" 
                      variant={resolutions.get(selectedConflictIndex)?.resolution === 'merged' ? 'default' : 'outline'}
                      onClick={() => handleResolution('merged')}
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Use Merged
                    </Button>
                  </div>
                  <Textarea
                    className="flex-1 font-mono text-sm"
                    placeholder="Merge the content manually..."
                    value={mergedContent}
                    onChange={(e) => setMergedContent(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Tip: You can copy content from the "Side by Side" view and combine it here
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Progress and Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Resolved: {resolutions.size} of {conflicts.length} conflicts
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleResolveAll}
                  disabled={resolutions.size < conflicts.length}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Resolve All Conflicts
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};