import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';

/**
 * Image to Code Service
 * Convert screenshots, designs, or wireframes to code using Gemini Vision
 */

export interface ImageInput {
  data: string | File | Blob;
  mimeType: string;
  name?: string;
}

export interface ImageToCodeResult {
  code: string;
  language: string;
  framework?: string;
  components: string[];
  description: string;
  confidence: number;
}

export interface ImageAnalysis {
  elements: UIElement[];
  layout: LayoutInfo;
  colors: ColorScheme;
  typography: Typography;
  suggestions: string[];
}

export interface UIElement {
  type: string;
  properties: Record<string, any>;
  children?: UIElement[];
}

export interface LayoutInfo {
  type: 'flex' | 'grid' | 'absolute' | 'flow';
  direction?: 'row' | 'column';
  spacing?: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
}

export interface Typography {
  fontFamily: string;
  sizes: Record<string, string>;
  weights: Record<string, string>;
}

export class ImageToCodeService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeAI();
  }

  /**
   * Initialize Gemini AI
   */
  private initializeAI(): void {
    // Try to get API key from environment or localStorage
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('gemini_api_key') || 
                    import.meta.env.VITE_GOOGLE_API_KEY;
    } else {
      this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    }

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      logger.info('ImageToCode', 'AI initialized');
    } else {
      logger.warn('ImageToCode', 'No API key available');
    }
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    logger.info('ImageToCode', 'API key updated');
  }

  /**
   * Convert image to code
   */
  async imageToCode(
    image: ImageInput,
    options: {
      framework?: 'react' | 'vue' | 'angular' | 'html';
      language?: 'typescript' | 'javascript';
      styling?: 'tailwind' | 'css' | 'styled-components';
      responsive?: boolean;
    } = {}
  ): Promise<ImageToCodeResult> {
    if (!this.genAI) {
      throw new Error('AI not initialized. Please set API key.');
    }

    try {
      logger.info('ImageToCode', 'Converting image to code', options);

      // Analyze image first
      const analysis = await this.analyzeImage(image);

      // Generate code based on analysis
      const code = await this.generateCode(image, analysis, options);

      const result: ImageToCodeResult = {
        code,
        language: options.language || 'typescript',
        framework: options.framework || 'react',
        components: this.extractComponents(code),
        description: analysis.suggestions.join('. '),
        confidence: 0.85,
      };

      logger.info('ImageToCode', 'Code generated successfully');
      return result;

    } catch (error) {
      logger.error('ImageToCode', 'Image to code failed', error);
      throw error;
    }
  }

  /**
   * Analyze image structure
   */
  async analyzeImage(image: ImageInput): Promise<ImageAnalysis> {
    if (!this.genAI) {
      throw new Error('AI not initialized');
    }

    try {
      logger.debug('ImageToCode', 'Analyzing image');

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 4096  // Prevent token limit errors
        }
      });

      const imageData = await this.prepareImageData(image);

      const prompt = `Analyze this UI design image and provide:
1. List all UI elements (buttons, inputs, text, images, etc.)
2. Describe the layout structure (flex, grid, etc.)
3. Identify colors used (primary, secondary, background, text)
4. Note typography (fonts, sizes)
5. Suggest best practices for implementation

Return your analysis in a structured format.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType,
          },
        },
      ]);

      const response = result.response.text();
      const analysis = this.parseAnalysis(response);

      logger.debug('ImageToCode', 'Analysis complete');
      return analysis;

    } catch (error) {
      logger.error('ImageToCode', 'Image analysis failed', error);
      throw error;
    }
  }

  /**
   * Generate code from image and analysis
   */
  private async generateCode(
    image: ImageInput,
    analysis: ImageAnalysis,
    options: any
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro', // Use Pro for better code generation
      generationConfig: {
        maxOutputTokens: 4096  // Prevent token limit errors
      }
    });

    const imageData = await this.prepareImageData(image);

    const framework = options.framework || 'react';
    const language = options.language || 'typescript';
    const styling = options.styling || 'tailwind';
    const responsive = options.responsive !== false;

    const prompt = `Convert this UI design to ${framework} code.

