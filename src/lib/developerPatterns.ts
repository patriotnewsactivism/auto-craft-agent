/**
 * Developer-Style Pattern Recognition
 * Makes the AI think and learn like a real senior developer
 */

import { unifiedLearning } from './unifiedLearningService';
import { CodePattern } from './supabaseService';
import { logger } from './logger';

export interface DeveloperInsight {
  category: 'best-practice' | 'anti-pattern' | 'optimization' | 'architecture' | 'security';
  insight: string;
  codeExample?: string;
  whenToUse: string[];
  confidence: number;
}

export class DeveloperPatternRecognizer {
  private static commonPatterns = [
    // React patterns
    {
      pattern_name: 'Custom Hook Pattern',
      pattern_type: 'hook',
      use_cases: ['Reusable stateful logic', 'Component logic extraction'],
      code_template: 'export const useCustomHook = () => { const [state, setState] = useState(); return { state, actions }; }',
      success_rate: 0.95,
      times_used: 0
    },
    {
      pattern_name: 'Compound Component Pattern',
      pattern_type: 'component',
      use_cases: ['Complex UI components', 'Flexible component APIs'],
      code_template: 'Parent.Child = ChildComponent; export default Parent;',
      success_rate: 0.90,
      times_used: 0
    },
    // Architecture patterns
    {
      pattern_name: 'Service Layer Pattern',
      pattern_type: 'architecture',
      use_cases: ['API abstraction', 'Business logic separation'],
      code_template: 'export class Service { async method() { return await api.call(); } }',
      success_rate: 0.95,
      times_used: 0
    },
    {
      pattern_name: 'Repository Pattern',
      pattern_type: 'architecture',
      use_cases: ['Data access abstraction', 'Testable data layer'],
      code_template: 'export class Repository { async findById(id) { return await db.query(); } }',
      success_rate: 0.92,
      times_used: 0
    },
    // Performance patterns
    {
      pattern_name: 'Memoization Pattern',
      pattern_type: 'optimization',
      use_cases: ['Expensive calculations', 'Prevent re-renders'],
      code_template: 'const memoized = useMemo(() => expensiveComputation(), [deps]);',
      success_rate: 0.93,
      times_used: 0
    },
    {
      pattern_name: 'Debounce Pattern',
      pattern_type: 'optimization',
      use_cases: ['Search inputs', 'Frequent API calls'],
      code_template: 'const debounced = useDebounce(value, delay);',
      success_rate: 0.90,
      times_used: 0
    },
    // Error handling patterns
    {
      pattern_name: 'Error Boundary Pattern',
      pattern_type: 'component',
      use_cases: ['Graceful error handling', 'Component isolation'],
      code_template: 'class ErrorBoundary extends Component { componentDidCatch() {} render() {} }',
      success_rate: 0.95,
      times_used: 0
    },
    {
      pattern_name: 'Try-Catch with Logging',
      pattern_type: 'error-handling',
      use_cases: ['API calls', 'Critical operations'],
      code_template: 'try { await operation(); } catch (error) { logger.error(error); throw error; }',
      success_rate: 0.98,
      times_used: 0
    },
    // State management patterns
    {
      pattern_name: 'Reducer Pattern',
      pattern_type: 'state-management',
      use_cases: ['Complex state logic', 'Predictable state updates'],
      code_template: 'const [state, dispatch] = useReducer(reducer, initialState);',
      success_rate: 0.92,
      times_used: 0
    },
    // Security patterns
    {
      pattern_name: 'Input Sanitization',
      pattern_type: 'security',
      use_cases: ['User inputs', 'XSS prevention'],
      code_template: 'const sanitized = DOMPurify.sanitize(userInput);',
      success_rate: 0.99,
      times_used: 0
    },
    {
      pattern_name: 'Environment Variable Pattern',
      pattern_type: 'security',
      use_cases: ['API keys', 'Sensitive configuration'],
      code_template: 'const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;',
      success_rate: 0.97,
      times_used: 0
    }
  ];

  /**
   * Initialize common developer patterns in learning system
   */
  static async initializeCommonPatterns(): Promise<void> {
    logger.info('DevPatterns', 'Initializing common developer patterns');
    
    let initialized = 0;
    for (const pattern of this.commonPatterns) {
      try {
        await unifiedLearning.saveCodePattern(pattern);
        initialized++;
      } catch (error) {
        logger.warning('DevPatterns', `Failed to initialize pattern: ${pattern.pattern_name}`);
      }
    }
    
    logger.success('DevPatterns', `Initialized ${initialized}/${this.commonPatterns.length} developer patterns`);
  }

  /**
   * Analyze code to identify developer patterns being used
   */
  static async analyzeCodePatterns(code: string, filename: string): Promise<string[]> {
    const patterns: string[] = [];
    const codeLower = code.toLowerCase();

    // React patterns
    if (codeLower.includes('usestate') || codeLower.includes('useeffect')) {
      patterns.push('React Hooks');
    }
    if (codeLower.includes('usememo') || codeLower.includes('usecallback')) {
      patterns.push('Performance Optimization');
    }
    if (codeLower.includes('usereducer')) {
      patterns.push('Complex State Management');
    }
    if (codeLower.includes('createcontext') || codeLower.includes('usecontext')) {
      patterns.push('Context API');
    }

    // Architecture patterns
    if (codeLower.includes('class') && codeLower.includes('service')) {
      patterns.push('Service Layer');
    }
    if (codeLower.includes('repository') || codeLower.includes('dao')) {
      patterns.push('Repository Pattern');
    }
    if (codeLower.includes('factory') || codeLower.includes('builder')) {
      patterns.push('Creational Pattern');
    }

    // Error handling
    if (codeLower.includes('try') && codeLower.includes('catch')) {
      patterns.push('Error Handling');
    }
    if (codeLower.includes('errorboundary')) {
      patterns.push('React Error Boundary');
    }

    // Async patterns
    if (codeLower.includes('async') && codeLower.includes('await')) {
      patterns.push('Async/Await');
    }
    if (codeLower.includes('promise')) {
      patterns.push('Promise Pattern');
    }

    // Type safety
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      if (codeLower.includes('interface') || codeLower.includes('type ')) {
        patterns.push('TypeScript Types');
      }
    }

