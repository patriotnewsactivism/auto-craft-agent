export interface Message {
  role: "user" | "assistant";
  content: string;
}

export class AIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "claude-sonnet-4-5") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateCode(prompt: string, context?: string): Promise<string> {
    const messages: Message[] = [
      {
        role: "user",
        content: `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`,
      },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8000,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
  }> {
    const messages: Message[] = [
      {
        role: "user",
        content: `Analyze this coding task and break it down into steps. Return ONLY a JSON object with this structure:
{
  "steps": ["step 1", "step 2", ...],
  "files": ["file1.tsx", "file2.ts", ...],
  "complexity": "low|medium|high"
}

Task: ${task}`,
      },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  }
}
