/**
 * Plugin System for Autonomous Code Wizard
 * Allows extensibility through a plugin architecture
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: 'code-generation' | 'ui-enhancement' | 'integration' | 'analysis' | 'deployment' | 'other';
  icon?: string;
  enabled: boolean;
  config?: Record<string, any>;
  
  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  
  // Extension points
  hooks?: PluginHooks;
}

export interface PluginHooks {
  // Code generation hooks
  beforeCodeGeneration?: (context: CodeGenerationContext) => Promise<CodeGenerationContext>;
  afterCodeGeneration?: (result: GeneratedCode) => Promise<GeneratedCode>;
  
  // UI hooks
  registerCommands?: () => Command[];
  registerMenuItems?: () => MenuItem[];
  registerPanels?: () => Panel[];
  
  // Analysis hooks
  onFileChange?: (file: FileChange) => Promise<void>;
  onCodeAnalysis?: (analysis: CodeAnalysis) => Promise<void>;
  
  // Deployment hooks
  beforeDeploy?: (config: DeploymentConfig) => Promise<DeploymentConfig>;
  afterDeploy?: (result: DeploymentResult) => Promise<void>;
}

export interface CodeGenerationContext {
  task: string;
  context: string;
  files: Array<{ path: string; content: string }>;
  metadata: Record<string, any>;
}

export interface GeneratedCode {
  files: Array<{ path: string; content: string }>;
  quality: number;
  suggestions: string[];
}

export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  execute: () => Promise<void>;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  position: 'toolbar' | 'context-menu' | 'settings';
}

export interface Panel {
  id: string;
  title: string;
  icon?: string;
  component: React.ComponentType<any>;
  position: 'left' | 'right' | 'bottom';
}

export interface FileChange {
  path: string;
  type: 'create' | 'update' | 'delete';
  content?: string;
}

export interface CodeAnalysis {
  file: string;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
  }>;
  metrics: Record<string, number>;
}

export interface DeploymentConfig {
  platform: string;
  config: Record<string, any>;
  files: Array<{ path: string; content: string }>;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  logs: string[];
  errors?: string[];
}

class PluginSystemManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Function[]> = new Map();
  
  constructor() {
    this.loadPluginsFromStorage();
  }
  
  /**
   * Register a new plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }
    
    this.plugins.set(plugin.id, plugin);
    
    // Register hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, hookFn]) => {
        this.registerHook(hookName, hookFn);
      });
    }
    
    // Call onInstall hook
    if (plugin.onInstall) {
      await plugin.onInstall();
    }
    
    // If enabled by default, enable it
    if (plugin.enabled && plugin.onEnable) {
      await plugin.onEnable();
    }
    
    this.savePluginsToStorage();
  }
  
  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Call onUninstall hook
    if (plugin.onUninstall) {
      await plugin.onUninstall();
    }
    
    // Remove hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, hookFn]) => {
        this.unregisterHook(hookName, hookFn);
      });
    }
    
    this.plugins.delete(pluginId);
    this.savePluginsToStorage();
  }
  
  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    plugin.enabled = true;
    
    if (plugin.onEnable) {
      await plugin.onEnable();
    }
    
    this.savePluginsToStorage();
  }
  
  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    plugin.enabled = false;
    
    if (plugin.onDisable) {
      await plugin.onDisable();
    }
    
    this.savePluginsToStorage();
  }
  
  /**
   * Get all plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return this.getPlugins().filter(p => p.enabled);
  }
  
  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Update plugin config
   */
  updatePluginConfig(pluginId: string, config: Record<string, any>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    plugin.config = { ...plugin.config, ...config };
    this.savePluginsToStorage();
  }
  
  /**
   * Register a hook
   */
  private registerHook(hookName: string, hookFn: Function): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(hookFn);
  }
  
  /**
   * Unregister a hook
   */
  private unregisterHook(hookName: string, hookFn: Function): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const index = hooks.indexOf(hookFn);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
  
  /**
   * Execute hooks
   */
  async executeHook<T>(hookName: string, data: T): Promise<T> {
    const hooks = this.hooks.get(hookName) || [];
    let result = data;
    
    for (const hook of hooks) {
      try {
        result = await hook(result);
      } catch (error) {
        console.error(`Error executing hook ${hookName}:`, error);
      }
    }
    
    return result;
  }
  
  /**
   * Get all commands from plugins
   */
  getCommands(): Command[] {
    const commands: Command[] = [];
    
    this.getEnabledPlugins().forEach(plugin => {
      if (plugin.hooks?.registerCommands) {
        commands.push(...plugin.hooks.registerCommands());
      }
    });
    
    return commands;
  }
  
  /**
   * Get all menu items from plugins
   */
  getMenuItems(): MenuItem[] {
    const items: MenuItem[] = [];
    
    this.getEnabledPlugins().forEach(plugin => {
      if (plugin.hooks?.registerMenuItems) {
        items.push(...plugin.hooks.registerMenuItems());
      }
    });
    
    return items;
  }
  
  /**
   * Get all panels from plugins
   */
  getPanels(): Panel[] {
    const panels: Panel[] = [];
    
    this.getEnabledPlugins().forEach(plugin => {
      if (plugin.hooks?.registerPanels) {
        panels.push(...plugin.hooks.registerPanels());
      }
    });
    
    return panels;
  }
  
  /**
   * Save plugins to localStorage
   */
  private savePluginsToStorage(): void {
    const pluginData = Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      enabled: p.enabled,
      config: p.config,
    }));
    
    localStorage.setItem('plugins', JSON.stringify(pluginData));
  }
  
  /**
   * Load plugins from localStorage
   */
  private loadPluginsFromStorage(): void {
    try {
      const data = localStorage.getItem('plugins');
      if (data) {
        const pluginData = JSON.parse(data);
        // This would be where we restore plugin state
        // Actual plugin code would be loaded from a plugin registry
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }
}

// Singleton instance
export const pluginSystem = new PluginSystemManager();

// Example plugins that come bundled
export const bundledPlugins: Plugin[] = [
  {
    id: 'prettier-formatter',
    name: 'Prettier Code Formatter',
    version: '1.0.0',
    description: 'Auto-format code using Prettier',
    author: 'Autonomous Code Wizard',
    category: 'code-generation',
    icon: '🎨',
    enabled: true,
    hooks: {
      afterCodeGeneration: async (result) => {
        // Format code using Prettier (simplified)
        return result;
      },
    },
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    version: '1.0.0',
    description: 'Scan code for security vulnerabilities',
    author: 'Autonomous Code Wizard',
    category: 'analysis',
    icon: '🔒',
    enabled: true,
    hooks: {
      onCodeAnalysis: async (analysis) => {
        // Add security analysis
        console.log('Running security scan...');
      },
    },
  },
  {
    id: 'git-integration',
    name: 'Git Integration',
    version: '1.0.0',
    description: 'Enhanced Git integration with commit suggestions',
    author: 'Autonomous Code Wizard',
    category: 'integration',
    icon: '🔀',
    enabled: false,
    hooks: {
      registerCommands: () => [
        {
          id: 'git-commit-smart',
          name: 'Smart Commit',
          description: 'Create AI-generated commit message',
          execute: async () => {
            console.log('Generating commit message...');
          },
        },
      ],
    },
  },
];
