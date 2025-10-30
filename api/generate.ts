//
// This file goes in: api/generate.ts
//
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This tells Vercel to stream the response
export const config = {
  runtime: 'edge',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the Anthropic API key from Vercel Environment Variables
  //    DO NOT hardcode your key here.
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Get the original request body from your React app
    const requestBody = await req.json();

    // 4. Make the secure, server-to-server request to Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...requestBody,
        // You can enable streaming here if your frontend supports it
        // stream: true, 
      }),
    });

    // 5. Check for errors from Anthropic
    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${errorText}` }), {
        status: anthropicResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Send the successful response from Anthropic back to your React app
    const data = await anthropicResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
