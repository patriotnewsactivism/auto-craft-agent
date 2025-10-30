//
// This is the updated content for: src/lib/aiService.ts
//
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export class AIService {
  // No API key is stored here!
  private model: string;

  constructor(model: string = "claude-3-haiku-20240307") { // Using a cheaper model
    this.model = model;
  }

  // This function is now private because all requests should go through the proxy
  private async makeApiRequest(messages: Message[]): Promise<any> {
    const response = await fetch("/api/generate", { // <-- Calls your new proxy
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NO API KEY or Anthropic headers here
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096, // Max tokens for Haiku
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }

  async generateCode(prompt: string, context?: string): Promise<string> {
    const messages: Message[] = [
      {
        role: "user",
        content: `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`,
      },
    ];

    const data = await this.makeApiRequest(messages);
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

    const data = await this.makeApiRequest(messages);
    const text = data.content[0].text;
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
  }
}
