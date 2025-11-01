/**
 * Web Worker for heavy code processing
 * Keeps UI responsive during intensive operations
 */

// TypeScript/JavaScript parsing and analysis
interface CodeAnalysisRequest {
  type: 'analyze';
  code: string;
  language: string;
}

interface FormatCodeRequest {
  type: 'format';
  code: string;
  language: string;
}

interface ValidateCodeRequest {
  type: 'validate';
  code: string;
  language: string;
}

interface TranspileRequest {
  type: 'transpile';
  code: string;
  from: string;
  to: string;
}

type WorkerRequest = CodeAnalysisRequest | FormatCodeRequest | ValidateCodeRequest | TranspileRequest;

// Handle messages
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;

  try {
    let result;

    switch (request.type) {
      case 'analyze':
        result = await analyzeCode(request.code, request.language);
        break;
      
      case 'format':
        result = await formatCode(request.code, request.language);
        break;
      
      case 'validate':
        result = await validateCode(request.code, request.language);
        break;
      
      case 'transpile':
        result = await transpileCode(request.code, request.from, request.to);
        break;
      
      default:
        throw new Error('Unknown request type');
    }

    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Code analysis
async function analyzeCode(code: string, language: string) {
  const lines = code.split('\n');
  const words = code.split(/\s+/).length;
  
  // Count various code metrics
  const metrics = {
    lines: lines.length,
    words,
    characters: code.length,
    functions: (code.match(/function\s+\w+/g) || []).length,
    classes: (code.match(/class\s+\w+/g) || []).length,
    imports: (code.match(/import\s+.*from/g) || []).length,
    exports: (code.match(/export\s+(default\s+)?/g) || []).length,
    comments: (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length,
    todos: (code.match(/TODO:|FIXME:|HACK:/gi) || []).length,
  };

  // Complexity analysis (simplified)
  const complexity = calculateComplexity(code);

  // Find potential issues
  const issues = findPotentialIssues(code, language);

  return {
    metrics,
    complexity,
    issues,
    language,
  };
}

// Calculate cyclomatic complexity (simplified)
function calculateComplexity(code: string): number {
  const patterns = [
    /if\s*\(/g,
    /else\s+if\s*\(/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /case\s+/g,
    /catch\s*\(/g,
    /\?\s*.*\s*:/g, // ternary
  ];

  let complexity = 1; // Base complexity
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  });

  return complexity;
}

// Find potential issues
function findPotentialIssues(code: string, language: string) {
  const issues: Array<{ type: string; message: string; line: number }> = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    // Check for console.log
    if (line.includes('console.log')) {
      issues.push({
        type: 'warning',
        message: 'Console.log found - remove before production',
        line: index + 1,
      });
    }

    // Check for TODO comments
    if (line.match(/TODO:|FIXME:/i)) {
      issues.push({
        type: 'info',
        message: 'TODO or FIXME comment found',
        line: index + 1,
      });
    }

    // Check for long lines
    if (line.length > 120) {
      issues.push({
        type: 'style',
        message: 'Line too long (> 120 characters)',
        line: index + 1,
      });
    }

    // Check for var usage (prefer const/let)
    if (language === 'javascript' || language === 'typescript') {
      if (line.match(/\bvar\s+/)) {
        issues.push({
          type: 'warning',
          message: 'Use const or let instead of var',
          line: index + 1,
        });
      }
    }
  });

  return issues;
}

// Format code (simplified - in production use Prettier)
async function formatCode(code: string, language: string) {
  // This is a very basic formatter
  // In production, use Prettier or similar
  
  let formatted = code;

  // Basic indentation
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentSize = 2;

  formatted = lines.map(line => {
    const trimmed = line.trim();
    
    // Decrease indent for closing braces
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indented = ' '.repeat(indentLevel * indentSize) + trimmed;

    // Increase indent for opening braces
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }

    return indented;
  }).join('\n');

  return formatted;
}

// Validate code
async function validateCode(code: string, language: string) {
  const errors: Array<{ message: string; line: number; column: number }> = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    // Check for syntax errors (very basic)
    
    // Mismatched brackets
    const openBrackets = (line.match(/[\{\[\(]/g) || []).length;
    const closeBrackets = (line.match(/[\}\]\)]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push({
        message: 'Mismatched brackets',
        line: index + 1,
        column: 0,
      });
    }

    // Missing semicolons (for languages that require them)
    if (['javascript', 'typescript', 'java'].includes(language)) {
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        // This is overly simplistic
        // In production, use a proper parser
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Transpile code (simplified)
async function transpileCode(code: string, from: string, to: string) {
  // This would use actual transpilers in production
  // For now, just return the code as-is
  
  if (from === 'typescript' && to === 'javascript') {
    // Very basic TypeScript to JavaScript (remove types)
    return code
      .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, ''); // Remove type aliases
  }

  return code;
}

export {};
