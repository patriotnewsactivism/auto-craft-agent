import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Plus, Trash2, RefreshCw, Check, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  downloads?: number;
  repository?: string;
}

interface InstalledPackage extends PackageInfo {
  installedVersion: string;
  dev: boolean;
}

export function PackageManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PackageInfo[]>([]);
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const { toast } = useToast();

  // Load installed packages
  useEffect(() => {
    loadInstalledPackages();
  }, []);

  async function loadInstalledPackages() {
    try {
      // In a real implementation, this would read from package.json in VFS
      const mockPackages: InstalledPackage[] = [
        {
          name: 'react',
          version: '18.3.1',
          installedVersion: '18.3.1',
          description: 'React is a JavaScript library for building user interfaces',
          downloads: 10000000,
          dev: false,
        },
        {
          name: 'typescript',
          version: '5.8.3',
          installedVersion: '5.8.3',
          description: 'TypeScript is a language for application-scale JavaScript',
          downloads: 5000000,
          dev: true,
        },
      ];
      setInstalledPackages(mockPackages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load installed packages',
        variant: 'destructive',
      });
    }
  }

  async function searchPackages(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // In a real implementation, this would query npm registry
      // For now, simulate with popular packages
      const mockResults: PackageInfo[] = [
        {
          name: '@tanstack/react-query',
          version: '5.83.0',
          description: 'Powerful asynchronous state management for React',
          downloads: 2000000,
        },
        {
          name: 'axios',
          version: '1.6.0',
          description: 'Promise based HTTP client for the browser and node.js',
          downloads: 15000000,
        },
        {
          name: 'lodash',
          version: '4.17.21',
          description: 'Lodash modular utilities',
          downloads: 20000000,
        },
        {
          name: 'date-fns',
          version: '3.0.0',
          description: 'Modern JavaScript date utility library',
          downloads: 8000000,
        },
        {
          name: 'zod',
          version: '3.22.0',
          description: 'TypeScript-first schema validation',
          downloads: 3000000,
        },
      ].filter(pkg => 
        pkg.name.toLowerCase().includes(query.toLowerCase()) ||
        pkg.description.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Failed to search packages',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function installPackage(packageName: string, isDev: boolean = false) {
    setIsInstalling(packageName);

    try {
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find package info
      const packageInfo = searchResults.find(p => p.name === packageName);
      if (!packageInfo) return;

      // Add to installed packages
      const newPackage: InstalledPackage = {
        ...packageInfo,
        installedVersion: packageInfo.version,
        dev: isDev,
      };

      setInstalledPackages(prev => [...prev, newPackage]);

      toast({
        title: 'Package Installed',
        description: `${packageName}@${packageInfo.version} installed successfully`,
      });

      // Clear search
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: `Failed to install ${packageName}`,
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(null);
    }
  }

  async function uninstallPackage(packageName: string) {
    try {
      setInstalledPackages(prev => prev.filter(p => p.name !== packageName));
      
      toast({
        title: 'Package Removed',
        description: `${packageName} uninstalled successfully`,
      });
    } catch (error) {
      toast({
        title: 'Uninstall Failed',
        description: `Failed to uninstall ${packageName}`,
        variant: 'destructive',
      });
    }
  }

  async function updatePackage(packageName: string) {
    try {
      toast({
        title: 'Updating Package',
        description: `Updating ${packageName} to latest version...`,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Package Updated',
        description: `${packageName} updated successfully`,
      });

      loadInstalledPackages();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: `Failed to update ${packageName}`,
        variant: 'destructive',
      });
    }
  }

  function formatDownloads(downloads?: number): string {
    if (!downloads) return 'N/A';
    if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
    if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}K`;
    return downloads.toString();
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Package Manager</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadInstalledPackages}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchPackages(e.target.value);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Search Results */}
        {searchQuery && (
          <div className="p-3 border-b border-border bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Search Results {isSearching && '(searching...)'}
            </p>
            <ScrollArea className="h-48">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No packages found
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((pkg) => {
                    const isInstalled = installedPackages.some(p => p.name === pkg.name);
                    const installing = isInstalling === pkg.name;

                    return (
                      <div
                        key={pkg.name}
                        className="flex items-start gap-2 p-2 rounded border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium truncate">
                              {pkg.name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              v{pkg.version}
                            </Badge>
                            {pkg.downloads && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {formatDownloads(pkg.downloads)}/wk
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isInstalled ? (
                            <Button size="sm" variant="outline" disabled>
                              <Check className="h-3 w-3" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => installPackage(pkg.name, false)}
                                disabled={installing}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => installPackage(pkg.name, true)}
                                disabled={installing}
                                title="Install as dev dependency"
                              >
                                <Plus className="h-3 w-3" />
                                <span className="text-xs ml-1">Dev</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Installed Packages */}
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Installed Packages ({installedPackages.length})
          </p>
          <ScrollArea className={searchQuery ? 'h-64' : 'h-full'}>
            {installedPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No packages installed
              </p>
            ) : (
              <div className="space-y-2">
                {installedPackages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-start gap-2 p-2 rounded border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium truncate">
                          {pkg.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          v{pkg.installedVersion}
                        </Badge>
                        {pkg.dev && (
                          <Badge variant="secondary" className="text-xs">
                            dev
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {pkg.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updatePackage(pkg.name)}
                        title="Update package"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => uninstallPackage(pkg.name)}
                        title="Uninstall package"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span>npm • auto-install enabled</span>
      </div>
    </Card>
  );
}
