//
// This file goes in: api/generate.ts
//
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Get the Google AI API key from Vercel Environment Variables
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // 2. Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // CHANGED: Use 'gemini-pro' as it's a stable and widely available model.
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 3. Get the prompt from the request body
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // 4. Make the secure, server-to-server request to Google AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Send the successful text response back to your React app
    return res.status(200).json({ text: text });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}
