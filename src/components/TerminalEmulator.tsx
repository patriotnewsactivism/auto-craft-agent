import { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TerminalEmulatorProps {
  onClose?: () => void;
  initialCommand?: string;
}

export function TerminalEmulator({ onClose, initialCommand }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentLine, setCurrentLine] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      cols: 80,
      rows: 24,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.writeln('🚀 Autonomous Code Wizard Terminal');
    terminal.writeln('Type "help" for available commands\r\n');
    writePrompt(terminal);

    // Handle input
    let currentCommand = '';
    
    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle special keys
      if (code === 13) {
        // Enter key
        terminal.write('\r\n');
        if (currentCommand.trim()) {
          executeCommand(currentCommand.trim(), terminal);
          setCommandHistory(prev => [...prev, currentCommand.trim()]);
          setHistoryIndex(-1);
        }
        currentCommand = '';
        writePrompt(terminal);
      } else if (code === 127) {
        // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 27) {
        // Arrow keys (escape sequences)
        // Handle arrow up/down for history
        // This is simplified - full implementation would parse escape sequences
      } else if (code >= 32 && code <= 126) {
        // Printable characters
        currentCommand += data;
        terminal.write(data);
      }
      
      setCurrentLine(currentCommand);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Run initial command if provided
    if (initialCommand) {
      terminal.writeln(initialCommand);
      executeCommand(initialCommand, terminal);
      writePrompt(terminal);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  // Write prompt
  function writePrompt(terminal: Terminal) {
    terminal.write('\r\n\x1b[32m➜\x1b[0m \x1b[36m~\x1b[0m ');
  }

  // Execute command (simulated)
  async function executeCommand(command: string, terminal: Terminal) {
    const [cmd, ...args] = command.split(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        terminal.writeln('Available commands:');
        terminal.writeln('  help        - Show this help message');
        terminal.writeln('  clear       - Clear the terminal');
        terminal.writeln('  echo <text> - Echo text to terminal');
        terminal.writeln('  ls          - List files (simulated)');
        terminal.writeln('  pwd         - Print working directory');
        terminal.writeln('  whoami      - Print current user');
        terminal.writeln('  date        - Show current date/time');
        terminal.writeln('  npm install - Install packages (simulated)');
        terminal.writeln('  npm run dev - Start dev server (simulated)');
        break;

      case 'clear':
        terminal.clear();
        break;

      case 'echo':
        terminal.writeln(args.join(' '));
        break;

      case 'ls':
        terminal.writeln('src/');
        terminal.writeln('public/');
        terminal.writeln('package.json');
        terminal.writeln('tsconfig.json');
        terminal.writeln('vite.config.ts');
        break;

      case 'pwd':
        terminal.writeln('/workspace/project');
        break;

      case 'whoami':
        terminal.writeln('code-wizard');
        break;

      case 'date':
        terminal.writeln(new Date().toString());
        break;

      case 'npm':
        if (args[0] === 'install') {
          terminal.writeln('Installing packages...');
          await simulateProgress(terminal, 'Installing', 30);
          terminal.writeln('✓ Packages installed successfully');
        } else if (args[0] === 'run' && args[1] === 'dev') {
          terminal.writeln('Starting development server...');
          await simulateProgress(terminal, 'Starting', 20);
          terminal.writeln('✓ Server running at http://localhost:5173');
        } else {
          terminal.writeln(`npm ${args.join(' ')}`);
        }
        break;

      case 'git':
        if (args[0] === 'status') {
          terminal.writeln('On branch main');
          terminal.writeln('Your branch is up to date with \'origin/main\'');
          terminal.writeln('');
          terminal.writeln('nothing to commit, working tree clean');
        } else {
          terminal.writeln(`git ${args.join(' ')} (simulated)`);
        }
        break;

      default:
        if (command.trim()) {
          terminal.writeln(`Command not found: ${cmd}`);
          terminal.writeln('Type "help" for available commands');
        }
    }
  }

  // Simulate progress bar
  async function simulateProgress(terminal: Terminal, label: string, steps: number) {
    const width = 40;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const filled = Math.floor(progress * width);
      const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
      const percent = Math.floor(progress * 100);
      
      terminal.write(`\r${label}... [${bar}] ${percent}%`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    terminal.write('\r\n');
  }

  // Copy terminal content
  function copyTerminalContent() {
    if (xtermRef.current) {
      const content = xtermRef.current.buffer.active.getLine(0)?.translateToString() || '';
      navigator.clipboard.writeText(content);
      toast({ title: 'Copied', description: 'Terminal content copied to clipboard' });
    }
  }

  // Toggle maximize
  function toggleMaximize() {
    setIsMaximized(!isMaximized);
    setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 100);
  }

  return (
    <Card 
      className={`flex flex-col overflow-hidden transition-all ${
        isMaximized ? 'fixed inset-4 z-50' : 'h-full'
      }`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Terminal</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={copyTerminalContent}
            title="Copy Content"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMaximize}
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              title="Close Terminal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Container */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 overflow-hidden"
        style={{ backgroundColor: '#1e1e1e' }}
      />

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground flex items-center justify-between">
        <span>Shell: bash</span>
        <span>{commandHistory.length} commands</span>
      </div>
    </Card>
  );
}
