import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Using Node.js runtime (default) for full Node.js API support
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
    // Get the prompt and API key from the request body
    const { prompt, model: requestedModel, apiKey } = req.body as { 
      prompt?: string; 
      model?: string;
      apiKey?: string;
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
    
    // Using gemini-1.5-pro as it's the latest and most capable model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    console.log(`Generating content with model: ${requestedModel || 'gemini-1.5-pro'}`);

    // Make the secure, server-to-server request to Google AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Successfully generated content');

    // Send the successful text response back to your React app
    return res.status(200).json({ text: text });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Server error:', errorMessage);
    console.error('Stack:', errorStack);
    
    // Return a more detailed error message
    return res.status(500).json({ 
      error: 'Server error', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
