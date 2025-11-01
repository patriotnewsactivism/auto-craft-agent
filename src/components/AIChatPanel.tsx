import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Code, Sparkles, X, Copy, Check } from 'lucide-react';
import { AIService } from '@/lib/aiService';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    files?: string[];
    codeSnippet?: string;
  };
}

interface AIChatPanelProps {
  currentFile?: { path: string; content: string };
  allFiles?: Array<{ path: string; content: string }>;
  onApplyCode?: (code: string, filePath: string) => void;
  onClose?: () => void;
}

export function AIChatPanel({
  currentFile,
  allFiles = [],
  onApplyCode,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI coding assistant. I can help you with:\n\n- Writing and refactoring code\n- Debugging issues\n- Explaining complex concepts\n- Suggesting improvements\n- Generating tests\n\nI have full context of your project. Just ask!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const aiService = new AIService();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  async function sendMessage() {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      context: currentFile ? {
        files: [currentFile.path],
        codeSnippet: currentFile.content.substring(0, 500),
      } : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build context-aware prompt - limited to prevent token limit errors
      let contextInfo = '';
      
      if (currentFile) {
        // Limit file content to 300 chars to prevent token limit issues
        contextInfo += `\n\nCurrent file: \`${currentFile.path}\`\n`;
        const excerpt = currentFile.content.substring(0, 300);
        if (excerpt.length > 0) {
          contextInfo += `Content: \`\`\`\n${excerpt}${currentFile.content.length > 300 ? '...' : ''}\n\`\`\`\n`;
        }
      }

      if (allFiles.length > 0) {
        // Only list first 10 files to keep context small
        const fileList = allFiles.slice(0, 10).map(f => f.path).join(', ');
        contextInfo += `\nProject: ${allFiles.length} files${allFiles.length > 10 ? ' (showing first 10)' : ''}: ${fileList}\n`;
      }

      const enhancedPrompt = `You are a helpful coding assistant.${contextInfo}

Question: ${userMessage.content}

Provide a concise, helpful response. Use code blocks with triple backticks when showing code.`;

      const response = await aiService.generateCode(enhancedPrompt);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  // Quick actions
  const quickActions = [
    {
      label: 'Explain this code',
      prompt: currentFile ? `Explain what this code does:\n\n${currentFile.content}` : 'Explain the current code',
    },
    {
      label: 'Find bugs',
      prompt: currentFile ? `Review this code for potential bugs:\n\n${currentFile.content}` : 'Review the current code for bugs',
    },
    {
      label: 'Refactor',
      prompt: currentFile ? `Suggest refactoring improvements for:\n\n${currentFile.content}` : 'Suggest refactoring improvements',
    },
    {
      label: 'Add tests',
      prompt: currentFile ? `Generate unit tests for:\n\n${currentFile.content}` : 'Generate unit tests',
    },
  ];

  // Copy message content
  function copyMessage(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied', description: 'Message copied to clipboard' });
  }

  // Extract code blocks from markdown
  function extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: Array<{ code: string; language: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
    }

    return blocks;
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Context-aware coding help</p>
          </div>
        </div>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      {currentFile && messages.length <= 1 && (
        <div className="p-3 border-b border-border bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setInput(action.prompt);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === 'user' ? 'order-first' : ''
                }`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            
                            return !inline ? (
                              <div className="relative group">
                                <pre className="bg-background border border-border rounded-lg p-3 overflow-x-auto">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                                {onApplyCode && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onApplyCode(codeString, currentFile?.path || 'untitled.ts')}
                                  >
                                    <Code className="h-3 w-3 mr-1" />
                                    Apply
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <code className={`${className} bg-background px-1 py-0.5 rounded`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyMessage(message.content, message.id)}
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Context indicator */}
      {currentFile && (
        <div className="border-t border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <Code className="h-3 w-3" />
          <span className="truncate">Context: {currentFile.path}</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about your code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
