//
// This is the new content for: src/lib/aiService.ts
//
export class AIService {
  private model: string;

  constructor(model: string = "gemini-pro") { // Using gemini-pro
    this.model = model;
  }

  // This function now just sends a single prompt string
  private async makeApiRequest(prompt: string): Promise<string> {
    const response = await fetch("/api/generate", { // Calls your proxy
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model, // We send this but the proxy can override it
        prompt: prompt,
      }),
    });

    const data = await response.json(); // Read the JSON response once

    if (!response.ok) {
      // Use the detailed error message from the proxy
      const errorMessage = data.error || `HTTP error! status: ${response.status}`;
      throw new Error(`API error: ${errorMessage}`);
    }

    return data.text; // Our proxy returns a simple { text: "..." } object
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

    const fullPrompt = `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`;
    
    return this.makeApiRequest(fullPrompt);
  }
// ... existing code ...
  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
  }> {
// ... existing code ...
    const fullPrompt = `Analyze this coding task and break it down into steps. Return ONLY a JSON object with this structure:
{
  "steps": ["step 1", "step 2", ...],
  "files": ["file1.tsx", "file2.ts", ...],
  "complexity": "low|medium|high"
}

Task: ${task}`;

    const text = await this.makeApiRequest(fullPrompt);
    
// ... existing code ...
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
// ... existing code ...
      throw new Error("Failed to parse AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
// ... existing code ...
  }
}

    return this.makeApiRequest(fullPrompt);
  }
// ... existing code ...
  async analyzeTask(task: string): Promise<{
    steps: string[];
    files: string[];
    complexity: "low" | "medium" | "high";
  }> {
// ... existing code ...
    const fullPrompt = `Analyze this coding task and break it down into steps. Return ONLY a JSON object with this structure:
{
  "steps": ["step 1", "step 2", ...],
  "files": ["file1.tsx", "file2.ts", ...],
  "complexity": "low|medium|high"
}

Task: ${task}`;

    const text = await this.makeApiRequest(fullPrompt);
    
// ... existing code ...
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
// ... existing code ...
      throw new Error("Failed to parse AI response");
    }
    
    return JSON.parse(jsonMatch[0]);
// ... existing code ...
  }
}
