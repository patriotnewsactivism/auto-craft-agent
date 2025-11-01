import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LivePreviewProps {
  files: Array<{ path: string; content: string }>;
  onRefresh?: () => void;
}

export function LivePreview({ files, onRefresh }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { toast } = useToast();

  useEffect(() => {
    updatePreview();
  }, [files]);

  // Build and inject code into iframe
  async function updatePreview() {
    if (!iframeRef.current || files.length === 0) return;

    setIsLoading(true);

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) return;

      // Find HTML, CSS, and JS files
      const htmlFile = files.find(f => f.path.endsWith('.html'));
      const cssFiles = files.filter(f => f.path.endsWith('.css'));
      const jsFiles = files.filter(f => 
        f.path.endsWith('.js') || f.path.endsWith('.jsx')
      );
      const tsFiles = files.filter(f => 
        f.path.endsWith('.ts') || f.path.endsWith('.tsx')
      );

      // Build the preview document
      let htmlContent = htmlFile?.content || `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
</body>
</html>
      `;

      // Inject CSS
      if (cssFiles.length > 0) {
        const cssStyles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
        htmlContent = htmlContent.replace('</head>', `${cssStyles}</head>`);
      }

      // Inject JavaScript (with module support)
      if (jsFiles.length > 0 || tsFiles.length > 0) {
        const allScripts = [...jsFiles, ...tsFiles];
        
        // For React/JSX files, transpile inline (simplified)
        const scripts = allScripts.map(f => {
          let code = f.content;
          
          // Simple JSX to JS transformation for preview
          if (f.path.endsWith('.jsx') || f.path.endsWith('.tsx')) {
            // This is a simplified version - in production, use Babel
            code = transpileJSXSimple(code);
          }
          
          return `<script type="module">\n${code}\n</script>`;
        }).join('\n');
        
        htmlContent = htmlContent.replace('</body>', `${scripts}</body>`);
      }

      // Add React CDN if React components detected
      if (files.some(f => f.content.includes('import React'))) {
        htmlContent = htmlContent.replace('</head>', `
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>`);
      }

      // Add error handling
      htmlContent = htmlContent.replace('</head>', `
  <script>
    window.onerror = function(msg, url, line, col, error) {
      console.error('Preview Error:', msg, 'at', line + ':' + col);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #fee; border-bottom: 2px solid #f00; padding: 10px; font-family: monospace; z-index: 9999;';
      errorDiv.innerHTML = '<strong>Error:</strong> ' + msg + ' at line ' + line;
      document.body.prepend(errorDiv);
      return false;
    };
    
    // Send console logs to parent
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      window.parent.postMessage({ type: 'console', method: 'log', args }, '*');
    };
  </script>
</head>`);

      // Write to iframe
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: 'Preview Error',
        description: error instanceof Error ? error.message : 'Failed to update preview',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Simple JSX transpiler (for basic preview)
  function transpileJSXSimple(code: string): string {
    // This is a very simplified transpiler for demo purposes
    // In production, use @babel/standalone or similar
    
    // Remove imports (they won't work in this context)
    code = code.replace(/import .* from ['"].*['"];?/g, '');
    
    // Convert JSX elements to React.createElement calls (very basic)
    // This won't handle all JSX correctly, but enough for simple previews
    code = code.replace(/<(\w+)([^>]*)>(.*?)<\/\1>/g, (match, tag, attrs, children) => {
      return `React.createElement('${tag}', ${attrs ? `{${attrs}}` : 'null'}, ${children ? `'${children}'` : 'null'})`;
    });
    
    return code;
  }

  // Open preview in new window
  function openInNewWindow() {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument;
    
    if (iframeDoc) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(iframeDoc.documentElement.outerHTML);
        newWindow.document.close();
      }
    }
  }

  // Get iframe dimensions based on view mode
  function getIframeStyle() {
    const styles: Record<string, React.CSSProperties> = {
      desktop: { width: '100%', height: '100%' },
      tablet: { width: '768px', height: '100%', margin: '0 auto' },
      mobile: { width: '375px', height: '100%', margin: '0 auto' },
    };
    return styles[viewMode];
  }

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* View Mode Buttons */}
          <Button
            size="sm"
            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
            onClick={() => setViewMode('mobile')}
            title="Mobile View"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'tablet' ? 'default' : 'ghost'}
            onClick={() => setViewMode('tablet')}
            title="Tablet View"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'desktop' ? 'default' : 'ghost'}
            onClick={() => setViewMode('desktop')}
            title="Desktop View"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Actions */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              updatePreview();
              if (onRefresh) onRefresh();
            }}
            title="Refresh Preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={openInNewWindow}
            title="Open in New Window"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto bg-white">
        <div style={{ ...getIframeStyle(), transition: 'width 0.3s ease' }}>
          <iframe
            ref={iframeRef}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white',
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground flex items-center justify-between">
        <span>{files.length} files loaded</span>
        <span className="capitalize">{viewMode} mode</span>
      </div>
    </Card>
  );
}
