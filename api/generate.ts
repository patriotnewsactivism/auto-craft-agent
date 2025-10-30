import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    console.log('Handler: Method not allowed');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // 1. Get the Google AI API key from Vercel Environment Variables
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('Handler: GOOGLE_API_KEY not found in environment variables.');
    return res.status(500).json({ error: { message: 'API key not configured on server.' } });
  }

  try {
    // 2. Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Use 'gemini-pro' as it's a stable and widely available model.
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 3. Get the prompt from the request body
    const { prompt } = req.body;

    if (!prompt) {
      console.log('Handler: No prompt provided in request body.');
      return res.status(400).json({ error: { message: 'No prompt provided' } });
    }

    console.log('Handler: Sending prompt to Google AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Handler: Successfully received response from Google AI.');
    return res.status(200).json({ text: text });

  } catch (error) {
    console.error('Handler: Error during Google AI request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return res.status(500).json({ error: { message: `Server error: ${errorMessage}` } });
  }
}

