import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Settings, Play, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';
import { voiceCodingService, VoiceCommand } from '@/lib/voiceCodingService';

export const VoiceCodingPanel = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if voice coding is available
    const available = voiceCodingService.isAvailable();
    setIsAvailable(available);

    if (!available) {
      toast({
        title: 'Voice Coding Unavailable',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
    }

    // Listen for voice commands
    const unsubscribe = voiceCodingService.listenForCommand((command) => {
      setCommands(prev => [command, ...prev].slice(0, 10));
      setCurrentTranscript(command.transcript);
    });

    return () => {
      if (isListening) {
        voiceCodingService.stopListening();
      }
      unsubscribe();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      voiceCodingService.stopListening();
      setIsListening(false);
      toast({
        title: 'Stopped Listening',
        description: 'Voice coding deactivated',
      });
    } else {
      try {
        voiceCodingService.startListening(continuous);
        setIsListening(true);
        toast({
          title: 'Listening',
          description: 'Speak your coding commands',
        });
      } catch (error) {
        toast({
          title: 'Failed to Start',
          description: 'Could not start voice recognition',
          variant: 'destructive',
        });
      }
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    voiceCodingService.setLanguage(lang);
    
    if (isListening) {
      voiceCodingService.stopListening();
      voiceCodingService.startListening(continuous);
    }
  };

  const handleContinuousChange = (checked: boolean) => {
    setContinuous(checked);
    
    if (isListening) {
      voiceCodingService.stopListening();
      voiceCodingService.startListening(checked);
    }
  };

  const convertToCode = async (transcript: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      const result = await voiceCodingService.voiceToCode(transcript, '', 'typescript');
      
      toast({
        title: 'Code Generated',
        description: 'Voice command converted to code',
      });

      // Emit event with generated code
      window.dispatchEvent(new CustomEvent('voice-code-generated', {
        detail: { code: result.code, transcript },
      }));

    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: 'Could not convert voice to code',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const languages = voiceCodingService.getSupportedLanguages();

  if (!isAvailable) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <MicOff className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Voice Coding</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Speech recognition is not supported in your browser.
          Try using Chrome, Edge, or Safari.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Voice Coding</h3>
          {isListening && (
            <Badge variant="default" className="animate-pulse">
              Listening
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={toggleListening}
            className="flex-1"
            variant={isListening ? 'destructive' : 'default'}
          >
            {isListening ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Continuous Mode</span>
          <Switch
            checked={continuous}
            onCheckedChange={handleContinuousChange}
            disabled={isListening}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Language</label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Transcript */}
      {currentTranscript && (
        <Card className="p-3 bg-secondary">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Last Command:</p>
              <p className="text-sm">{currentTranscript}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => convertToCode(currentTranscript)}
              disabled={isProcessing}
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* Command History */}
      <div>
        <p className="text-sm font-medium mb-2">Recent Commands</p>
        <ScrollArea className="h-48 border rounded p-2">
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No commands yet. Start speaking!
              </p>
            ) : (
              commands.map((cmd, i) => (
                <div key={i} className="text-sm p-2 bg-secondary rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(cmd.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(cmd.confidence * 100)}%
                    </Badge>
                  </div>
                  <p>{cmd.transcript}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Commands */}
      <div>
        <p className="text-sm font-medium mb-2">Quick Commands</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-secondary rounded">
            <p className="font-medium">"Create a function"</p>
          </div>
          <div className="p-2 bg-secondary rounded">
            <p className="font-medium">"Add a button"</p>
          </div>
          <div className="p-2 bg-secondary rounded">
            <p className="font-medium">"Make a class"</p>
          </div>
          <div className="p-2 bg-secondary rounded">
            <p className="font-medium">"Write a loop"</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
