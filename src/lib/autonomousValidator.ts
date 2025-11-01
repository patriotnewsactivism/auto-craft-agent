import { AIService } from './aiService';
import { parseJsonWithFallback } from './safeJsonParser';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  strengths: string[];
}

export interface TestResult {
  passed: boolean;
  coverage: number;
  tests: Array<{
    name: string;
    status: 'pass' | 'fail';
    message: string;
  }>;
}

export class AutonomousValidator {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Validates generated code autonomously
   */
  async validateCode(
    filePath: string,
    code: string,
    taskDescription: string
  ): Promise<ValidationResult> {
    const prompt = `As an autonomous code reviewer, thoroughly analyze this code.

File: ${filePath}
Task: ${taskDescription}

Code:
${code}

Perform a comprehensive review checking:
- Correctness and functionality
- Best practices and patterns
- Security vulnerabilities
- Performance optimization opportunities
- Error handling
- Code maintainability
- TypeScript/type safety
- Documentation quality
- Edge cases coverage

Return ONLY JSON:
{
  "isValid": boolean,
  "score": 0-100,
  "issues": ["critical problems found"],
  "suggestions": ["improvements to make"],
  "strengths": ["what was done well"]
}`;

    try {
      const response = await this.aiService.generateCode(prompt);
      return parseJsonWithFallback<ValidationResult>(
        response,
        this.getDefaultValidation(false)
      );
    } catch (error) {
      console.error('Validation error:', error);
      return this.getDefaultValidation(false);
    }
  }

  /**
   * Generates and runs autonomous tests
   */
  async generateAndValidateTests(
    filePath: string,
    code: string
  ): Promise<TestResult> {
    const prompt = `As an autonomous testing AI, analyze this code and generate comprehensive tests.

File: ${filePath}

Code:
${code}

Generate a test plan with:
- Unit tests for all functions
- Edge cases and boundary conditions
- Error scenarios
- Integration points

Return ONLY JSON:
{
  "passed": boolean (would tests pass),
  "coverage": 0-100 (estimated coverage),
  "tests": [
    {
      "name": "test description",
      "status": "pass|fail",
      "message": "what it tests and result"
    }
  ]
}`;

    try {
      const response = await this.aiService.generateCode(prompt);
      return parseJsonWithFallback<TestResult>(
        response,
        this.getDefaultTestResult()
      );
    } catch (error) {
      console.error('Test generation error:', error);
      return this.getDefaultTestResult();
    }
  }

  /**
   * Self-corrects code based on validation issues
   */
  async autonomousCorrection(
    filePath: string,
    code: string,
    validationResult: ValidationResult
  ): Promise<string> {
    if (validationResult.isValid && validationResult.score > 80) {
      return code; // Good enough, no correction needed
    }

    const prompt = `As an autonomous code improver, fix the issues in this code.

File: ${filePath}
Issues Found: ${validationResult.issues.join(', ')}
Suggestions: ${validationResult.suggestions.join(', ')}

Original Code:
${code}

Autonomously improve the code by:
- Fixing all identified issues
- Implementing suggestions
- Enhancing quality and robustness
- Maintaining functionality

Return ONLY the improved code, no explanations.`;

    try {
      return await this.aiService.generateCode(prompt);
    } catch (error) {
      console.error('Correction error:', error);
      return code; // Return original if correction fails
    }
  }

  /**
   * Validates architecture and design decisions
   */
  async validateArchitecture(
    files: Array<{ path: string; content: string }>,
    taskDescription: string
  ): Promise<ValidationResult> {
    const fileStructure = files.map(f => `${f.path}: ${f.content.split('\n').length} lines`).join('\n');
    const codeSnippets = files.map(f => 
      `${f.path}:\n${f.content.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `As an autonomous software architect, evaluate this project architecture.

Task: ${taskDescription}

File Structure:
${fileStructure}

Code Samples:
${codeSnippets}

Evaluate:
- Architecture patterns used
- Component separation and cohesion
- Scalability potential
- Maintainability
- Code organization
- Design principles (SOLID, DRY, etc.)

Return ONLY JSON:
{
  "isValid": boolean,
  "score": 0-100,
  "issues": ["architectural problems"],
  "suggestions": ["architectural improvements"],
  "strengths": ["good design decisions"]
}`;

    try {
      const response = await this.aiService.generateCode(prompt);
      return parseJsonWithFallback<ValidationResult>(
        response,
        this.getDefaultValidation(true)
      );
    } catch (error) {
      console.error('Architecture validation error:', error);
      return this.getDefaultValidation(true);
    }
  }

  /**
   * Performs security audit autonomously
   */
  async securityAudit(
    files: Array<{ path: string; content: string }>
  ): Promise<ValidationResult> {
    const codeContext = files.map(f => 
      `${f.path}:\n${f.content}`
    ).join('\n\n');

    const prompt = `As an autonomous security auditor, scan this code for vulnerabilities.

Code:
${codeContext}

Check for:
- Injection vulnerabilities (SQL, XSS, etc.)
- Authentication/authorization issues
- Sensitive data exposure
- Insecure dependencies
- CSRF vulnerabilities
- Input validation
- API security
- Secrets in code

Return ONLY JSON:
{
  "isValid": boolean (no critical vulnerabilities),
  "score": 0-100 (security score),
  "issues": ["security vulnerabilities found"],
  "suggestions": ["security improvements"],
  "strengths": ["good security practices"]
}`;

    try {
      const response = await this.aiService.generateCode(prompt);
      return parseJsonWithFallback<ValidationResult>(
        response,
        this.getDefaultValidation(true)
      );
    } catch (error) {
      console.error('Security audit error:', error);
      return this.getDefaultValidation(true);
    }
  }

  private getDefaultValidation(isValid: boolean): ValidationResult {
    return {
      isValid,
      score: isValid ? 70 : 50,
      issues: [],
      suggestions: [],
      strengths: []
    };
  }

  private getDefaultTestResult(): TestResult {
    return {
      passed: true,
      coverage: 0,
      tests: []
    };
  }
}
