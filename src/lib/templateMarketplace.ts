/**
 * Template Marketplace Service
 * Browse, download, and manage project templates
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  downloads: number;
  rating: number;
  reviews: number;
  version: string;
  lastUpdated: string;
  thumbnail?: string;
  demoUrl?: string;
  githubUrl?: string;
  license: string;
  
  // Template content
  files: Array<{
    path: string;
    content: string;
  }>;
  
  // Dependencies
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  
  // Configuration
  config?: {
    framework?: string;
    language?: string;
    styling?: string;
    features?: string[];
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

class TemplateMarketplaceService {
  private templates: Template[] = [];
  private categories: TemplateCategory[] = [
    { id: 'web-app', name: 'Web Applications', icon: '🌐', count: 0 },
    { id: 'mobile', name: 'Mobile Apps', icon: '📱', count: 0 },
    { id: 'backend', name: 'Backend APIs', icon: '⚙️', count: 0 },
    { id: 'fullstack', name: 'Full Stack', icon: '🚀', count: 0 },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', count: 0 },
    { id: 'dashboard', name: 'Dashboards', icon: '📊', count: 0 },
    { id: 'landing', name: 'Landing Pages', icon: '📄', count: 0 },
    { id: 'saas', name: 'SaaS Starters', icon: '💼', count: 0 },
    { id: 'ai-ml', name: 'AI/ML Projects', icon: '🤖', count: 0 },
    { id: 'blockchain', name: 'Blockchain/Web3', icon: '⛓️', count: 0 },
  ];

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize with marketplace templates
   */
  private initializeTemplates(): void {
    this.templates = [
      // Web Applications
      {
        id: 'react-typescript-starter',
        name: 'React + TypeScript Starter',
        description: 'Modern React application with TypeScript, Tailwind CSS, and shadcn/ui',
        category: 'web-app',
        tags: ['react', 'typescript', 'tailwind', 'shadcn'],
        author: 'Autonomous Code Wizard',
        downloads: 1523,
        rating: 4.8,
        reviews: 142,
        version: '1.2.0',
        lastUpdated: '2024-11-01',
        license: 'MIT',
        files: [],
        dependencies: {
          'react': '^18.2.0',
          'typescript': '^5.0.0',
          'tailwindcss': '^3.3.0',
        },
        config: {
          framework: 'react',
          language: 'typescript',
          styling: 'tailwind',
          features: ['routing', 'state-management', 'api-client'],
        },
      },
      {
        id: 'next-app-router',
        name: 'Next.js App Router Template',
        description: 'Next.js 14 with App Router, Server Components, and API routes',
        category: 'fullstack',
        tags: ['nextjs', 'react', 'typescript', 'app-router'],
        author: 'Autonomous Code Wizard',
        downloads: 2134,
        rating: 4.9,
        reviews: 203,
        version: '2.0.0',
        lastUpdated: '2024-11-01',
        license: 'MIT',
        files: [],
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
        },
        config: {
          framework: 'nextjs',
          language: 'typescript',
          features: ['ssr', 'api-routes', 'server-components'],
        },
      },
      
      // E-commerce
      {
        id: 'ecommerce-storefront',
        name: 'E-commerce Storefront',
        description: 'Complete e-commerce platform with cart, checkout, and payment integration',
        category: 'ecommerce',
        tags: ['react', 'stripe', 'cart', 'checkout'],
        author: 'Autonomous Code Wizard',
        downloads: 892,
        rating: 4.7,
        reviews: 78,
        version: '1.5.0',
        lastUpdated: '2024-10-28',
        license: 'MIT',
        files: [],
        config: {
          features: ['cart', 'checkout', 'payment', 'product-catalog'],
        },
      },
      
      // SaaS
      {
        id: 'saas-starter-kit',
        name: 'SaaS Starter Kit',
        description: 'Complete SaaS boilerplate with auth, billing, team management, and more',
        category: 'saas',
        tags: ['saas', 'auth', 'billing', 'teams'],
        author: 'Autonomous Code Wizard',
        downloads: 1756,
        rating: 4.9,
        reviews: 164,
        version: '3.0.0',
        lastUpdated: '2024-11-01',
        license: 'Commercial',
        files: [],
        config: {
          features: ['authentication', 'billing', 'teams', 'admin-panel', 'api'],
        },
      },
      
      // Dashboard
      {
        id: 'admin-dashboard',
        name: 'Admin Dashboard',
        description: 'Beautiful admin dashboard with charts, tables, and analytics',
        category: 'dashboard',
        tags: ['dashboard', 'admin', 'charts', 'analytics'],
        author: 'Autonomous Code Wizard',
        downloads: 3421,
        rating: 4.8,
        reviews: 312,
        version: '2.1.0',
        lastUpdated: '2024-10-30',
        license: 'MIT',
        files: [],
        config: {
          features: ['charts', 'tables', 'analytics', 'crud'],
        },
      },
      
      // Backend
      {
        id: 'express-api-template',
        name: 'Express REST API',
        description: 'Production-ready Express API with authentication and database',
        category: 'backend',
        tags: ['express', 'api', 'rest', 'mongodb'],
        author: 'Autonomous Code Wizard',
        downloads: 1234,
        rating: 4.6,
        reviews: 98,
        version: '1.8.0',
        lastUpdated: '2024-10-29',
        license: 'MIT',
        files: [],
        config: {
          features: ['rest-api', 'auth', 'database', 'validation'],
        },
      },
      
      // AI/ML
      {
        id: 'ai-chatbot-starter',
        name: 'AI Chatbot Starter',
        description: 'AI-powered chatbot with OpenAI/Gemini integration',
        category: 'ai-ml',
        tags: ['ai', 'chatbot', 'openai', 'gemini'],
        author: 'Autonomous Code Wizard',
        downloads: 2567,
        rating: 4.9,
        reviews: 234,
        version: '1.3.0',
        lastUpdated: '2024-11-01',
        license: 'MIT',
        files: [],
        config: {
          features: ['ai-chat', 'streaming', 'context-memory'],
        },
      },
      
      // Landing Pages
      {
        id: 'landing-page-saas',
        name: 'SaaS Landing Page',
        description: 'High-converting landing page template for SaaS products',
        category: 'landing',
        tags: ['landing', 'saas', 'marketing'],
        author: 'Autonomous Code Wizard',
        downloads: 1876,
        rating: 4.7,
        reviews: 156,
        version: '1.0.0',
        lastUpdated: '2024-10-27',
        license: 'MIT',
        files: [],
        config: {
          features: ['responsive', 'seo', 'analytics'],
        },
      },
      
      // Blockchain
      {
        id: 'web3-dapp-template',
        name: 'Web3 DApp Template',
        description: 'Decentralized app with wallet connection and smart contract integration',
        category: 'blockchain',
        tags: ['web3', 'ethereum', 'dapp', 'wallet'],
        author: 'Autonomous Code Wizard',
        downloads: 987,
        rating: 4.5,
        reviews: 67,
        version: '1.1.0',
        lastUpdated: '2024-10-26',
        license: 'MIT',
        files: [],
        config: {
          features: ['wallet-connect', 'smart-contracts', 'web3'],
        },
      },
      
      // Mobile
      {
        id: 'react-native-starter',
        name: 'React Native App',
        description: 'Cross-platform mobile app with navigation and state management',
        category: 'mobile',
        tags: ['react-native', 'mobile', 'ios', 'android'],
        author: 'Autonomous Code Wizard',
        downloads: 1432,
        rating: 4.6,
        reviews: 124,
        version: '1.4.0',
        lastUpdated: '2024-10-28',
        license: 'MIT',
        files: [],
        config: {
          features: ['navigation', 'state-management', 'api-client'],
        },
      },
    ];

    // Update category counts
    this.updateCategoryCounts();
  }

  /**
   * Update category counts
   */
  private updateCategoryCounts(): void {
    this.categories.forEach(category => {
      category.count = this.templates.filter(t => t.category === category.id).length;
    });
  }

  /**
   * Get all templates
   */
  getTemplates(): Template[] {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(categoryId: string): Template[] {
    return this.templates.filter(t => t.category === categoryId);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit = 10): Template[] {
    return [...this.templates]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get top-rated templates
   */
  getTopRatedTemplates(limit = 10): Template[] {
    return [...this.templates]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get recently updated templates
   */
  getRecentTemplates(limit = 10): Template[] {
    return [...this.templates]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  /**
   * Get all categories
   */
  getCategories(): TemplateCategory[] {
    return this.categories;
  }

  /**
   * Download template
   */
  async downloadTemplate(templateId: string): Promise<Template> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment download count
    template.downloads++;

    // In a real implementation, this would fetch the actual template files
    // For now, return the template metadata
    return template;
  }

  /**
   * Rate template
   */
  async rateTemplate(templateId: string, rating: number): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Update rating (simplified calculation)
    const totalRating = template.rating * template.reviews;
    template.reviews++;
    template.rating = (totalRating + rating) / template.reviews;
  }

  /**
   * Add custom template
   */
  addCustomTemplate(template: Template): void {
    this.templates.push(template);
    this.updateCategoryCounts();
  }

  /**
   * Remove custom template
   */
  removeCustomTemplate(templateId: string): void {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index > -1) {
      this.templates.splice(index, 1);
      this.updateCategoryCounts();
    }
  }
}

// Singleton instance
export const templateMarketplace = new TemplateMarketplaceService();
