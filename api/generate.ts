import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// VERCEL CONFIG: This tells Vercel to run this as an Edge Function
export const config = {
  runtime: 'edge',
};

// Note: We use 'Request' and 'Response' from the global scope in Edge Functions
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the Google AI API key from Vercel Environment Variables
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not found in environment variables.');
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    
    // Using gemini-pro as it's stable
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get the prompt from the request body
    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Make the secure, server-to-server request to Google AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the successful text response back to your React app
    return new Response(JSON.stringify({ text: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', errorMessage);
    // Return a more detailed error message
    return new Response(JSON.stringify({ 
      error: 'Server error', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
