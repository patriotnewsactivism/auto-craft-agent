import { useState, useEffect } from 'react';
import { Store, Download, Star, TrendingUp, Clock, Search, Filter, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { templateMarketplace, Template, TemplateCategory } from '@/lib/templateMarketplace';

export const TemplateMarketplace = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [view, setView] = useState<'popular' | 'top-rated' | 'recent'>('popular');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    setCategories(templateMarketplace.getCategories());
  }, [view]);

  const loadTemplates = () => {
    if (view === 'popular') {
      setTemplates(templateMarketplace.getPopularTemplates(20));
    } else if (view === 'top-rated') {
      setTemplates(templateMarketplace.getTopRatedTemplates(20));
    } else {
      setTemplates(templateMarketplace.getRecentTemplates(20));
    }
  };

  const handleDownloadTemplate = async (template: Template) => {
    try {
      await templateMarketplace.downloadTemplate(template.id);
      toast({
        title: 'Template Downloaded',
        description: `${template.name} is ready to use`,
      });
      loadTemplates(); // Refresh to show updated download count
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  const handleRateTemplate = async (templateId: string, rating: number) => {
    try {
      await templateMarketplace.rateTemplate(templateId, rating);
      toast({
        title: 'Rating Submitted',
        description: 'Thank you for your feedback!',
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Rating Failed',
        description: error instanceof Error ? error.message : 'Failed to submit rating',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = searchQuery
    ? templateMarketplace.searchTemplates(searchQuery)
    : selectedCategory === 'all'
    ? templates
    : templateMarketplace.getTemplatesByCategory(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="gradient-text">Template Marketplace</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Browse and download production-ready templates
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="top-rated">
            <Star className="h-4 w-4 mr-2" />
            Top Rated
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recently Updated
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Categories */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon} {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Template Grid */}
      <ScrollArea className="h-[700px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="p-6 hover-lift flex flex-col">
              {/* Template Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 4).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{template.rating.toFixed(1)}</span>
                  <span>({template.reviews})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{template.downloads.toLocaleString()}</span>
                </div>
              </div>

              {/* Author and Version */}
              <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
                <span>by {template.author}</span>
                <span>v{template.version}</span>
              </div>

              {/* Features */}
              {template.config?.features && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.config.features.slice(0, 3).map(feature => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {template.config.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.config.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto space-y-2">
                <Button
                  className="w-full animated-gradient"
                  onClick={() => handleDownloadTemplate(template)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
                
                <div className="flex gap-2">
                  {template.demoUrl && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={template.demoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {template.githubUrl && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={template.githubUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No templates found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
