import { AiProvider } from '@prisma/client';

export type ProviderConfig = {
 provider: AiProvider;
 apiKey: string;
 endpointBase?: string;
 defaultModel?: string;
 orgId?: string;
};

export interface AIProviderAdapter {
 chatJSON(
  prompt: string,
  opts?: { model?: string; system?: string }
 ): Promise<any>;
}

const DEFAULTS = {
 OPENAI: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
 ANTHROPIC: {
  base: 'https://api.anthropic.com',
  path: '/v1/messages',
  model: 'claude-3-5-sonnet-latest',
  version: process.env.ANTHROPIC_API_VERSION || '2023-06-01',
 },
 GOOGLE: {
  base: 'https://generativelanguage.googleapis.com',
  model: 'gemini-1.5-flash',
 },
 AZURE_OPENAI: {
  // endpointBase should be like: https://your-resource.openai.azure.com
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
 },
};

async function requestWithTimeout(
 url: string,
 init: RequestInit,
 timeoutMs = 12_000
): Promise<Response> {
 const controller = new AbortController();
 const id = setTimeout(() => controller.abort(), timeoutMs);
 try {
  const res = await fetch(url, { ...init, signal: controller.signal });
  return res;
 } finally {
  clearTimeout(id);
 }
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
 let lastErr: any;
 for (let i = 0; i < attempts; i++) {
  try {
   return await fn();
  } catch (e) {
   lastErr = e;
   await new Promise((r) => setTimeout(r, (i + 1) * 300));
  }
 }
 throw lastErr;
}

export function createAIProviderAdapter(
 cfg: ProviderConfig
): AIProviderAdapter {
 if (cfg.provider === 'OPENAI') {
  const base = cfg.endpointBase || DEFAULTS.OPENAI.base;
  const model = cfg.defaultModel || DEFAULTS.OPENAI.model;
  return {
   async chatJSON(prompt, opts) {
    const sys =
     opts?.system ||
     'You are a helpful analysis assistant. Output strictly valid JSON only.';
    const body = {
     model: opts?.model || model,
     messages: [
      { role: 'system', content: sys },
      { role: 'user', content: prompt },
     ],
     temperature: 0.2,
     response_format: { type: 'json_object' },
    };
    const res = await withRetry(() =>
     requestWithTimeout(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       Authorization: `Bearer ${cfg.apiKey}`,
       ...(cfg.orgId ? { 'OpenAI-Organization': cfg.orgId } : {}),
      },
      body: JSON.stringify(body),
     })
    );
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
    const data: any = await res.json();
    const choices: any[] | undefined = Array.isArray((data as any)?.choices)
     ? (data as any).choices
     : undefined;
    const text =
     choices && choices[0] && choices[0].message?.content
      ? String(choices[0].message.content)
      : '{}';
    try {
     return JSON.parse(text);
    } catch {
     return { raw: text };
    }
   },
  };
 }

 if (cfg.provider === 'ANTHROPIC') {
  const base = cfg.endpointBase || DEFAULTS.ANTHROPIC.base;
  const path = DEFAULTS.ANTHROPIC.path;
  const model = cfg.defaultModel || DEFAULTS.ANTHROPIC.model;
  const version = DEFAULTS.ANTHROPIC.version;
  return {
   async chatJSON(prompt, _opts) {
    const body = {
     model,
     max_tokens: 1024,
     messages: [{ role: 'user', content: prompt }],
    } as any;
    const res = await withRetry(() =>
     requestWithTimeout(`${base}${path}`, {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       'x-api-key': cfg.apiKey,
       'anthropic-version': version,
      },
      body: JSON.stringify(body),
     })
    );
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
    const data: any = await res.json();
    const text: string =
     data?.content?.[0]?.text || data?.content?.[0]?.content?.[0]?.text || '{}';
    try {
     return JSON.parse(text);
    } catch {
     return { raw: text };
    }
   },
  };
 }

 if (cfg.provider === 'GOOGLE') {
  const base = cfg.endpointBase || DEFAULTS.GOOGLE.base;
  const model = cfg.defaultModel || DEFAULTS.GOOGLE.model;
  return {
   async chatJSON(prompt, _opts) {
    // Google uses API key in query string
    const url = `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
    const body = {
     contents: [{ role: 'user', parts: [{ text: prompt }] }],
     generationConfig: { temperature: 0.2 },
    } as any;
    const res = await withRetry(() =>
     requestWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
     })
    );
    if (!res.ok) throw new Error(`Google error ${res.status}`);
    const data: any = await res.json();
    const text: string =
     data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
     return JSON.parse(text);
    } catch {
     return { raw: text };
    }
   },
  };
 }

 if (cfg.provider === 'AZURE_OPENAI') {
  const base = cfg.endpointBase?.replace(/\/$/, '') || '';
  const deployment = cfg.defaultModel; // here defaultModel should be deployment name
  const apiVersion = DEFAULTS.AZURE_OPENAI.apiVersion;
  if (!base || !deployment) {
   return {
    async chatJSON() {
     throw new Error(
      'Azure OpenAI requires endpointBase and defaultModel (deployment name)'
     );
    },
   };
  }
  return {
   async chatJSON(prompt, opts) {
    const sys =
     opts?.system ||
     'You are a helpful analysis assistant. Output strictly valid JSON only.';
    const body = {
     messages: [
      { role: 'system', content: sys },
      { role: 'user', content: prompt },
     ],
     temperature: 0.2,
     response_format: { type: 'json_object' },
    } as any;
    const url = `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
    const res = await withRetry(() =>
     requestWithTimeout(url, {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       'api-key': cfg.apiKey,
      },
      body: JSON.stringify(body),
     })
    );
    if (!res.ok) throw new Error(`Azure OpenAI error ${res.status}`);
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content || '{}';
    try {
     return JSON.parse(text);
    } catch {
     return { raw: text };
    }
   },
  };
 }

 // Custom HTTP adapter: POST to endpointBase with { prompt }, expect JSON response
 if (cfg.provider === 'CUSTOM') {
  const base = cfg.endpointBase || '';
  return {
   async chatJSON(prompt) {
    if (!base) throw new Error('Custom provider requires endpointBase');
    const res = await withRetry(() =>
     requestWithTimeout(base, {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ prompt, mode: 'json' }),
     })
    );
    if (!res.ok) throw new Error(`Custom provider error ${res.status}`);
    const data: any = await res.json();
    // Assume provider already returns JSON object
    return data;
   },
  };
 }

 // Default unsupported provider
 return {
  async chatJSON() {
   throw new Error('Unsupported provider');
  },
 };
}
