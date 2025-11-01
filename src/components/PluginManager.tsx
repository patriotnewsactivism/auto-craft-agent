import { useState, useEffect } from 'react';
import { Puzzle, Download, Trash2, Settings as SettingsIcon, Power, PowerOff, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { pluginSystem, Plugin, bundledPlugins } from '@/lib/pluginSystem';

export const PluginManager = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadPlugins();
    
    // Register bundled plugins if not already registered
    bundledPlugins.forEach(plugin => {
      try {
        if (!pluginSystem.getPlugin(plugin.id)) {
          pluginSystem.registerPlugin(plugin);
        }
      } catch (error) {
        // Plugin already registered
      }
    });
  }, []);

  const loadPlugins = () => {
    setPlugins(pluginSystem.getPlugins());
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await pluginSystem.enablePlugin(pluginId);
        toast({
          title: 'Plugin Enabled',
          description: 'Plugin has been enabled successfully',
        });
      } else {
        await pluginSystem.disablePlugin(pluginId);
        toast({
          title: 'Plugin Disabled',
          description: 'Plugin has been disabled',
        });
      }
      loadPlugins();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle plugin',
        variant: 'destructive',
      });
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await pluginSystem.unregisterPlugin(pluginId);
      toast({
        title: 'Plugin Uninstalled',
        description: 'Plugin has been removed',
      });
      loadPlugins();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to uninstall plugin',
        variant: 'destructive',
      });
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Plugins' },
    { id: 'code-generation', name: 'Code Generation' },
    { id: 'ui-enhancement', name: 'UI Enhancement' },
    { id: 'integration', name: 'Integration' },
    { id: 'analysis', name: 'Analysis' },
    { id: 'deployment', name: 'Deployment' },
    { id: 'other', name: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Puzzle className="h-8 w-8 text-primary" />
            <span className="gradient-text">Plugin Manager</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Extend functionality with plugins
          </p>
        </div>
        <Button variant="default" className="animated-gradient">
          <Download className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 md:grid-cols-7">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Plugin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Plugins</div>
          <div className="text-2xl font-bold">{plugins.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Enabled</div>
          <div className="text-2xl font-bold text-green-500">
            {plugins.filter(p => p.enabled).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Disabled</div>
          <div className="text-2xl font-bold text-muted-foreground">
            {plugins.filter(p => !p.enabled).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Available Updates</div>
          <div className="text-2xl font-bold text-blue-500">0</div>
        </Card>
      </div>

      {/* Plugin List */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map(plugin => (
            <Card key={plugin.id} className="p-4 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-3xl">{plugin.icon || '🔌'}</div>
                  <div>
                    <h3 className="font-bold">{plugin.name}</h3>
                    <p className="text-xs text-muted-foreground">v{plugin.version} by {plugin.author}</p>
                  </div>
                </div>
                <Switch
                  checked={plugin.enabled}
                  onCheckedChange={(checked) => handleTogglePlugin(plugin.id, checked)}
                />
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {plugin.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={plugin.enabled ? 'default' : 'secondary'}>
                  {plugin.enabled ? (
                    <>
                      <Power className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
                <Badge variant="outline">{plugin.category}</Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <SettingsIcon className="h-3 w-3 mr-1" />
                  Configure
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUninstallPlugin(plugin.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredPlugins.length === 0 && (
          <div className="text-center py-12">
            <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No plugins found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
