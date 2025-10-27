import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitHubRepo, GitHubService } from "@/lib/githubService";
import { Github, Search, Star, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitHubBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRepo: (repo: GitHubRepo) => void;
}

export const GitHubBrowser = ({ open, onOpenChange, onSelectRepo }: GitHubBrowserProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (search) {
      const filtered = repos.filter(
        (repo) =>
          repo.name.toLowerCase().includes(search.toLowerCase()) ||
          repo.description?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [search, repos]);

  const loadRepositories = async () => {
    const token = localStorage.getItem("github_token");
    if (!token) {
      toast({
        title: "GitHub Token Required",
        description: "Please configure your GitHub token in settings",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const service = new GitHubService(token);
      const repositories = await service.listRepositories();
      setRepos(repositories);
      setFilteredRepos(repositories);
    } catch (error) {
      toast({
        title: "Failed to Load Repositories",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Import from GitHub
          </DialogTitle>
          <DialogDescription>Select a repository to import into the agent</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading repositories...</div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No repositories found" : "No repositories available"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    onSelectRepo(repo);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{repo.name}</h3>
                        {repo.private ? (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {repo.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {repo.language && <span>{repo.language}</span>}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </span>
                        <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
