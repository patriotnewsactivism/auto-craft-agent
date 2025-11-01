import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Clock, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { autoBackupService, BackupPoint } from "@/lib/autoBackup";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BackupIndicatorProps {
  onRestoreBackup: (backup: BackupPoint) => void;
}

export const BackupIndicator = ({ onRestoreBackup }: BackupIndicatorProps) => {
  const [backups, setBackups] = useState<BackupPoint[]>([]);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, percentage: 0 });

  useEffect(() => {
    loadBackups();
    const interval = setInterval(loadBackups, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadBackups = () => {
    const allBackups = autoBackupService.getBackups();
    setBackups(allBackups);
    if (allBackups.length > 0) {
      setLastBackupTime(new Date(allBackups[0].timestamp));
    }
    setStorageInfo(autoBackupService.getStorageInfo());
  };

  const handleExportBackup = async (backupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await autoBackupService.exportBackupToZip(backupId);
    } catch (error) {
      console.error('Failed to export backup:', error);
    }
  };

  const handleDeleteBackup = (backupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    autoBackupService.deleteBackup(backupId);
    loadBackups();
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className={`h-4 w-4 ${backups.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="hidden md:inline">Auto-Backup</span>
          {backups.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {backups.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Auto-Backup Protection
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Your work is automatically backed up every 30 seconds
            </p>
          </div>

          {lastBackupTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last backup: {lastBackupTime.toLocaleTimeString()}
            </div>
          )}

          {/* Storage Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Storage Used</span>
              <span>{(storageInfo.used / 1024).toFixed(1)} KB / {(storageInfo.total / 1024).toFixed(0)} KB</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Backup List */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium">Recovery Points ({backups.length})</h5>
            {backups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No backups yet. Generate some code to create backups.
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {backups.map((backup) => (
                    <Card
                      key={backup.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => onRestoreBackup(backup)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {backup.projectState.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {backup.fileCount} files • {getTimeAgo(backup.timestamp)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleExportBackup(backup.id, e)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => handleDeleteBackup(backup.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {backups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm('Clear all backups? This cannot be undone.')) {
                  autoBackupService.clearAllBackups();
                  loadBackups();
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear All Backups
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
