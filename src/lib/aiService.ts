export class AIService {
  private model: string;

  constructor(model: string = "gemini-2.5-pro") {
    this.model = model;
  }

  private getApiKey(): string | null {
    // Prioritize environment variable, fall back to localStorage
    return import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key");
  }

  private async makeApiRequest(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error(
        'Google AI API key not configured. Please add your API key in Settings.\n' +
        'Get your key from: https://aistudio.google.com/app/apikey'
      );
    }

    try {
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
        
        throw new Error(`API error: ${errorMessage}${details}${hint}`);
      }

      return data.text;
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to API. Make sure the server is running.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while making API request');
    }
  }

  async generateCode(prompt: string, context?: string): Promise<string> {
    const fullPrompt = `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`;
    
    return this.makeApiRequest(fullPrompt);
  }

  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
  }> {
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
      throw new Error("Failed to parse AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  }
}
