/**
 * Google Gemini Model Configuration
 * 
 * Official models available as of the Gemini API documentation:
 * https://ai.google.dev/gemini-api/docs
 */

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  bestFor: string[];
  limits?: {
    tokensPerMinute?: number;
    requestsPerMinute?: number;
  };
}

export const GEMINI_MODELS: Record<string, GeminiModel> = {
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model with advanced reasoning and complex task handling',
    capabilities: [
      'Advanced reasoning and problem-solving',
      'Complex code generation',
      'Large context window',
      'Multi-turn conversations',
      'Deep analysis and insights'
    ],
    bestFor: [
      'Complex applications',
      'Enterprise-level code generation',
      'Architectural planning',
      'Advanced autonomous tasks',
      'Multi-step problem solving'
    ]
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, efficient model balanced for speed and quality',
    capabilities: [
      'Fast response times',
      'Good reasoning abilities',
      'Code generation',
      'Quick iterations',
      'Efficient processing'
    ],
    bestFor: [
      'Standard web applications',
      'Quick prototypes',
      'Iterative development',
      'Real-time responses',
      'Most common use cases'
    ]
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Lightweight model optimized for speed and cost-efficiency',
    capabilities: [
      'Ultra-fast responses',
      'Basic code generation',
      'Simple tasks',
      'Cost-effective',
      'Low latency'
    ],
    bestFor: [
      'Simple components',
      'Quick fixes',
      'Basic utilities',
      'Testing and validation',
      'High-volume requests'
    ]
  },
  'gemini-2.5-flash-native-audio-preview-09-2025': {
    id: 'gemini-2.5-flash-native-audio-preview-09-2025',
    name: 'Gemini 2.5 Flash (Audio Preview)',
    description: 'Specialized model with native audio capabilities for real-time voice interactions',
    capabilities: [
      'Native audio input/output',
      'Real-time voice interactions',
      '2-way audio conversations',
      'Voice-driven development',
      'Audio-based commands'
    ],
    bestFor: [
      'Voice-controlled app building',
      'Real-time audio processing',
      '2-way conversational interfaces',
      'Audio-first applications',
      'Hands-free development'
    ]
  }
};

/**
 * Get model by ID
 */
export function getModel(modelId: string): GeminiModel | undefined {
  return GEMINI_MODELS[modelId];
}

/**
 * Get all available models
 */
export function getAllModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS);
}

/**
 * Get default model
 */
export function getDefaultModel(): GeminiModel {
  return GEMINI_MODELS['gemini-2.5-flash'];
}

/**
 * Recommend model based on task complexity
 */
export function recommendModel(complexity: 'simple' | 'moderate' | 'complex' | 'enterprise'): GeminiModel {
  switch (complexity) {
    case 'simple':
      return GEMINI_MODELS['gemini-2.5-flash-lite'];
    case 'moderate':
      return GEMINI_MODELS['gemini-2.5-flash'];
    case 'complex':
    case 'enterprise':
      return GEMINI_MODELS['gemini-2.5-pro'];
    default:
      return GEMINI_MODELS['gemini-2.5-flash'];
  }
}

/**
 * Model selection for different use cases
 */
export const MODEL_USE_CASES = {
  'code-generation': 'gemini-2.5-flash',
  'complex-architecture': 'gemini-2.5-pro',
  'quick-prototype': 'gemini-2.5-flash-lite',
  'voice-interaction': 'gemini-2.5-flash-native-audio-preview-09-2025',
  'autonomous-agent': 'gemini-2.5-pro',
  'validation': 'gemini-2.5-flash-lite'
} as const;
