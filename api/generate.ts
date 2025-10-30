import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Using Node.js runtime (default) for full Node.js API support
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the Google AI API key from Vercel Environment Variables
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not found in environment variables.');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Using gemini-pro as it's stable
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get the prompt from the request body
    const { prompt } = req.body as { prompt?: string };

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Make the secure, server-to-server request to Google AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the successful text response back to your React app
    return res.status(200).json({ text: text });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', errorMessage);
    // Return a more detailed error message
    return res.status(500).json({ 
      error: 'Server error', 
      details: errorMessage 
    });
  }
}
