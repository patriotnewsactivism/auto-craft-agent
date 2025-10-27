import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, RefreshCw, CheckCircle2, XCircle, Clock, Upload, Download } from "lucide-react";
import { GitHubRepo } from "@/lib/githubService";

interface SyncStatusProps {
  connectedRepo: GitHubRepo | null;
  onSelectRepo: () => void;
  onSyncToGitHub: () => Promise<void>;
  onSyncFromGitHub: () => Promise<void>;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  onAutoSyncChange: (enabled: boolean) => void;
  syncInterval: number;
  onSyncIntervalChange: (interval: number) => void;
}

export const SyncStatus = ({
  connectedRepo,
  onSelectRepo,
  onSyncToGitHub,
  onSyncFromGitHub,
  lastSyncTime,
  isSyncing,
  autoSyncEnabled,
  onAutoSyncChange,
  syncInterval,
  onSyncIntervalChange,
}: SyncStatusProps) => {
  const [timeSinceSync, setTimeSinceSync] = useState<string>("");

  useEffect(() => {
    if (!lastSyncTime) return;

    const updateTimeSince = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
      
      if (diff < 60) setTimeSinceSync(`${diff}s ago`);
      else if (diff < 3600) setTimeSinceSync(`${Math.floor(diff / 60)}m ago`);
      else setTimeSinceSync(`${Math.floor(diff / 3600)}h ago`);
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Sync Status
        </CardTitle>
        <CardDescription>
          Configure bidirectional sync with your GitHub repository
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Connection */}
        <div className="space-y-2">
          <Label>Connected Repository</Label>
          {connectedRepo ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{connectedRepo.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {connectedRepo.description || "No description"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onSelectRepo}>
                Change
              </Button>
            </div>
          ) : (
            <Button onClick={onSelectRepo} className="w-full" variant="outline">
              <GitBranch className="h-4 w-4 mr-2" />
              Select Repository
            </Button>
          )}
        </div>

        {connectedRepo && (
          <>
            {/* Sync Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onSyncToGitHub}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Push to GitHub
              </Button>
              <Button
                onClick={onSyncFromGitHub}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Pull from GitHub
              </Button>
            </div>

            {/* Last Sync Info */}
            {lastSyncTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <Clock className="h-4 w-4" />
                <span>Last synced {timeSinceSync}</span>
              </div>
            )}

            {/* Auto-Sync Settings */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Periodically sync changes both ways
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={onAutoSyncChange}
                />
              </div>

              {autoSyncEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval</Label>
                  <Select
                    value={syncInterval.toString()}
                    onValueChange={(value) => onSyncIntervalChange(Number(value))}
                  >
                    <SelectTrigger id="sync-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30000">Every 30 seconds</SelectItem>
                      <SelectItem value="60000">Every 1 minute</SelectItem>
                      <SelectItem value="300000">Every 5 minutes</SelectItem>
                      <SelectItem value="600000">Every 10 minutes</SelectItem>
                      <SelectItem value="1800000">Every 30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {autoSyncEnabled && (
                <Badge variant="outline" className="w-fit">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Auto-sync active
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
