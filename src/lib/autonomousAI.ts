import { AIService } from './aiService';
import { TaskHistory, CodePattern, DecisionLog } from './supabaseService';
import { unifiedLearning } from './unifiedLearningService';
import { devPatterns } from './developerPatterns';
import { logger } from './logger';

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
    logger.info('Analysis', 'Starting task analysis with memory', `Task: ${task}`);
    const startTime = Date.now();
    
    try {
      // Fetch similar tasks from history (always works now!)
      logger.debug('Analysis', 'Fetching similar tasks from history');
      const similarTasks = await unifiedLearning.getSimilarTasks(task, 5);
      logger.debug('Analysis', `Found ${similarTasks.length} similar tasks`);
      
      const successfulPatterns = await unifiedLearning.getMostSuccessfulPatterns(10);
      logger.debug('Analysis', `Found ${successfulPatterns.length} successful patterns`);
      
      // Get developer insights (think like a senior dev!)
      const developerInsights = await devPatterns.getDeveloperInsights(task);
      logger.debug('Analysis', `Generated ${developerInsights.length} developer insights`);
    
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
    
    const devInsightsContext = developerInsights.length > 0
      ? `\n\nDeveloper insights (think like a senior developer):\n${developerInsights.map(i =>
          `- [${i.category.toUpperCase()}] ${i.insight} (Confidence: ${(i.confidence * 100).toFixed(0)}%)`
        ).join('\n')}`
      : '';

    const prompt = `You are an AUTONOMOUS and INNOVATIVE coding AI that learns from experience and thinks creatively.

Task: ${task}
${historyContext}
${patternContext}
${devInsightsContext}

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

      logger.logApiCall('AI Analysis', 'start', 'Generating task analysis');
      const response = await this.aiService.generateCode(prompt);
      logger.logApiCall('AI Analysis', 'success', 'Received analysis response');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Analysis', 'Failed to parse AI response', 'No JSON found in response', { response: response.substring(0, 200) });
        throw new Error('Failed to parse AI response - no JSON found');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      const result = {
        description: task,
        complexity: analysis.complexity,
        steps: analysis.steps,
        files: analysis.files,
        innovationOpportunities: analysis.innovationOpportunities || [],
        learnedPatterns: analysis.learnedPatterns || []
      };
      
      logger.logTiming('Analysis', 'Task analysis', Date.now() - startTime);
      logger.success('Analysis', 'Task analysis completed', 
        `Complexity: ${result.complexity}, Steps: ${result.steps.length}, Files: ${result.files.length}`,
        { result }
      );
      
      return result;
    } catch (error) {
      logger.logError('Analysis', error, 'Failed to analyze task with memory');
      throw error;
    }
  }

  /**
   * Generates code with autonomous decision-making
   */
  async generateCodeAutonomously(
    prompt: string,
    context: string,
    taskContext: AutonomousTask
  ): Promise<string> {
    logger.info('CodeGen', 'Generating code autonomously', prompt);
    const startTime = Date.now();
    
    try {
      // Fetch relevant patterns (always works now!)
      logger.debug('CodeGen', 'Fetching code patterns');
      const patterns = await unifiedLearning.getCodePatterns();
      const relevantPatterns = patterns.filter(p => 
        taskContext.learnedPatterns.some(lp => 
          lp.toLowerCase().includes(p.pattern_type.toLowerCase())
        )
      );
      logger.debug('CodeGen', `Applying ${relevantPatterns.length} relevant patterns`);

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

      logger.logApiCall('AI CodeGen', 'start', 'Generating code');
      const result = await this.aiService.generateCode(fullPrompt);
      logger.logApiCall('AI CodeGen', 'success', 'Code generated');
      
      logger.logTiming('CodeGen', 'Code generation', Date.now() - startTime);
      logger.success('CodeGen', 'Code generated successfully', 
        `Generated ${result.length} characters of code`
      );
      
      return result;
    } catch (error) {
      logger.logError('CodeGen', error, 'Failed to generate code autonomously');
      throw error;
    }
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
    logger.info('Learning', 'Starting reflection and learning', 
      `Task: ${task}, Success: ${success}, Time: ${executionTime}s`
    );
    const startTime = Date.now();
    
    try {
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

      logger.logApiCall('AI Reflection', 'start', 'Analyzing execution for learning');
      const response = await this.aiService.generateCode(prompt);
      logger.logApiCall('AI Reflection', 'success', 'Reflection completed');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warning('Learning', 'Failed to parse reflection response, using defaults');
        return {
          strengths: [],
          improvements: [],
          newPatterns: [],
          innovationScore: 0.5
        };
      }

      const reflection = JSON.parse(jsonMatch[0]);
      
      // Save learned patterns to database (always works now!)
      logger.debug('Learning', `Saving ${reflection.newPatterns?.length || 0} new patterns`);
      for (const pattern of reflection.newPatterns || []) {
        await unifiedLearning.saveCodePattern({
          ...pattern,
          times_used: 1
        });
      }

      logger.logTiming('Learning', 'Reflection and learning', Date.now() - startTime);
      // Learn like a developer from this execution
      await devPatterns.learnFromExecution(task, generatedFiles, success);
      
      logger.success('Learning', 'Reflection completed', 
        `Innovation score: ${reflection.innovationScore}, New patterns: ${reflection.newPatterns?.length || 0}`,
        { reflection }
      );
      
      return reflection;
    } catch (error) {
      logger.logError('Learning', error, 'Failed during reflection and learning');
      throw error;
    }
  }

  /**
   * Makes autonomous decisions with logging
   */
  async makeDecision(
    decisionPoint: string,
    options: string[]
  ): Promise<{ chosen: string; reasoning: string }> {
    logger.info('Decision', `Making autonomous decision at: ${decisionPoint}`, 
      `Options: ${options.join(', ')}`
    );
    
    try {
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
        logger.warning('Decision', 'Failed to parse decision response, using default');
        return { chosen: options[0], reasoning: 'Default choice' };
      }

      const decision = JSON.parse(jsonMatch[0]);
      
      // Log decision for learning (always works now!)
      await unifiedLearning.logDecision({
        task_id: this.taskId,
        decision_point: decisionPoint,
        options_considered: options,
        chosen_option: decision.chosen,
        reasoning: decision.reasoning,
        outcome_success: true // Will be updated later
      });

      logger.success('Decision', `Decision made: ${decision.chosen}`, decision.reasoning);
      return decision;
    } catch (error) {
      logger.logError('Decision', error, 'Failed to make autonomous decision');
      throw error;
    }
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

    await unifiedLearning.saveTaskHistory(taskHistory);
  }

  /**
   * Gets autonomous insights and suggestions
   */
  async getAutonomousInsights(): Promise<string[]> {
    const successRate = await unifiedLearning.getSuccessRate();
    const recentTasks = await unifiedLearning.getTaskHistory(10);
    const topPatterns = await unifiedLearning.getMostSuccessfulPatterns(5);
    const stats = unifiedLearning.getLearningStats();

    const insights: string[] = [
      `?? Self-learning AI is ALWAYS ACTIVE`,
      `?? Total tasks learned from: ${stats.tasksCompleted}`,
      `?? Patterns discovered: ${stats.patternsLearned}`,
      `? Autonomous decisions made: ${stats.decisionsMade}`
    ];
    
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
