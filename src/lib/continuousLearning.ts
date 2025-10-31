import { AIService } from './aiService';
import { supabaseService, TaskHistory, CodePattern } from './supabaseService';

/**
 * Continuous Learning System
 * Enables the AI to improve autonomously over time without steady guidance
 * Key capabilities:
 * - Pattern recognition and extraction
 * - Success/failure analysis
 * - Adaptive decision making
 * - Knowledge graph building
 * - Self-optimization
 */

export interface LearningInsight {
  type: 'pattern' | 'improvement' | 'innovation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  implementation?: string;
}

export interface KnowledgeState {
  totalTasks: number;
  successRate: number;
  topPatterns: CodePattern[];
  recentLearnings: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specializations: string[];
}

export class ContinuousLearningSystem {
  private aiService: AIService;
  private knowledgeCache: Map<string, any> = new Map();
  private learningCycle: number = 0;

  constructor() {
    this.aiService = new AIService();
    this.initializeLearningCycle();
  }

  /**
   * Initializes continuous learning cycle
   */
  private async initializeLearningCycle(): Promise<void> {
    // Run learning analysis periodically
    setInterval(() => {
      this.performLearningCycle();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Main learning cycle - analyzes recent tasks and extracts patterns
   */
  private async performLearningCycle(): Promise<void> {
    this.learningCycle++;
    
    try {
      // Get recent tasks
      const recentTasks = await supabaseService.getTaskHistory(20);
      if (recentTasks.length < 5) return; // Need enough data to learn

      // Analyze patterns
      const insights = await this.analyzeTaskPatterns(recentTasks);
      
      // Extract new patterns
      for (const insight of insights) {
        if (insight.type === 'pattern' && insight.actionable) {
          await this.extractAndSavePattern(insight);
        }
      }

      // Update knowledge cache
      this.knowledgeCache.set('lastLearning', new Date());
      this.knowledgeCache.set('insights', insights);
      
      console.log(`Learning cycle ${this.learningCycle} completed. Found ${insights.length} insights.`);
    } catch (error) {
      console.error('Learning cycle error:', error);
    }
  }

  /**
   * Analyzes task patterns to extract learnings
   */
  private async analyzeTaskPatterns(tasks: TaskHistory[]): Promise<LearningInsight[]> {
    const tasksContext = tasks.map(t => ({
      description: t.task_description,
      success: t.success,
      patterns: t.patterns_learned,
      innovation: t.innovation_score,
      complexity: t.complexity
    }));

    const prompt = `You are a meta-learning AI that analyzes patterns in coding tasks to improve autonomously.

Recent Tasks Data:
${JSON.stringify(tasksContext, null, 2)}

Analyze these tasks and identify:
1. **Patterns**: Recurring successful approaches or techniques
2. **Improvements**: What could be done better in future tasks
3. **Innovations**: Novel solutions that worked well
4. **Warnings**: Approaches that failed or had issues

For each insight, consider:
- Is this pattern consistently successful?
- Can this be generalized and reused?
- What conditions make this pattern effective?
- How can this improve future autonomous decisions?

Return ONLY a JSON array:
[
  {
    "type": "pattern|improvement|innovation|warning",
    "title": "Short descriptive title",
    "description": "Detailed explanation",
    "confidence": 0.0-1.0 (how confident are you in this insight),
    "actionable": true/false (can this be implemented automatically),
    "implementation": "How to implement this in future tasks (if actionable)"
  }
]`;

    try {
      const response = await this.aiService.generateCode(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return [];
    }
  }

  /**
   * Extracts and saves a new pattern from insights
   */
  private async extractAndSavePattern(insight: LearningInsight): Promise<void> {
    const pattern: CodePattern = {
      pattern_name: insight.title,
      pattern_type: this.categorizePattern(insight.title),
      use_cases: [insight.description],
      code_template: insight.implementation || '',
      success_rate: insight.confidence,
      times_used: 0
    };

    await supabaseService.saveCodePattern(pattern);
  }

  /**
   * Categorizes a pattern based on its description
   */
  private categorizePattern(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('component')) return 'component';
    if (titleLower.includes('hook')) return 'hook';
    if (titleLower.includes('api') || titleLower.includes('endpoint')) return 'api';
    if (titleLower.includes('state') || titleLower.includes('store')) return 'state-management';
    if (titleLower.includes('test')) return 'testing';
    if (titleLower.includes('style') || titleLower.includes('css')) return 'styling';
    if (titleLower.includes('performance')) return 'optimization';
    if (titleLower.includes('security')) return 'security';
    if (titleLower.includes('database') || titleLower.includes('query')) return 'database';
    if (titleLower.includes('auth')) return 'authentication';
    
    return 'general';
  }

  /**
   * Gets current knowledge state for display
   */
  async getKnowledgeState(): Promise<KnowledgeState> {
    const tasks = await supabaseService.getTaskHistory(100);
    const patterns = await supabaseService.getMostSuccessfulPatterns(10);
    const successRate = await supabaseService.getSuccessRate();

    const specializations = this.identifySpecializations(tasks);
    const expertiseLevel = this.calculateExpertiseLevel(tasks.length, successRate, patterns.length);

    return {
      totalTasks: tasks.length,
      successRate,
      topPatterns: patterns,
      recentLearnings: tasks.slice(0, 5).flatMap(t => t.patterns_learned),
      expertiseLevel,
      specializations
    };
  }

  /**
   * Identifies areas of specialization
   */
  private identifySpecializations(tasks: TaskHistory[]): string[] {
    const keywords = new Map<string, number>();
    
    for (const task of tasks) {
      const words = task.task_description.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      }
    }

    // Get top 5 most frequent meaningful words
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Calculates current expertise level
   */
  private calculateExpertiseLevel(
    taskCount: number,
    successRate: number,
    patternCount: number
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const score = (taskCount / 10) + (successRate * 50) + (patternCount * 2);
    
    if (score >= 100) return 'expert';
    if (score >= 60) return 'advanced';
    if (score >= 30) return 'intermediate';
    return 'beginner';
  }

  /**
   * Predicts optimal approach for a new task based on learning
   */
  async predictOptimalApproach(taskDescription: string): Promise<{
    recommendedPatterns: CodePattern[];
    similarSuccesses: TaskHistory[];
    confidenceScore: number;
    reasoning: string;
  }> {
    // Find similar past tasks
    const similarTasks = await supabaseService.getSimilarTasks(taskDescription, 10);
    const successfulTasks = similarTasks.filter(t => t.success);

    // Get relevant patterns
    const allPatterns = await supabaseService.getCodePatterns();
    const relevantPatterns = this.findRelevantPatterns(taskDescription, allPatterns);

    // Calculate confidence based on similarity and success rate
    const confidence = this.calculateConfidence(successfulTasks, relevantPatterns);

    // Generate reasoning
    const reasoning = await this.generateReasoning(
      taskDescription,
      successfulTasks,
      relevantPatterns
    );

    return {
      recommendedPatterns: relevantPatterns.slice(0, 5),
      similarSuccesses: successfulTasks.slice(0, 5),
      confidenceScore: confidence,
      reasoning
    };
  }

  /**
   * Finds patterns relevant to a task
   */
  private findRelevantPatterns(task: string, patterns: CodePattern[]): CodePattern[] {
    const taskLower = task.toLowerCase();
    
    return patterns
      .filter(p => {
        const relevant = 
          p.pattern_name.toLowerCase().split(' ').some(word => taskLower.includes(word)) ||
          p.use_cases.some(uc => taskLower.includes(uc.toLowerCase())) ||
          taskLower.includes(p.pattern_type);
        return relevant && p.success_rate > 0.7;
      })
      .sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Calculates confidence score for predictions
   */
  private calculateConfidence(
    successfulTasks: TaskHistory[],
    patterns: CodePattern[]
  ): number {
    if (successfulTasks.length === 0 && patterns.length === 0) return 0.3;
    
    const taskConfidence = Math.min(successfulTasks.length / 5, 1) * 0.5;
    const patternConfidence = Math.min(patterns.length / 3, 1) * 0.5;
    
    return taskConfidence + patternConfidence;
  }

  /**
   * Generates reasoning for recommendations
   */
  private async generateReasoning(
    task: string,
    successfulTasks: TaskHistory[],
    patterns: CodePattern[]
  ): Promise<string> {
    if (successfulTasks.length === 0 && patterns.length === 0) {
      return 'No similar tasks or patterns found. This will be a learning experience!';
    }

    const prompt = `As a learning AI, explain why these patterns and past tasks are relevant.

Task: ${task}

Similar Successful Tasks:
${successfulTasks.map(t => `- ${t.task_description} (Innovation: ${t.innovation_score})`).join('\n')}

Recommended Patterns:
${patterns.map(p => `- ${p.pattern_name} (Success: ${(p.success_rate * 100).toFixed(0)}%)`).join('\n')}

Provide a brief, confident explanation of why this approach will succeed.`;

    try {
      const response = await this.aiService.generateCode(prompt);
      return response.substring(0, 500);
    } catch (error) {
      return 'Based on learned patterns, this approach has high success probability.';
    }
  }

  /**
   * Self-optimizes by analyzing performance trends
   */
  async selfOptimize(): Promise<string[]> {
    const state = await this.getKnowledgeState();
    const insights: string[] = [];

    // Analyze success rate trend
    if (state.successRate < 0.7) {
      insights.push('Success rate below optimal. Focusing on more thorough validation.');
    } else if (state.successRate > 0.9) {
      insights.push('High success rate maintained. Ready for more complex challenges.');
    }

    // Analyze pattern usage
    if (state.topPatterns.length < 5) {
      insights.push('Limited pattern library. Will extract more patterns from successful tasks.');
    }

    // Analyze expertise level
    if (state.expertiseLevel === 'expert') {
      insights.push('Expert level achieved. Can autonomously handle enterprise-level projects.');
    } else {
      insights.push(`Currently at ${state.expertiseLevel} level. Continuously improving.`);
    }

    return insights;
  }

  /**
   * Exports learned knowledge for sharing or backup
   */
  async exportKnowledge(): Promise<{
    patterns: CodePattern[];
    tasks: TaskHistory[];
    insights: LearningInsight[];
    metadata: {
      exportDate: string;
      totalTasks: number;
      expertiseLevel: string;
    };
  }> {
    const tasks = await supabaseService.getTaskHistory(1000);
    const patterns = await supabaseService.getCodePatterns();
    const state = await this.getKnowledgeState();
    const insights = this.knowledgeCache.get('insights') || [];

    return {
      patterns,
      tasks,
      insights,
      metadata: {
        exportDate: new Date().toISOString(),
        totalTasks: tasks.length,
        expertiseLevel: state.expertiseLevel
      }
    };
  }

  /**
   * Imports knowledge from another system or backup
   */
  async importKnowledge(knowledge: {
    patterns: CodePattern[];
    tasks: TaskHistory[];
  }): Promise<void> {
    // Import patterns
    for (const pattern of knowledge.patterns) {
      await supabaseService.saveCodePattern(pattern);
    }

    // Import tasks (for learning, not execution)
    for (const task of knowledge.tasks) {
      await supabaseService.saveTaskHistory(task);
    }
  }

  /**
   * Gets learning recommendations for user
   */
  async getLearningRecommendations(): Promise<string[]> {
    const state = await this.getKnowledgeState();
    const recommendations: string[] = [];

    if (state.totalTasks < 10) {
      recommendations.push('Try diverse tasks to build broad expertise');
      recommendations.push('Focus on completing successful tasks to build confidence');
    } else if (state.totalTasks < 50) {
      recommendations.push('Challenge me with more complex applications');
      recommendations.push('I\'m ready for full-stack projects');
    } else {
      recommendations.push('I can handle enterprise-level applications autonomously');
      recommendations.push('Try innovative or experimental project ideas');
    }

    if (state.successRate < 0.8) {
      recommendations.push('Provide more context for better results');
    }

    return recommendations;
  }
}

// Export singleton
export const continuousLearning = new ContinuousLearningSystem();
