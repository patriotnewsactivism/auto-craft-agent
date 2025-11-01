import { getModel, getDefaultModel, type GeminiModel } from './geminiModels';
import { logger } from './logger';
import { parseJsonOrThrow } from './safeJsonParser';

interface CacheEntry {
  prompt: string;
  response: string;
  timestamp: number;
  model: string;
}

export class AIService {
  private model: string;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  constructor(model?: string) {
    // Use provided model, or check localStorage, or default to gemini-2.5-flash
    this.model = model || this.getSavedModel() || "gemini-2.5-flash";
    this.loadCache();
  }

  /**
   * Get saved model from localStorage
   */
  private getSavedModel(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("gemini_model");
    }
    return null;
  }

  /**
   * Set the model to use for generation
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get model information
   */
  getModelInfo(): GeminiModel | undefined {
    return getModel(this.model);
  }

  private getApiKey(): string | null {
    // Prioritize environment variable, fall back to persistent storage, then OAuth
    let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    if (!apiKey) {
      try {
        // Try persistent storage first
        apiKey = localStorage.getItem('acw_apikey_google_api_key') || localStorage.getItem("google_api_key") || null;
      } catch (e) {
        console.error('Failed to load API key from storage:', e);
      }
    }
    
    return apiKey || this.getOAuthToken();
  }

  private getOAuthToken(): string | null {
    const oauthData = localStorage.getItem("oauth_google");
    if (oauthData) {
      try {
        const token = JSON.parse(oauthData);
        return token.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return; // Skip if localStorage not available
      }
      
      const cached = localStorage.getItem('ai_response_cache');
      if (cached) {
        const entries = JSON.parse(cached);
        this.cache = new Map(entries);
        // Clean expired entries
        this.cleanExpiredCache();
      }
    } catch (error) {
      logger.error('AIService', 'Failed to load cache', String(error));
      // Don't throw - just skip cache loading
      this.cache = new Map();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return; // Skip if localStorage not available
      }
      
      const entries = Array.from(this.cache.entries());
      localStorage.setItem('ai_response_cache', JSON.stringify(entries));
    } catch (error) {
      logger.error('AIService', 'Failed to save cache', String(error));
      // Don't throw - just skip cache saving
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
    this.saveCache();
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(prompt: string): string | null {
    const cacheKey = `${this.model}:${prompt}`;
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() - entry.timestamp < this.CACHE_DURATION) {
      logger.debug('AIService', 'Cache hit', `Using cached response for prompt`);
      return entry.response;
    }
    
    return null;
  }

  /**
   * Cache a response
   */
  private cacheResponse(prompt: string, response: string): void {
    const cacheKey = `${this.model}:${prompt}`;
    this.cache.set(cacheKey, {
      prompt,
      response,
      timestamp: Date.now(),
      model: this.model
    });
    this.saveCache();
  }

  private async makeApiRequest(prompt: string, useCache: boolean = true): Promise<string> {
    // Check cache first
    if (useCache) {
      const cached = this.getCachedResponse(prompt);
      if (cached) {
        return cached;
      }
    }

    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      const error = new Error(
        'Google AI API key not configured. Please add your API key in Settings.\n' +
        'Get your key from: https://aistudio.google.com/app/apikey'
      );
      logger.error('AIService', 'API key not configured', 'User needs to add API key in settings');
      throw error;
    }

    const startTime = Date.now();

    try {
      logger.debug('AIService', `Making API request to /api/generate`, `Model: ${this.model}`);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            prompt: prompt,
            apiKey: apiKey,
            // Enhanced generation parameters - higher temperature to reduce recitation
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096, // Reduced from 8192 to prevent token limit errors
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          // Enhanced error messages from the API
          const errorMessage = data.error || `HTTP error! status: ${response.status}`;
          const details = data.details ? `\n${data.details}` : '';
          const hint = data.hint ? `\n\nHint: ${data.hint}` : '';
          const fullError = `API error: ${errorMessage}${details}${hint}`;
          
          logger.error('AIService', `API request failed (${response.status})`, fullError, { 
            status: response.status, 
            data 
          });
          throw new Error(fullError);
        }

        const duration = Date.now() - startTime;
        const retryInfo = data.retried ? ` (retried ${data.retryCount} time(s))` : '';
        logger.success('AIService', 'API request successful', `Received ${data.text?.length || 0} characters in ${duration}ms${retryInfo}`);
        
        // Cache the response
        if (useCache) {
          this.cacheResponse(prompt, data.text);
        }

        return data.text;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle timeout specifically
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutError = new Error('Request timed out after 60 seconds. The API is taking too long to respond. Try:\n' +
            '1. Breaking down your request into smaller parts\n' +
            '2. Simplifying your prompt\n' +
            '3. Using a faster model like gemini-2.5-flash-lite');
          logger.error('AIService', 'Request timeout', 'API request exceeded 60 second timeout');
          throw timeoutError;
        }
        
        throw fetchError;
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          const networkError = new Error('Network error: Unable to connect to API. Make sure the server is running.');
          logger.error('AIService', 'Network connection failed', 'Cannot reach API endpoint', { originalError: error.message });
          throw networkError;
        }
        logger.logError('AIService', error, 'API request failed');
        throw error;
      }
      const unknownError = new Error('Unknown error occurred while making API request');
      logger.error('AIService', 'Unknown error in API request', String(error));
      throw unknownError;
    }
  }

  async generateCode(prompt: string, context?: string): Promise<string> {
    logger.info('AIService', 'Generating code', `Prompt length: ${prompt.length} chars`);
    
    // Simplified prompt to reduce token usage and prevent limit errors
    const enhancedPrompt = `You are an expert coding assistant.

TASK: ${prompt}

${context ? `CONTEXT:\n${context.substring(0, 500)}\n\n` : ""}

Provide clean, production-ready code with TypeScript. Include error handling and helpful comments. Be concise but complete.`;
    
    return this.makeApiRequest(enhancedPrompt, false); // Don't cache code generation
  }

  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
    estimatedTime?: number;
    dependencies?: string[];
  }> {
    logger.info('AIService', 'Analyzing task', `Task: ${task.substring(0, 100)}...`);
    
    const enhancedPrompt = `As an expert software architect, analyze this coding task with precision.

TASK: ${task}

Provide a detailed analysis in the following JSON format (return ONLY the JSON, no markdown):
{
  "steps": ["detailed step 1", "detailed step 2", ...],
  "files": ["path/to/file1.tsx", "path/to/file2.ts", ...],
  "complexity": "low|medium|high",
  "estimatedTime": <minutes>,
  "dependencies": ["dependency1", "dependency2", ...]
}

Consider:
- Break down into specific, actionable steps
- List all files that need to be created or modified
- Assess complexity based on scope, technical challenges, and dependencies
- Estimate time in minutes
- Identify required libraries/packages

Return the JSON now:`;

    const text = await this.makeApiRequest(enhancedPrompt, true); // Cache analysis
    
    // Use safe JSON parser to handle truncated or malformed responses
    const result = parseJsonOrThrow<{
      steps: string[];
      files: string[];
      complexity: "low" | "medium" | "high";
      estimatedTime?: number;
      dependencies?: string[];
    }>(text, 'Task analysis');
    logger.success('AIService', 'Task analysis complete', `Complexity: ${result.complexity}, Steps: ${result.steps.length}, Est. time: ${result.estimatedTime || 'N/A'}min`);
    return result;
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('ai_response_cache');
    logger.info('AIService', 'Cache cleared', 'All cached responses removed');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; oldestEntry: number; newestEntry: number } {
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) {
      return { entries: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = entries.map(e => e.timestamp);
    return {
      entries: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}
