/**
 * Analytics Service
 * Track and analyze platform usage, performance, and insights
 */

export interface AnalyticsMetrics {
  totalProjects: number;
  totalFiles: number;
  totalLines: number;
  totalDeployments: number;
  totalAIRequests: number;
  activeUsers: number;
  averageQuality: number;
  successRate: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface ProjectMetrics {
  id: string;
  name: string;
  filesGenerated: number;
  linesOfCode: number;
  quality: number;
  deployments: number;
  lastUpdated: string;
  language: string;
  framework: string;
}

export interface AIUsageMetrics {
  model: string;
  requests: number;
  tokensUsed: number;
  averageResponseTime: number;
  successRate: number;
  cost: number;
}

export interface PerformanceMetrics {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface TopPattern {
  pattern: string;
  timesUsed: number;
  successRate: number;
  category: string;
}

class AnalyticsService {
  private projects: ProjectMetrics[] = [];
  private aiUsage: AIUsageMetrics[] = [];
  private performanceData: Map<string, TimeSeriesData[]> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  /**
   * Initialize with demo analytics data
   */
  private initializeDemoData(): void {
    // Demo projects
    this.projects = [
      {
        id: 'proj-1',
        name: 'E-commerce Platform',
        filesGenerated: 45,
        linesOfCode: 8234,
        quality: 92,
        deployments: 12,
        lastUpdated: '2024-11-01',
        language: 'TypeScript',
        framework: 'React',
      },
      {
        id: 'proj-2',
        name: 'Admin Dashboard',
        filesGenerated: 32,
        linesOfCode: 5678,
        quality: 88,
        deployments: 8,
        lastUpdated: '2024-10-30',
        language: 'TypeScript',
        framework: 'Next.js',
      },
      {
        id: 'proj-3',
        name: 'REST API',
        filesGenerated: 23,
        linesOfCode: 3421,
        quality: 95,
        deployments: 15,
        lastUpdated: '2024-10-28',
        language: 'TypeScript',
        framework: 'Express',
      },
      {
        id: 'proj-4',
        name: 'AI Chatbot',
        filesGenerated: 18,
        linesOfCode: 2987,
        quality: 90,
        deployments: 6,
        lastUpdated: '2024-10-25',
        language: 'Python',
        framework: 'FastAPI',
      },
      {
        id: 'proj-5',
        name: 'Landing Page',
        filesGenerated: 12,
        linesOfCode: 1543,
        quality: 87,
        deployments: 4,
        lastUpdated: '2024-10-22',
        language: 'TypeScript',
        framework: 'React',
      },
    ];

    // Demo AI usage
    this.aiUsage = [
      {
        model: 'gemini-2.5-pro',
        requests: 1234,
        tokensUsed: 2456789,
        averageResponseTime: 1.8,
        successRate: 96.5,
        cost: 12.34,
      },
      {
        model: 'gemini-2.5-flash',
        requests: 3456,
        tokensUsed: 4567890,
        averageResponseTime: 0.9,
        successRate: 98.2,
        cost: 8.76,
      },
    ];

    // Demo time series data
    const now = Date.now();
    const generateTimeSeries = (baseValue: number, variance: number, points: number) => {
      return Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: baseValue + (Math.random() - 0.5) * variance,
      }));
    };

