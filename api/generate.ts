import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Using Node.js runtime (default) for full Node.js API support
// Set a timeout for API requests (120 seconds max)
export const maxDuration = 120;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the prompt, API key, and generation parameters from the request body
    const { 
      prompt, 
      model: requestedModel, 
      apiKey,
      temperature,
      topP,
      topK,
      maxOutputTokens 
    } = req.body as { 
      prompt?: string; 
      model?: string;
      apiKey?: string;
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Prioritize API key from request body, fall back to environment variable
    const GOOGLE_API_KEY = apiKey || process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not found in request or environment variables.');
      return res.status(400).json({ 
        error: 'API key not configured',
        details: 'Please configure your Google AI API key in Settings. The API key must be provided either in the request or as an environment variable.',
        hint: 'Click the Settings icon and add your Google AI API key from https://aistudio.google.com/app/apikey'
      });
    }

    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Use the model specified in the request, default to gemini-2.5-flash for balanced performance
    const modelName = requestedModel || 'gemini-2.5-flash';
    
    // Safety settings to reduce false positives
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];
    
    // Generation configuration with defaults
    const generationConfig = {
      temperature: temperature ?? 0.9, // Higher temperature reduces recitation
      topP: topP ?? 0.95,
      topK: topK ?? 40,
      maxOutputTokens: maxOutputTokens ?? 8192,
    };
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      safetySettings,
      generationConfig
    });

    console.log(`Generating content with model: ${modelName}, temp: ${generationConfig.temperature}`);

    // Retry logic for RECITATION errors
    let retryCount = 0;
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Make the secure, server-to-server request to Google AI
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Check for blocking reasons
        const candidates = response.candidates;
        if (candidates && candidates[0]) {
          const finishReason = candidates[0].finishReason;
          
          // Handle RECITATION blocking
          if (finishReason === 'RECITATION') {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying due to RECITATION (attempt ${retryCount}/${maxRetries}) with higher temperature`);
              
              // Increase temperature and add more randomness to avoid recitation
              const retryConfig = {
                ...generationConfig,
                temperature: Math.min(1.0, (generationConfig.temperature || 0.9) + (0.1 * retryCount)),
                topP: 0.98,
                topK: Math.max(20, (generationConfig.topK || 40) - (10 * retryCount))
              };
              
              const retryModel = genAI.getGenerativeModel({ 
                model: modelName,
                safetySettings,
                generationConfig: retryConfig
              });
              
              const retryResult = await retryModel.generateContent(prompt);
              const retryResponse = await retryResult.response;
              const text = retryResponse.text();
              
              console.log('Successfully generated content after RECITATION retry');
              return res.status(200).json({ text, retried: true, retryCount });
            } else {
              // Max retries reached
              throw new Error('Content blocked due to RECITATION after multiple retries. Try rephrasing your prompt or asking for a different approach.');
            }
          }
          
          // Handle other blocking reasons
          if (finishReason === 'SAFETY') {
            throw new Error('Content was blocked by safety filters. Try rephrasing your request.');
          }
          
          if (finishReason === 'MAX_TOKENS') {
            throw new Error('Response exceeded maximum token limit. Try breaking down your request into smaller parts.');
          }
        }
        
        const text = response.text();
        console.log('Successfully generated content');
        return res.status(200).json({ text });
        
      } catch (genError) {
        lastError = genError instanceof Error ? genError : new Error(String(genError));
        
        // Check if it's a RECITATION error from the error message
        if (lastError.message.includes('RECITATION') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Caught RECITATION error, retrying (${retryCount}/${maxRetries})`);
          continue; // Try again with the loop
        }
        
        // If not a retryable error, throw it
        throw lastError;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to generate content after retries');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Server error:', errorMessage);
    console.error('Stack:', errorStack);
    
    // Provide helpful error messages based on error type
    let userMessage = errorMessage;
    let hint = '';
    
    if (errorMessage.includes('RECITATION')) {
      userMessage = 'Content generation blocked due to similarity with training data.';
      hint = 'Try rephrasing your prompt to be more specific and unique, or ask for a different implementation approach.';
    } else if (errorMessage.includes('API key')) {
      hint = 'Check your API key in Settings.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      hint = 'You may have exceeded your API quota. Wait a few minutes and try again.';
    } else if (errorMessage.includes('timeout')) {
      hint = 'Request took too long. Try breaking down your request into smaller parts.';
    }
    
    // Return a more detailed error message
    return res.status(500).json({ 
      error: 'Server error', 
      details: userMessage,
      hint: hint || undefined,
      timestamp: new Date().toISOString()
    });
  }
}
