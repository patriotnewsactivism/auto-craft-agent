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

  // Get the Google AI API key from Vercel Environment Variables
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not found in environment variables.');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
    return res.status(500).json({ 
      error: 'API key not configured',
      details: 'GOOGLE_API_KEY environment variable is missing. Please configure it in your Vercel project settings.',
      hint: 'Set GOOGLE_API_KEY (without VITE_ prefix) in Vercel environment variables'
    });
  }

  try {
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Using gemini-pro as it's stable
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get the prompt from the request body
    const { prompt, model: requestedModel } = req.body as { prompt?: string; model?: string };

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    console.log(`Generating content with model: ${requestedModel || 'gemini-pro'}`);

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