    // Testing
    if (codeLower.includes('test(') || codeLower.includes('it(') || codeLower.includes('describe(')) {
      patterns.push('Unit Testing');
    }

    logger.debug('DevPatterns', `Identified ${patterns.length} patterns in ${filename}`);
    return patterns;
  }

  /**
   * Get developer insights for a task
   */
  static async getDeveloperInsights(taskDescription: string): Promise<DeveloperInsight[]> {
    const insights: DeveloperInsight[] = [];
    const taskLower = taskDescription.toLowerCase();

    // Architecture insights
    if (taskLower.includes('api') || taskLower.includes('backend')) {
      insights.push({
        category: 'architecture',
        insight: 'Consider implementing a service layer to abstract API logic',
        whenToUse: ['API integration', 'Business logic separation'],
        confidence: 0.9
      });
    }

    // Performance insights
    if (taskLower.includes('list') || taskLower.includes('table') || taskLower.includes('data')) {
      insights.push({
        category: 'optimization',
        insight: 'Use virtualization for large lists, memoization for expensive renders',
        whenToUse: ['Large datasets', 'Frequent re-renders'],
        confidence: 0.85
      });
    }

    // Security insights
    if (taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('user')) {
      insights.push({
        category: 'security',
        insight: 'Implement proper authentication with token management and secure storage',
        whenToUse: ['User authentication', 'Protected routes'],
        confidence: 0.95
      });
    }

    // State management insights
    if (taskLower.includes('state') || taskLower.includes('data') || taskLower.includes('store')) {
      insights.push({
        category: 'architecture',
        insight: 'Choose state management: Context API for simple, Redux/Zustand for complex',
        whenToUse: ['Application state', 'Shared data'],
        confidence: 0.88
      });
    }

    // Best practices
    insights.push({
      category: 'best-practice',
      insight: 'Always implement error boundaries and loading states for better UX',
      whenToUse: ['All React applications'],
      confidence: 0.92
    });

    logger.debug('DevPatterns', `Generated ${insights.length} developer insights for task`);
    return insights;
  }

  /**
   * Learn from code execution - like a developer reviewing their work
   */
  static async learnFromExecution(
    task: string,
    generatedFiles: Array<{ path: string; content: string }>,
    success: boolean
  ): Promise<void> {
    logger.info('DevPatterns', 'Learning from execution like a developer');

    // Analyze each generated file
    const allPatterns: Set<string> = new Set();
    for (const file of generatedFiles) {
      const patterns = await this.analyzeCodePatterns(file.content, file.path);
      patterns.forEach(p => allPatterns.add(p));
    }

    // Save insights about what patterns were used
    const patternList = Array.from(allPatterns);
    if (patternList.length > 0) {
      logger.success('DevPatterns', `Identified patterns: ${patternList.join(', ')}`);
      
      // Update pattern usage statistics
      for (const pattern of patternList) {
        try {
          await unifiedLearning.updatePatternUsage('', pattern, success);
        } catch (error) {
          // Pattern might not exist yet, that's ok
        }
      }
    }

    // Save a custom insight about this execution
    if (success && patternList.length > 3) {
      const newPattern: CodePattern = {
        pattern_name: `Multi-Pattern Solution for ${task.substring(0, 30)}`,
        pattern_type: 'architecture',
        use_cases: [task],
        code_template: patternList.join(', '),
        success_rate: 1.0,
        times_used: 1
      };
      await unifiedLearning.saveCodePattern(newPattern);
      logger.success('DevPatterns', 'Saved new multi-pattern solution to knowledge base');
    }
  }

  /**
   * Get code review insights - like a senior developer reviewing code
   */
  static async getCodeReviewInsights(code: string): Promise<string[]> {
    const insights: string[] = [];

    // Check for error handling
    if (!code.includes('try') && (code.includes('await') || code.includes('fetch'))) {
      insights.push('⚠️ Add error handling with try-catch for async operations');
    }

    // Check for TypeScript types
    if (code.includes('any') && code.includes('typescript')) {
      insights.push('💡 Replace "any" types with specific types for better type safety');
    }

    // Check for loading states
    if (code.includes('fetch') && !code.includes('loading')) {
      insights.push('📊 Add loading states for better user experience');
    }

    // Check for accessibility
    if (code.includes('<button') && !code.includes('aria-')) {
      insights.push('♿ Add ARIA labels for better accessibility');
    }

    // Check for memoization
    if (code.includes('map(') && code.includes('render') && !code.includes('useMemo')) {
      insights.push('⚡ Consider memoization for list renders to improve performance');
    }

    // Check for proper cleanup
    if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
      insights.push('🧹 Add cleanup for event listeners in useEffect return');
    }

    return insights;
  }
}

// Initialize common patterns on module load
if (typeof window !== 'undefined') {
  DeveloperPatternRecognizer.initializeCommonPatterns().catch(err => 
    console.error('Failed to initialize developer patterns:', err)
  );
}

export const devPatterns = DeveloperPatternRecognizer;