Requirements:
- Framework: ${framework}
- Language: ${language}
- Styling: ${styling}
- Responsive: ${responsive ? 'Yes' : 'No'}

Generate clean, production-ready code that:
1. Matches the design exactly
2. Uses modern best practices
3. Includes proper TypeScript types
4. Has semantic HTML structure
5. Is fully accessible (ARIA labels, etc.)
6. Is responsive (mobile-first approach)
7. Uses ${styling} for styling
8. Includes comments for complex parts

Return ONLY the code, no explanations.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType,
        },
      },
    ]);

    let code = result.response.text();

    // Clean up code block markers
    code = code.replace(/```(?:typescript|javascript|tsx|jsx|html|css)?\n?/g, '');
    code = code.trim();

    return code;
  }

  /**
   * Prepare image data for API
   */
  private async prepareImageData(image: ImageInput): Promise<{ data: string; mimeType: string }> {
    if (typeof image.data === 'string') {
      // Already base64
      const base64Data = image.data.includes('base64,') 
        ? image.data.split('base64,')[1] 
        : image.data;
      
      return {
        data: base64Data,
        mimeType: image.mimeType,
      };
    }

    // Convert File/Blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.includes('base64,') 
          ? result.split('base64,')[1] 
          : result;
        
        resolve({
          data: base64Data,
          mimeType: image.mimeType,
        });
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(image.data as Blob);
    });
  }

  /**
   * Parse analysis response
   */
  private parseAnalysis(response: string): ImageAnalysis {
    // Default analysis structure
    const analysis: ImageAnalysis = {
      elements: [],
      layout: { type: 'flex', direction: 'column' },
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      typography: {
        fontFamily: 'system-ui',
        sizes: { base: '16px', lg: '18px', xl: '20px' },
        weights: { normal: '400', bold: '700' },
      },
      suggestions: [
        'Use semantic HTML elements',
        'Ensure accessibility with ARIA labels',
        'Implement responsive design',
        'Optimize images for web',
      ],
    };

    // Try to parse structured data from response
    try {
      // Look for JSON-like structures in response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        Object.assign(analysis, parsed);
      }
    } catch (error) {
      // If parsing fails, use defaults
      logger.debug('ImageToCode', 'Using default analysis structure');
    }

    return analysis;
  }

  /**
   * Extract components from generated code
   */
  private extractComponents(code: string): string[] {
    const components: string[] = [];

    // Extract React/Vue component names
    const componentPatterns = [
      /(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g,
      /class\s+([A-Z][a-zA-Z0-9]*)/g,
      /export\s+(?:default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g,
    ];

    for (const pattern of componentPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !components.includes(match[1])) {
          components.push(match[1]);
        }
      }
    }

    return components;
  }

  /**
   * Convert Figma design to code
   */
  async figmaToCode(figmaUrl: string, options: any = {}): Promise<ImageToCodeResult> {
    // This would integrate with Figma API
    logger.info('ImageToCode', 'Figma integration not yet implemented', figmaUrl);
    throw new Error('Figma integration coming soon');
  }

  /**
   * Convert screenshot to code
   */
  async screenshotToCode(
    screenshotData: string,
    options: any = {}
  ): Promise<ImageToCodeResult> {
    const image: ImageInput = {
      data: screenshotData,
      mimeType: 'image/png',
      name: 'screenshot.png',
    };

    return this.imageToCode(image, options);
  }

  /**
   * Batch convert multiple images
   */
  async batchConvert(
    images: ImageInput[],
    options: any = {}
  ): Promise<ImageToCodeResult[]> {
    logger.info('ImageToCode', `Batch converting ${images.length} images`);

    const results: ImageToCodeResult[] = [];

    for (const image of images) {
      try {
        const result = await this.imageToCode(image, options);
        results.push(result);
      } catch (error) {
        logger.error('ImageToCode', 'Batch conversion error', error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.genAI !== null;
  }
}

// Export singleton instance
export const imageToCodeService = new ImageToCodeService();
