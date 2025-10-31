import { getModel, getDefaultModel, type GeminiModel } from './geminiModels';
import { logger } from './logger';

export class AIService {
  private model: string;

  constructor(model?: string) {
    // Use provided model, or check localStorage, or default to gemini-2.5-flash
    this.model = model || this.getSavedModel() || "gemini-2.5-flash";
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
    // Prioritize environment variable, fall back to localStorage
    return import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key");
  }

  private async makeApiRequest(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      const error = new Error(
        'Google AI API key not configured. Please add your API key in Settings.\n' +
        'Get your key from: https://aistudio.google.com/app/apikey'
      );
      logger.error('AIService', 'API key not configured', 'User needs to add API key in settings');
      throw error;
    }

    try {
      logger.debug('AIService', `Making API request to /api/generate`, `Model: ${this.model}`);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          apiKey: apiKey, // Send API key with request
        }),
      });

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

      logger.success('AIService', 'API request successful', `Received ${data.text?.length || 0} characters`);
      return data.text;
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
    const fullPrompt = `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`;
    
    return this.makeApiRequest(fullPrompt);
  }

  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
  }> {
    logger.info('AIService', 'Analyzing task', `Task: ${task.substring(0, 100)}...`);
    const fullPrompt = `Analyze this coding task and break it down into steps. Return ONLY a JSON object with this structure:
{
  "steps": ["step 1", "step 2", ...],
  "files": ["file1.tsx", "file2.ts", ...],
  "complexity": "low|medium|high"
}

Task: ${task}`;

    const text = await this.makeApiRequest(fullPrompt);
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('AIService', 'Failed to parse AI response', 'No JSON found in response', { response: text.substring(0, 200) });
      throw new Error("Failed to parse AI response - no valid JSON found");
    }
    
    const result = JSON.parse(jsonMatch[0]);
    logger.success('AIService', 'Task analysis complete', `Complexity: ${result.complexity}, Steps: ${result.steps.length}`);
    return result;
  }
}
