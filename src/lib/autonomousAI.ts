import { AIService } from './aiService';
import { supabaseService, TaskHistory, CodePattern, DecisionLog } from './supabaseService';

export interface AutonomousTask {
  description: string;
  complexity: 'low' | 'medium' | 'high';
  steps: string[];
  files: string[];
  innovationOpportunities: string[];
  learnedPatterns: string[];
}

export interface ReflectionResult {
  strengths: string[];
  improvements: string[];
  newPatterns: CodePattern[];
  innovationScore: number;
}

export class AutonomousAI {
  private aiService: AIService;
  private taskId: string;

  constructor() {
    this.aiService = new AIService();
    this.taskId = Date.now().toString();
  }

  /**
   * Analyzes a task with autonomous learning from past experiences
   */
  async analyzeWithMemory(task: string): Promise<AutonomousTask> {
    // Fetch similar tasks from history
    const similarTasks = await supabaseService.getSimilarTasks(task, 5);
    const successfulPatterns = await supabaseService.getMostSuccessfulPatterns(10);
    
    // Build context from past experiences
    const historyContext = similarTasks.length > 0
      ? `\n\nLearning from ${similarTasks.length} similar past tasks:\n${similarTasks.map(t => 
          `- Task: ${t.task_description}\n  Success: ${t.success}\n  Patterns: ${t.patterns_learned.join(', ')}`
        ).join('\n')}`
      : '';
    
    const patternContext = successfulPatterns.length > 0
      ? `\n\nProven successful patterns to consider:\n${successfulPatterns.map(p =>
          `- ${p.pattern_name} (${p.pattern_type}): ${p.success_rate * 100}% success rate, used ${p.times_used} times`
        ).join('\n')}`
      : '';

    const prompt = `You are an AUTONOMOUS and INNOVATIVE coding AI that learns from experience and thinks creatively.

Task: ${task}
${historyContext}
${patternContext}

Analyze this task with:
1. INNOVATION: Find creative, modern solutions beyond standard approaches
2. AUTONOMY: Make independent decisions without needing constant guidance
3. LEARNING: Apply patterns from past successes
4. LONG-TERM VISION: Consider extensibility and future development

Return ONLY a JSON object:
{
  "complexity": "low|medium|high",
  "steps": ["detailed autonomous step 1", "step 2", ...],
  "files": ["file paths with extensions"],
  "innovationOpportunities": ["creative ideas to implement"],
  "learnedPatterns": ["patterns from history to apply"]
}

Be bold and innovative!`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      description: task,
      complexity: analysis.complexity,
      steps: analysis.steps,
      files: analysis.files,
      innovationOpportunities: analysis.innovationOpportunities || [],
      learnedPatterns: analysis.learnedPatterns || []
    };
  }

  /**
   * Generates code with autonomous decision-making
   */
  async generateCodeAutonomously(
    prompt: string,
    context: string,
    taskContext: AutonomousTask
  ): Promise<string> {
    // Fetch relevant patterns
    const patterns = await supabaseService.getCodePatterns();
    const relevantPatterns = patterns.filter(p => 
      taskContext.learnedPatterns.some(lp => 
        lp.toLowerCase().includes(p.pattern_type.toLowerCase())
      )
    );

    const patternGuide = relevantPatterns.length > 0
      ? `\n\nApply these proven patterns:\n${relevantPatterns.map(p =>
          `Pattern: ${p.pattern_name}\nTemplate: ${p.code_template}`
        ).join('\n\n')}`
      : '';

    const fullPrompt = `You are an EXPERT AUTONOMOUS coding agent that makes independent, intelligent decisions.

INNOVATION MANDATE: ${taskContext.innovationOpportunities.join(', ')}

Task: ${prompt}
Context: ${context}
${patternGuide}

Generate production-ready, INNOVATIVE code with:
- Modern best practices and latest patterns
- Self-documenting, clean architecture
- Error handling and edge cases
- Type safety and validation
- Extensible design for future growth
- Creative solutions beyond the obvious
- Performance optimization
- Security considerations

Think independently and create exceptional code!`;

    return this.aiService.generateCode(fullPrompt);
  }

  /**
   * Self-reflects on generated code and learns
   */
  async reflectAndLearn(
    task: string,
    generatedFiles: Array<{ path: string; content: string }>,
    success: boolean,
    executionTime: number
  ): Promise<ReflectionResult> {
    const codeContext = generatedFiles.map(f => 
      `File: ${f.path}\n${f.content.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `Reflect on this autonomous coding task as a self-improving AI.

Task: ${task}
Success: ${success}
Execution Time: ${executionTime}s

Generated Code:
${codeContext}

Analyze and return ONLY a JSON object:
{
  "strengths": ["what worked well"],
  "improvements": ["what could be better"],
  "newPatterns": [
    {
      "pattern_name": "name",
      "pattern_type": "component|architecture|algorithm|etc",
      "use_cases": ["when to use"],
      "code_template": "reusable template",
      "success_rate": 1.0
    }
  ],
  "innovationScore": 0.0-1.0 (how innovative was the solution)
}`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        strengths: [],
        improvements: [],
        newPatterns: [],
        innovationScore: 0.5
      };
    }

    const reflection = JSON.parse(jsonMatch[0]);
    
    // Save learned patterns to database
    for (const pattern of reflection.newPatterns || []) {
      await supabaseService.saveCodePattern({
        ...pattern,
        times_used: 1
      });
    }

    return reflection;
  }

  /**
   * Makes autonomous decisions with logging
   */
  async makeDecision(
    decisionPoint: string,
    options: string[]
  ): Promise<{ chosen: string; reasoning: string }> {
    const prompt = `As an autonomous AI, make an independent decision.

Decision Point: ${decisionPoint}
Options: ${options.join(', ')}

Consider:
- Past successes and failures
- Best practices and innovation
- Long-term maintainability
- User value and impact

Return ONLY JSON:
{
  "chosen": "selected option",
  "reasoning": "detailed explanation of why"
}`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { chosen: options[0], reasoning: 'Default choice' };
    }

    const decision = JSON.parse(jsonMatch[0]);
    
    // Log decision for learning
    await supabaseService.logDecision({
      task_id: this.taskId,
      decision_point: decisionPoint,
      options_considered: options,
      chosen_option: decision.chosen,
      reasoning: decision.reasoning,
      outcome_success: true // Will be updated later
    });

    return decision;
  }

  /**
   * Plans multi-step execution autonomously
   */
  async planExecution(task: AutonomousTask): Promise<string[]> {
    const prompt = `As an autonomous project manager AI, create a detailed execution plan.

Task: ${task.description}
Complexity: ${task.complexity}
Initial Steps: ${task.steps.join(', ')}
Innovation Goals: ${task.innovationOpportunities.join(', ')}

Create a comprehensive, autonomous execution plan with:
- Detailed substeps for each major step
- Quality checkpoints
- Testing strategies
- Innovation integration points
- Self-correction opportunities

Return ONLY a JSON array of detailed step descriptions:
["step 1 with details", "step 2", ...]`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return task.steps;

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Saves complete task history for learning
   */
  async saveTaskExecution(
    task: AutonomousTask,
    files: string[],
    success: boolean,
    executionTime: number,
    reflection: ReflectionResult
  ): Promise<void> {
    const taskHistory: TaskHistory = {
      task_description: task.description,
      complexity: task.complexity,
      steps_taken: task.steps,
      files_generated: files,
      success: success,
      patterns_learned: task.learnedPatterns,
      innovation_score: reflection.innovationScore,
      execution_time: executionTime
    };

    await supabaseService.saveTaskHistory(taskHistory);
  }

  /**
   * Gets autonomous insights and suggestions
   */
  async getAutonomousInsights(): Promise<string[]> {
    const successRate = await supabaseService.getSuccessRate();
    const recentTasks = await supabaseService.getTaskHistory(10);
    const topPatterns = await supabaseService.getMostSuccessfulPatterns(5);

    const insights: string[] = [];
    
    if (successRate > 0) {
      insights.push(`Current success rate: ${(successRate * 100).toFixed(1)}%`);
    }
    
    if (recentTasks.length > 0) {
      const avgInnovation = recentTasks.reduce((sum, t) => sum + t.innovation_score, 0) / recentTasks.length;
      insights.push(`Average innovation score: ${(avgInnovation * 100).toFixed(1)}%`);
    }

    if (topPatterns.length > 0) {
      insights.push(`Top pattern: ${topPatterns[0].pattern_name} (${(topPatterns[0].success_rate * 100).toFixed(1)}% success)`);
    }

    return insights;
  }
}
