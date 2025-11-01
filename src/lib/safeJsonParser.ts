import { logger } from './logger';

/**
 * Safe JSON Parser
 * Handles truncated or malformed JSON from AI responses
 */

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates if a JSON string is complete and well-formed
 */
function isCompleteJson(jsonStr: string): boolean {
  // Check for balanced braces and brackets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
  }
  
  // Check if we're still in a string (unterminated string literal)
  if (inString) {
    logger.debug('SafeJsonParser', 'Detected unterminated string in JSON');
    return false;
  }
  
  // Check if braces and brackets are balanced
  if (braceCount !== 0 || bracketCount !== 0) {
    logger.debug('SafeJsonParser', `Unbalanced JSON - braces: ${braceCount}, brackets: ${bracketCount}`);
    return false;
  }
  
  return true;
}

/**
 * Extracts JSON from text that may contain markdown or other content
 */
export function extractJson(text: string): string | null {
  // Try to find JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch && isCompleteJson(objectMatch[0])) {
    return objectMatch[0];
  }
  
  // Try to find JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch && isCompleteJson(arrayMatch[0])) {
    return arrayMatch[0];
  }
  
  // If greedy match failed, try to find the first complete JSON object
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = firstBrace; i < text.length; i++) {
      const char = text[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) continue;
      
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          const jsonStr = text.substring(firstBrace, i + 1);
          if (isCompleteJson(jsonStr)) {
            return jsonStr;
          }
        }
      }
    }
  }
  
  logger.warning('SafeJsonParser', 'Could not extract valid JSON from text');
  return null;
}

/**
 * Safely parse JSON with validation and error handling
 */
export function safeJsonParse<T = any>(text: string): ParseResult<T> {
  try {
    const jsonStr = extractJson(text);
    
    if (!jsonStr) {
      return {
        success: false,
        error: 'No valid JSON found in response. The AI response may be incomplete or truncated.'
      };
    }
    
    // Final validation before parsing
    if (!isCompleteJson(jsonStr)) {
      return {
        success: false,
        error: 'JSON structure is incomplete or has unterminated strings. The response may have been truncated due to token limits.'
      };
    }
    
    const data = JSON.parse(jsonStr) as T;
    logger.debug('SafeJsonParser', 'Successfully parsed JSON');
    
    return {
      success: true,
      data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Provide more helpful error messages
    if (errorMessage.includes('Unterminated string')) {
      logger.error('SafeJsonParser', 'Unterminated string in JSON', 'Response was likely truncated');
      return {
        success: false,
        error: 'The AI response was truncated and contains an incomplete JSON string. Try using a shorter prompt or requesting less detailed output.'
      };
    }
    
    if (errorMessage.includes('Unexpected token')) {
      logger.error('SafeJsonParser', 'Invalid JSON syntax', errorMessage);
      return {
        success: false,
        error: 'Invalid JSON syntax in AI response. The model may not have followed the JSON format instructions.'
      };
    }
    
    logger.error('SafeJsonParser', 'Failed to parse JSON', errorMessage);
    return {
      success: false,
      error: `Failed to parse JSON: ${errorMessage}`
    };
  }
}

/**
 * Parse JSON with a fallback value
 */
export function parseJsonWithFallback<T>(text: string, fallback: T): T {
  const result = safeJsonParse<T>(text);
  if (result.success && result.data) {
    return result.data;
  }
  
  logger.warning('SafeJsonParser', 'Using fallback value', result.error || 'Unknown error');
  return fallback;
}

/**
 * Parse JSON and throw on error (for cases where failure should propagate)
 */
export function parseJsonOrThrow<T>(text: string, context: string = 'Unknown'): T {
  const result = safeJsonParse<T>(text);
  if (result.success && result.data) {
    return result.data;
  }
  
  const errorMsg = `${context}: ${result.error || 'Failed to parse JSON'}`;
  logger.error('SafeJsonParser', `Failed to parse JSON in ${context}`, result.error || 'Unknown error');
  throw new Error(errorMsg);
}
