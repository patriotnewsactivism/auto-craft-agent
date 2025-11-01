import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, Play, Wand2, Download } from 'lucide-react';
import { AIService } from '@/lib/aiService';

interface MonacoEditorProps {
  file: {
    path: string;
    content: string;
    language?: string;
  };
  onChange: (content: string) => void;
  onSave?: (content: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  height?: string;
}

export function MonacoEditor({
  file,
  onChange,
  onSave,
  onRun,
  readOnly = false,
  height = '600px'
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const { toast } = useToast();
  const aiService = new AIService();

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor for maximum performance
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      snippetSuggestions: 'top',
      formatOnPaste: true,
      formatOnType: true,
    });

    // Add AI inline completion provider (Cursor-style)
    const completionProvider = monaco.languages.registerCompletionItemProvider(
      ['typescript', 'javascript', 'python', 'java', 'rust', 'go'],
      {
        triggerCharacters: ['.', ' ', '(', '{', '['],
        provideCompletionItems: async (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          try {
            // Get AI suggestions (simplified for performance)
            const suggestions = await getAISuggestions(textUntilPosition);
            
            return {
              suggestions: suggestions.map((suggestion, index) => ({
                label: suggestion.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: suggestion.insertText,
                detail: suggestion.detail,
                documentation: suggestion.documentation,
                sortText: `0${index}`,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              })),
            };
          } catch (error) {
            console.error('AI completion error:', error);
            return { suggestions: [] };
          }
        },
      }
    );

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        const content = editor.getValue();
        onSave(content);
        toast({ title: 'Saved', description: 'File saved successfully' });
      }
    });

    // AI assist shortcut (Ctrl+K or Cmd+K)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      handleAIAssist();
    });

    // Format document shortcut
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        editor.getAction('editor.action.formatDocument')?.run();
      }
    );

    return () => {
      completionProvider.dispose();
    };
  };

  // AI-powered suggestions (cached for performance)
  const suggestionCache = useRef<Map<string, any[]>>(new Map());
  
  async function getAISuggestions(context: string): Promise<any[]> {
    const cacheKey = context.slice(-100); // Last 100 chars as cache key
    
    if (suggestionCache.current.has(cacheKey)) {
      return suggestionCache.current.get(cacheKey)!;
    }

    // Return empty for now (can be enhanced with streaming AI)
    return [];
  }

  // AI Assist - refactor, improve, or complete code
  async function handleAIAssist() {
    if (!editorRef.current || isAIAssisting) return;

    setIsAIAssisting(true);
    const editor = editorRef.current;
    const selection = editor.getSelection();
    
    try {
      if (selection && !selection.isEmpty()) {
        // Improve selected code
        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText) {
          const improved = await aiService.generateCode(
            `Improve this code:\n\n${selectedText}\n\nReturn only the improved code, no explanations.`
          );
          
          editor.executeEdits('ai-assist', [
            {
              range: selection,
              text: improved,
              forceMoveMarkers: true,
            },
          ]);
          
          toast({
            title: 'AI Improved Code',
            description: 'Selected code has been enhanced',
          });
        }
      } else {
        // Complete code from cursor position
        const position = editor.getPosition();
        if (position) {
          const textUntilCursor = editor.getModel()?.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          
          if (textUntilCursor) {
            const completion = await aiService.generateCode(
              `Complete this code:\n\n${textUntilCursor}\n\nReturn only the completion, no explanations.`
            );
            
            editor.executeEdits('ai-complete', [
              {
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
                text: completion,
                forceMoveMarkers: true,
              },
            ]);
            
            toast({
              title: 'AI Completed Code',
              description: 'Code completed with AI',
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: 'AI Assist Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAIAssisting(false);
    }
  }

  // Get language from file extension
  function getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      rs: 'rust',
      go: 'go',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
    };
    return languageMap[ext || ''] || 'plaintext';
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{file.path}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAIAssist}
            disabled={isAIAssisting || readOnly}
            title="AI Assist (Ctrl/Cmd+K)"
          >
            <Wand2 className={`h-4 w-4 ${isAIAssisting ? 'animate-pulse' : ''}`} />
          </Button>
          {onSave && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(editorRef.current?.getValue() || '')}
              disabled={readOnly}
              title="Save (Ctrl/Cmd+S)"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          {onRun && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRun}
              title="Run Code"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const content = editorRef.current?.getValue() || '';
              navigator.clipboard.writeText(content);
              toast({ title: 'Copied', description: 'Code copied to clipboard' });
            }}
            title="Copy to Clipboard"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Editor
        height={height}
        language={file.language || getLanguage(file.path)}
        value={file.content}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      />
    </Card>
  );
}