    this.performanceData.set('projects', generateTimeSeries(5, 3, 30));
    this.performanceData.set('files', generateTimeSeries(50, 20, 30));
    this.performanceData.set('deployments', generateTimeSeries(10, 5, 30));
    this.performanceData.set('aiRequests', generateTimeSeries(100, 40, 30));
    this.performanceData.set('quality', generateTimeSeries(90, 5, 30));
  }

  /**
   * Get overall metrics
   */
  getOverallMetrics(): AnalyticsMetrics {
    const totalFiles = this.projects.reduce((sum, p) => sum + p.filesGenerated, 0);
    const totalLines = this.projects.reduce((sum, p) => sum + p.linesOfCode, 0);
    const totalDeployments = this.projects.reduce((sum, p) => sum + p.deployments, 0);
    const totalAIRequests = this.aiUsage.reduce((sum, m) => sum + m.requests, 0);
    const averageQuality = this.projects.reduce((sum, p) => sum + p.quality, 0) / this.projects.length;
    const averageSuccessRate = this.aiUsage.reduce((sum, m) => sum + m.successRate, 0) / this.aiUsage.length;

    return {
      totalProjects: this.projects.length,
      totalFiles,
      totalLines,
      totalDeployments,
      totalAIRequests,
      activeUsers: 1, // Demo: single user
      averageQuality: Math.round(averageQuality),
      successRate: Math.round(averageSuccessRate),
    };
  }

  /**
   * Get time series data
   */
  getTimeSeriesData(metric: string): TimeSeriesData[] {
    return this.performanceData.get(metric) || [];
  }

  /**
   * Get project metrics
   */
  getProjectMetrics(): ProjectMetrics[] {
    return this.projects;
  }

  /**
   * Get AI usage metrics
   */
  getAIUsageMetrics(): AIUsageMetrics[] {
    return this.aiUsage;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    const metrics: PerformanceMetrics[] = [
      {
        metric: 'Average Generation Time',
        value: 12.5,
        unit: 'seconds',
        trend: 'down',
        change: -15,
      },
      {
        metric: 'Code Quality Score',
        value: 91,
        unit: 'out of 100',
        trend: 'up',
        change: 5,
      },
      {
        metric: 'Success Rate',
        value: 97,
        unit: '%',
        trend: 'stable',
        change: 0,
      },
      {
        metric: 'Average File Size',
        value: 234,
        unit: 'lines',
        trend: 'stable',
        change: 2,
      },
      {
        metric: 'API Response Time',
        value: 1.2,
        unit: 'seconds',
        trend: 'down',
        change: -20,
      },
      {
        metric: 'Deployment Success',
        value: 95,
        unit: '%',
        trend: 'up',
        change: 3,
      },
    ];

    return metrics;
  }

  /**
   * Get top patterns
   */
  getTopPatterns(): TopPattern[] {
    return [
      {
        pattern: 'React Component with Hooks',
        timesUsed: 156,
        successRate: 98,
        category: 'Frontend',
      },
      {
        pattern: 'REST API Endpoint',
        timesUsed: 134,
        successRate: 96,
        category: 'Backend',
      },
      {
        pattern: 'Authentication Flow',
        timesUsed: 89,
        successRate: 94,
        category: 'Security',
      },
      {
        pattern: 'Database Model',
        timesUsed: 78,
        successRate: 97,
        category: 'Backend',
      },
      {
        pattern: 'Form Validation',
        timesUsed: 67,
        successRate: 99,
        category: 'Frontend',
      },
      {
        pattern: 'API Client',
        timesUsed: 54,
        successRate: 95,
        category: 'Integration',
      },
      {
        pattern: 'Unit Tests',
        timesUsed: 43,
        successRate: 92,
        category: 'Testing',
      },
      {
        pattern: 'State Management',
        timesUsed: 38,
        successRate: 93,
        category: 'Frontend',
      },
    ];
  }

  /**
   * Get language distribution
   */
  getLanguageDistribution(): { language: string; count: number; percentage: number }[] {
    const langCount = new Map<string, number>();
    
    this.projects.forEach(project => {
      langCount.set(project.language, (langCount.get(project.language) || 0) + 1);
    });

    const total = this.projects.length;
    return Array.from(langCount.entries()).map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  /**
   * Get framework distribution
   */
  getFrameworkDistribution(): { framework: string; count: number; percentage: number }[] {
    const frameworkCount = new Map<string, number>();
    
    this.projects.forEach(project => {
      frameworkCount.set(project.framework, (frameworkCount.get(project.framework) || 0) + 1);
    });

    const total = this.projects.length;
    return Array.from(frameworkCount.entries()).map(([framework, count]) => ({
      framework,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  /**
   * Get cost analysis
   */
  getCostAnalysis(): {
    totalCost: number;
    costPerProject: number;
    costPerRequest: number;
    breakdown: { model: string; cost: number; percentage: number }[];
  } {
    const totalCost = this.aiUsage.reduce((sum, m) => sum + m.cost, 0);
    const totalRequests = this.aiUsage.reduce((sum, m) => sum + m.requests, 0);

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerProject: Math.round((totalCost / this.projects.length) * 100) / 100,
      costPerRequest: Math.round((totalCost / totalRequests) * 1000) / 1000,
      breakdown: this.aiUsage.map(m => ({
        model: m.model,
        cost: Math.round(m.cost * 100) / 100,
        percentage: Math.round((m.cost / totalCost) * 100),
      })),
    };
  }

  /**
   * Track project creation
   */
  trackProjectCreation(project: Omit<ProjectMetrics, 'id'>): void {
    this.projects.push({
      id: `proj-${Date.now()}`,
      ...project,
    });
  }

  /**
   * Track AI request
   */
  trackAIRequest(model: string, tokensUsed: number, responseTime: number, success: boolean): void {
    const usage = this.aiUsage.find(m => m.model === model);
    
    if (usage) {
      usage.requests++;
      usage.tokensUsed += tokensUsed;
      usage.averageResponseTime = 
        (usage.averageResponseTime * (usage.requests - 1) + responseTime) / usage.requests;
      usage.successRate = 
        (usage.successRate * (usage.requests - 1) + (success ? 100 : 0)) / usage.requests;
      // Simplified cost calculation
      usage.cost += tokensUsed * 0.000001;
    }
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify({
      metrics: this.getOverallMetrics(),
      projects: this.projects,
      aiUsage: this.aiUsage,
      performance: this.getPerformanceMetrics(),
      patterns: this.getTopPatterns(),
      languages: this.getLanguageDistribution(),
      frameworks: this.getFrameworkDistribution(),
      costs: this.getCostAnalysis(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
