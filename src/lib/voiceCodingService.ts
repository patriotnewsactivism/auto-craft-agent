import { logger } from './logger';

/**
 * Voice Coding Service
 * Convert voice commands to code using Web Speech API and AI
 */

export interface VoiceCommand {
  transcript: string;
  confidence: number;
  timestamp: number;
  language: string;
}

export interface VoiceCodeResult {
  code: string;
  explanation: string;
  language: string;
  confidence: number;
}

export class VoiceCodingService {
  private recognition: any = null;
  private isListening: boolean = false;
  private language: string = 'en-US';
  private continuous: boolean = false;
  private interimResults: boolean = true;
  private listeners: Set<(result: VoiceCommand) => void>;

  constructor() {
    this.listeners = new Set();
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    if (typeof window === 'undefined') {
      logger.warn('VoiceCoding', 'Not in browser environment');
      return;
    }

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      logger.error('VoiceCoding', 'Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition();
    
    logger.info('VoiceCoding', 'Speech recognition initialized');
  }

  /**
   * Set up speech recognition handlers
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      logger.info('VoiceCoding', 'Started listening');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      logger.info('VoiceCoding', 'Stopped listening');
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;

        logger.debug('VoiceCoding', 'Recognized', transcript);

        const command: VoiceCommand = {
          transcript,
          confidence,
          timestamp: Date.now(),
          language: this.language,
        };

        this.notifyListeners(command);
      }
    };

    this.recognition.onerror = (event: any) => {
      logger.error('VoiceCoding', 'Recognition error', event.error);
      this.isListening = false;
    };
  }

  /**
   * Start listening
   */
  startListening(continuous: boolean = false): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) {
      logger.warn('VoiceCoding', 'Already listening');
      return;
    }

    this.continuous = continuous;
    this.recognition.continuous = continuous;

    try {
      this.recognition.start();
      logger.info('VoiceCoding', 'Listening started', { continuous });
    } catch (error) {
      logger.error('VoiceCoding', 'Failed to start listening', error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    this.recognition.stop();
    logger.info('VoiceCoding', 'Listening stopped');
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
    logger.info('VoiceCoding', 'Language set to', language);
  }

  /**
   * Convert voice command to code using AI
   */
  async voiceToCode(
    transcript: string, 
    context?: string,
    targetLanguage: string = 'typescript'
  ): Promise<VoiceCodeResult> {
    try {
      logger.info('VoiceCoding', 'Converting voice to code', transcript);

      // Parse voice command into coding intent
      const intent = this.parseIntent(transcript);

      // Generate code based on intent
      const prompt = this.buildPrompt(intent, context, targetLanguage);

      // Use AI service to generate code
      const { generateCode } = await import('./aiService');
      const code = await generateCode(prompt);

      const result: VoiceCodeResult = {
        code,
        explanation: intent,
        language: targetLanguage,
        confidence: 0.9,
      };

      logger.info('VoiceCoding', 'Code generated successfully');
      return result;

    } catch (error) {
      logger.error('VoiceCoding', 'Voice to code failed', error);
      throw error;
    }
  }

  /**
   * Parse voice command intent
   */
  private parseIntent(transcript: string): string {
    const lower = transcript.toLowerCase().trim();

    // Common coding phrases
    const patterns = [
      { pattern: /create (a |an )?(.+) (function|component|class)/i, 
        intent: (m: RegExpMatchArray) => `Create a ${m[2]} ${m[3]}` },
      
      { pattern: /add (a |an )?(.+) to (.+)/i, 
        intent: (m: RegExpMatchArray) => `Add a ${m[2]} to ${m[3]}` },
      
      { pattern: /make (a |an )?(.+)/i, 
        intent: (m: RegExpMatchArray) => `Create ${m[2]}` },
      
      { pattern: /write (a |an )?(.+)/i, 
        intent: (m: RegExpMatchArray) => `Write ${m[2]}` },
      
      { pattern: /implement (.+)/i, 
        intent: (m: RegExpMatchArray) => `Implement ${m[1]}` },
      
      { pattern: /define (.+)/i, 
        intent: (m: RegExpMatchArray) => `Define ${m[1]}` },
      
      { pattern: /generate (.+)/i, 
        intent: (m: RegExpMatchArray) => `Generate ${m[1]}` },
    ];

    for (const { pattern, intent } of patterns) {
      const match = lower.match(pattern);
      if (match) {
        return intent(match);
      }
    }

    // If no pattern matches, return original transcript
    return transcript;
  }

  /**
   * Build AI prompt for code generation
   */
  private buildPrompt(intent: string, context?: string, language: string = 'typescript'): string {
    let prompt = `Voice coding command: "${intent}"\n\n`;
    prompt += `Target language: ${language}\n\n`;
    
    if (context) {
      prompt += `Context:\n${context}\n\n`;
    }

    prompt += `Generate clean, production-ready code based on the voice command. `;
    prompt += `Include proper types, error handling, and documentation. `;
    prompt += `Return only the code without explanations.`;

    return prompt;
  }

  /**
   * Quick voice commands
   */
  async executeQuickCommand(command: string): Promise<string> {
    const lower = command.toLowerCase().trim();

    const quickCommands: Record<string, string> = {
      'new line': '\n',
      'tab': '\t',
      'semicolon': ';',
      'comma': ',',
      'dot': '.',
      'open brace': '{',
      'close brace': '}',
      'open bracket': '[',
      'close bracket': ']',
      'open paren': '(',
      'close paren': ')',
      'equal': '=',
      'plus': '+',
      'minus': '-',
      'star': '*',
      'slash': '/',
      'arrow': '=>',
      'comment': '// ',
    };

    return quickCommands[lower] || command;
  }

  /**
   * Listen for specific command
   */
  listenForCommand(callback: (command: VoiceCommand) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(command: VoiceCommand): void {
    this.listeners.forEach(listener => {
      try {
        listener(command);
      } catch (error) {
        logger.error('VoiceCoding', 'Listener error', error);
      }
    });
  }

  /**
   * Check if listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Check if available
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE',
      'it-IT', 'pt-BR', 'zh-CN', 'ja-JP', 'ko-KR'
    ];
  }
}

// Export singleton instance
export const voiceCodingService = new VoiceCodingService();
