import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Download, DollarSign, Clock, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { analyticsService, AnalyticsMetrics, ProjectMetrics, AIUsageMetrics, PerformanceMetrics } from '@/lib/analyticsService';

export const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [projects, setProjects] = useState<ProjectMetrics[]>([]);
  const [aiUsage, setAIUsage] = useState<AIUsageMetrics[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setMetrics(analyticsService.getOverallMetrics());
    setProjects(analyticsService.getProjectMetrics());
    setAIUsage(analyticsService.getAIUsageMetrics());
    setPerformance(analyticsService.getPerformanceMetrics());
  };

  const handleExportData = () => {
    try {
      const data = analyticsService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Analytics Exported',
        description: 'Your analytics data has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', change: number) => {
    if (trend === 'stable') return 'text-muted-foreground';
    // Positive changes for down trends on time/cost metrics
    if ((trend === 'down' && change < 0) || (trend === 'up' && change > 0)) {
      return 'text-green-500';
    }
    return 'text-red-500';
  };

  const languages = analyticsService.getLanguageDistribution();
  const frameworks = analyticsService.getFrameworkDistribution();
  const topPatterns = analyticsService.getTopPatterns();
  const costAnalysis = analyticsService.getCostAnalysis();

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="gradient-text">Analytics Dashboard</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your productivity and insights
          </p>
        </div>
        <Button variant="outline" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Projects</div>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{metrics.totalProjects}</div>
          <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            +12% from last month
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Files Generated</div>
            <Zap className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-3xl font-bold">{metrics.totalFiles}</div>
          <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            +8% from last month
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Quality Score</div>
            <Target className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-3xl font-bold">{metrics.averageQuality}%</div>
          <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            +5% from last month
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">AI Requests</div>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-3xl font-bold">{metrics.totalAIRequests.toLocaleString()}</div>
          <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            +18% from last month
          </div>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Project Metrics</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {projects.map(project => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline">{project.language}</Badge>
                          <Badge variant="outline">{project.framework}</Badge>
                        </div>
                      </div>
                      <Badge variant="default">
                        {project.quality}% Quality
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Files</div>
                        <div className="font-semibold">{project.filesGenerated}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Lines</div>
                        <div className="font-semibold">{project.linesOfCode.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Deployments</div>
                        <div className="font-semibold">{project.deployments}</div>
                      </div>
                    </div>
                    
                    <Progress value={project.quality} className="mt-3" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Language & Framework Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Languages</h3>
              <div className="space-y-3">
                {languages.map(lang => (
                  <div key={lang.language}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{lang.language}</span>
                      <span className="text-sm font-semibold">{lang.percentage}%</span>
                    </div>
                    <Progress value={lang.percentage} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Frameworks</h3>
              <div className="space-y-3">
                {frameworks.map(fw => (
                  <div key={fw.framework}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{fw.framework}</span>
                      <span className="text-sm font-semibold">{fw.percentage}%</span>
                    </div>
                    <Progress value={fw.percentage} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiUsage.map(model => (
              <Card key={model.model} className="p-6">
                <h3 className="text-xl font-bold mb-4">{model.model}</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Requests</span>
                      <span className="font-semibold">{model.requests.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Tokens Used</span>
                      <span className="font-semibold">{model.tokensUsed.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Avg Response Time</span>
                      <span className="font-semibold">{model.averageResponseTime.toFixed(2)}s</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-semibold">{model.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={model.successRate} />
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Est. Cost</span>
                      <span className="font-semibold text-lg">${model.cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Cost Analysis */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Analysis
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-2xl font-bold">${costAnalysis.totalCost}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Cost per Project</div>
                <div className="text-2xl font-bold">${costAnalysis.costPerProject}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Cost per Request</div>
                <div className="text-2xl font-bold">${costAnalysis.costPerRequest}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {costAnalysis.breakdown.map(item => (
                <div key={item.model}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{item.model}</span>
                    <span className="text-sm font-semibold">${item.cost} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performance.map(metric => (
              <Card key={metric.metric} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">{metric.metric}</div>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="text-3xl font-bold">
                  {metric.value} <span className="text-lg text-muted-foreground">{metric.unit}</span>
                </div>
                <div className={`text-xs flex items-center gap-1 mt-1 ${getTrendColor(metric.trend, metric.change)}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Top Patterns</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {topPatterns.map((pattern, index) => (
                  <div key={pattern.pattern} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <h4 className="font-semibold">{pattern.pattern}</h4>
                        </div>
                        <Badge variant="secondary" className="mt-1">{pattern.category}</Badge>
                      </div>
                      <Badge variant="default">{pattern.successRate}% Success</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-muted-foreground">Times Used</span>
                      <span className="font-semibold">{pattern.timesUsed}</span>
                    </div>
                    
                    <Progress value={pattern.successRate} className="mt-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
