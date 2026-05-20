import type { LLMModel } from '@/types';

// ---- Types ----

export interface LLMRequestOptions {
  model: LLMModel;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: LLMModel;
  latencyMs: number;
}

// ---- Provider Configs ----

interface ProviderConfig {
  url: string;
  headers: () => Record<string, string>;
  buildBody: (opts: LLMRequestOptions) => Record<string, unknown>;
  parseResponse: (data: Record<string, unknown>) => { content: string; tokensUsed: number };
}

const providers: Record<string, ProviderConfig> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    }),
    buildBody: (opts) => ({
      model: opts.model,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userMessage },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
    parseResponse: (data) => {
      const choices = data.choices as Array<{ message: { content: string } }>;
      const usage = data.usage as { total_tokens: number };
      return {
        content: choices?.[0]?.message?.content ?? '',
        tokensUsed: usage?.total_tokens ?? 0,
      };
    },
  },

  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    buildBody: (opts) => ({
      system_instruction: { parts: [{ text: opts.systemPrompt }] },
      contents: [{ parts: [{ text: opts.userMessage }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 4096,
      },
    }),
    parseResponse: (data) => {
      const candidates = data.candidates as Array<{
        content: { parts: Array<{ text: string }> };
      }>;
      const usage = data.usageMetadata as { totalTokenCount: number };
      return {
        content: candidates?.[0]?.content?.parts?.[0]?.text ?? '',
        tokensUsed: usage?.totalTokenCount ?? 0,
      };
    },
  },

  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: () => ({
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (opts) => ({
      model: opts.model,
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.userMessage }],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
    parseResponse: (data) => {
      const content = data.content as Array<{ text: string }>;
      const usage = data.usage as { input_tokens: number; output_tokens: number };
      return {
        content: content?.[0]?.text ?? '',
        tokensUsed: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
      };
    },
  },
};

// ---- Model → Provider Mapping ----

function getProvider(model: LLMModel): { provider: ProviderConfig; modelId: string } {
  switch (model) {
    case 'gpt-4o':
    case 'gpt-4-turbo':
      return { provider: providers.openai, modelId: model };
    case 'gemini-2.5-pro':
      return { provider: providers.gemini, modelId: 'gemini-2.5-pro-preview-05-06' };
    case 'claude-opus-4':
      return { provider: providers.anthropic, modelId: 'claude-opus-4-20250514' };
    default:
      return { provider: providers.openai, modelId: 'gpt-4o' };
  }
}

// ---- Main Call Function ----

/**
 * Call an LLM with the given options.
 * Automatically routes to the correct provider API.
 */
export async function callLLM(opts: LLMRequestOptions): Promise<LLMResponse> {
  const { provider, modelId } = getProvider(opts.model);
  const startTime = Date.now();

  let url = provider.url;
  if (opts.model === 'gemini-2.5-pro') {
    url = `${provider.url}/${modelId}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  }

  const body = provider.buildBody({ ...opts, model: modelId as LLMModel });

  const response = await fetch(url, {
    method: 'POST',
    headers: provider.headers(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const parsed = provider.parseResponse(data);
  const latencyMs = Date.now() - startTime;

  return {
    content: parsed.content,
    tokensUsed: parsed.tokensUsed,
    model: opts.model,
    latencyMs,
  };
}

/**
 * Stream LLM response (OpenAI-compatible only).
 * Returns an async generator yielding content chunks.
 */
export async function* streamLLM(
  opts: LLMRequestOptions
): AsyncGenerator<{ content: string; done: boolean }> {
  const { provider } = getProvider(opts.model);

  // Streaming only supported for OpenAI-compatible APIs
  if (opts.model !== 'gpt-4o' && opts.model !== 'gpt-4-turbo') {
    const result = await callLLM(opts);
    yield { content: result.content, done: true };
    return;
  }

  const body = {
    ...provider.buildBody(opts),
    stream: true,
  };

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: provider.headers(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM Stream error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const json = trimmed.slice(6);
      if (json === '[DONE]') {
        yield { content: '', done: true };
        return;
      }
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          yield { content: delta, done: false };
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}
