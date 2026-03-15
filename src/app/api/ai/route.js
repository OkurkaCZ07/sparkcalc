import { NextResponse } from 'next/server';

/**
 * Server-side API route for AI calls.
 * This keeps your Anthropic API key secret on the server.
 * 
 * Set your API key in environment variable:
 *   ANTHROPIC_API_KEY=sk-ant-...
 * 
 * Create a .env.local file in the project root:
 *   ANTHROPIC_API_KEY=your-key-here
 */
export async function POST(request) {
  try {
    const { question, systemPrompt } = await request.json();

    if (!question || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing question or systemPrompt' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a helpful demo response when no API key is set
      return NextResponse.json({
        text: '**Demo Mode** — AI assistant is not configured yet. To enable it, add your Anthropic API key to `.env.local`:\n\n```\nANTHROPIC_API_KEY=sk-ant-your-key-here\n```\n\nYou can get an API key at https://console.anthropic.com. The calculators work perfectly without AI — the AI assistant is a bonus feature for design guidance.',
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content
      ?.map((block) => block.text || '')
      .filter(Boolean)
      .join('\n');

    return NextResponse.json({ text: text || 'No response generated.' });
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
