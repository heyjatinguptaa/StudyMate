export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function checkOllamaHealth(endpointUrl = 'http://localhost:11434'): Promise<{
  isAvailable: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${endpointUrl.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      return { isAvailable: true, models };
    }
    return { isAvailable: false, models: [], error: `Server responded with ${res.status}` };
  } catch (err: any) {
    return { isAvailable: false, models: [], error: err.message || 'Cannot reach Ollama service' };
  }
}

export async function queryOllama(
  endpointUrl: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const cleanUrl = endpointUrl.replace(/\/$/, '');
  const res = await fetch(`${cleanUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      prompt,
      system: systemPrompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed with HTTP ${res.status}`);
  }

  const data: OllamaResponse = await res.json();
  return data.response;
}
