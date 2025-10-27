import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SyncStatus as SyncStatusType, GitHubRepo } from "@/lib/githubService";
import { 
  RefreshCw, 
  GitBranch, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  GitCommit,
  Upload,
  Download
} from "lucide-react";

interface SyncStatusProps {
  repo: GitHubRepo | null;
  branch: string;
  status: SyncStatusType;
  onSync: () => void;
  onForceSync: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
  progress?: number;
}

export const SyncStatus = ({ 
  repo, 
  branch, 
  status, 
  onSync, 
  onForceSync, 
  onDisconnect,
  isLoading = false,
  progress = 0
}: SyncStatusProps) => {
  const [lastSyncText, setLastSyncText] = useState("");

  useEffect(() => {
    if (status.lastSync) {
      const updateLastSyncText = () => {
        const now = new Date();
        const diff = now.getTime() - status.lastSync!.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setLastSyncText(`${days}d ago`);
        } else if (hours > 0) {
          setLastSyncText(`${hours}h ago`);
        } else if (minutes > 0) {
          setLastSyncText(`${minutes}m ago`);
        } else {
          setLastSyncText("Just now");
        }
      };

      updateLastSyncText();
      const interval = setInterval(updateLastSyncText, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [status.lastSync]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'conflicted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'synced':
        return 'Up to date';
      case 'pending':
        return `${status.pendingChanges} changes pending`;
      case 'conflicted':
        return `${status.conflicts.length} conflicts`;
      case 'error':
        return 'Sync error';
      default:
        return 'Not connected';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'synced':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'conflicted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!repo) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No repository connected</p>
            <p className="text-sm">Connect to a GitHub repository to enable sync</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Sync
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Repository:</span>
            <span className="font-medium">{repo.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Branch:</span>
            <Badge variant="outline" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              {branch}
            </Badge>
          </div>
          {status.lastSync && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last sync:</span>
              <span>{lastSyncText}</span>
            </div>
          )}
        </div>

        {/* Progress Bar (shown during sync) */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Syncing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Status Details */}
        {status.status === 'pending' && status.pendingChanges > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Pending Changes</span>
            </div>
            <p className="text-sm text-yellow-700">
              {status.pendingChanges} file{status.pendingChanges !== 1 ? 's' : ''} ready to sync
            </p>
          </div>
        )}

        {status.status === 'conflicted' && status.conflicts.length > 0 && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Conflicts Detected</span>
            </div>
            <p className="text-sm text-red-700">
              {status.conflicts.length} file{status.conflicts.length !== 1 ? 's' : ''} have conflicts that need resolution
            </p>
          </div>
        )}

        {status.status === 'synced' && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">All Synced</span>
            </div>
            <p className="text-sm text-green-700">
              Local and remote repositories are in sync
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            size="sm" 
            onClick={onSync}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Now
          </Button>
          
          {status.status === 'error' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onForceSync}
              disabled={isLoading}
            >
              Force Sync
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDisconnect}
            disabled={isLoading}
          >
            Disconnect
          </Button>
        </div>

        {/* Connection Status */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center justify-between">
            <span>Connection:</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};