import { env } from '../config/env.js';

export interface OpenRouterGenerateInput {
  prompt: string;
}

export async function generateWithOpenRouter(input: OpenRouterGenerateInput): Promise<string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: input.prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenRouter returned empty content');
  }
  return content;
}
