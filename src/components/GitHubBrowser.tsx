import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { GitHubRepo, GitHubService, GitHubBranch } from "@/lib/githubService";
import { Github, Search, Star, Lock, Globe, GitBranch, Filter, Clock, Download, GitFork } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitHubBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRepo: (repo: GitHubRepo, branch?: string, mode?: 'import' | 'sync') => void;
}

export const GitHubBrowser = ({ open, onOpenChange, onSelectRepo }: GitHubBrowserProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [recentRepos, setRecentRepos] = useState<GitHubRepo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRepositories();
      loadRecentRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [search, repos, languageFilter, typeFilter, sortBy]);

  const loadRecentRepos = () => {
    const recent = localStorage.getItem("recent_github_repos");
    if (recent) {
      try {
        setRecentRepos(JSON.parse(recent));
      } catch (error) {
        console.error("Failed to load recent repos:", error);
      }
    }
  };

  const saveRecentRepo = (repo: GitHubRepo) => {
    const recent = recentRepos.filter(r => r.id !== repo.id);
    recent.unshift(repo);
    const updated = recent.slice(0, 5); // Keep only 5 recent repos
    setRecentRepos(updated);
    localStorage.setItem("recent_github_repos", JSON.stringify(updated));
  };

  const applyFilters = () => {
    let filtered = [...repos];

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(search.toLowerCase()) ||
          repo.description?.toLowerCase().includes(search.toLowerCase()) ||
          repo.full_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Language filter
    if (languageFilter && languageFilter !== "all") {
      filtered = filtered.filter(repo => repo.language === languageFilter);
    }

    // Type filter
    if (typeFilter === "private") {
      filtered = filtered.filter(repo => repo.private);
    } else if (typeFilter === "public") {
      filtered = filtered.filter(repo => !repo.private);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stars":
          return b.stargazers_count - a.stargazers_count;
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredRepos(filtered);
  };

  const loadRepositories = useCallback(async () => {
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
  }, [toast, onOpenChange]);

  const loadBranches = async (repo: GitHubRepo) => {
    const token = localStorage.getItem("github_token");
    if (!token) return;

    setLoadingBranches(true);
    try {
      const service = new GitHubService(token);
      const [owner, repoName] = repo.full_name.split("/");
      const repoBranches = await service.listBranches(owner, repoName);
      setBranches(repoBranches);
      setSelectedBranch(repo.default_branch || "main");
    } catch (error) {
      console.error("Failed to load branches:", error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleRepoClick = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    loadBranches(repo);
  };

  const handleSelectRepo = (mode: 'import' | 'sync') => {
    if (selectedRepo) {
      saveRecentRepo(selectedRepo);
      onSelectRepo(selectedRepo, selectedBranch, mode);
      onOpenChange(false);
    }
  };

  const getUniqueLanguages = () => {
    const languages = new Set(repos.map(repo => repo.language).filter(Boolean));
    return Array.from(languages).sort();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Repository Browser
          </DialogTitle>
          <DialogDescription>
            Browse, search, and connect repositories with bidirectional sync capabilities
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="browse" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Repositories</TabsTrigger>
            <TabsTrigger value="recent">Recent & Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 flex flex-col space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {getUniqueLanguages().map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stars">Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Repository List */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading repositories...</div>
                ) : filteredRepos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {search ? "No repositories found" : "No repositories available"}
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleRepoClick(repo)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedRepo?.id === repo.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate text-sm">{repo.name}</h3>
                          {repo.private ? (
                            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {repo.language && <Badge variant="outline" className="text-xs">{repo.language}</Badge>}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Repository Details */}
              {selectedRepo && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {selectedRepo.name}
                      {selectedRepo.private ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedRepo.full_name}</p>
                    <p className="text-sm mt-2">{selectedRepo.description || "No description"}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedRepo.language && (
                      <Badge variant="secondary">{selectedRepo.language}</Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {selectedRepo.stargazers_count}
                    </span>
                    <span>Updated {new Date(selectedRepo.updated_at).toLocaleDateString()}</span>
                  </div>

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      Select Branch
                    </Label>
                    {loadingBranches ? (
                      <div className="text-sm text-muted-foreground">Loading branches...</div>
                    ) : (
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(branch => (
                            <SelectItem key={branch.name} value={branch.name}>
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3" />
                                {branch.name}
                                {branch.protected && <Badge variant="outline" className="text-xs">Protected</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleSelectRepo('import')} 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Import Once
                    </Button>
                    <Button 
                      onClick={() => handleSelectRepo('sync')} 
                      size="sm"
                      className="flex-1"
                    >
                      <GitFork className="h-3 w-3 mr-2" />
                      Sync Mode
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="flex-1">
            <ScrollArea className="h-full">
              {recentRepos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent repositories</p>
                  <p className="text-sm">Repositories you connect will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleRepoClick(repo)}
                      className="w-full text-left p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{repo.name}</h3>
                        {repo.private ? (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                        <Badge variant="outline" className="text-xs">Recent</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {repo.description || "No description"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
