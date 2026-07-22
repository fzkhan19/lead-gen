export enum Type {
  TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
}

function wrapResponse(data: any) {
  if (!data) {
    return data;
  }
  return {
    ...data,
    get text() {
      const parts = data.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (typeof part.text === 'string') {
            return part.text;
          }
        }
      }
      return '';
    },
    get functionCalls() {
      const parts = data.candidates?.[0]?.content?.parts;
      const calls: any[] = [];
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.functionCall) {
            calls.push(part.functionCall);
          }
        }
      }
      return calls.length > 0 ? calls : undefined;
    },
  };
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
        console.warn(`[CLIENT GEMINI RETRY] HTTP ${response.status} on ${url}. Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
        console.warn(`[CLIENT GEMINI RETRY] Network error on ${url}. Attempt ${attempt} failed: ${error}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

export class GoogleGenAI {
  models = {
    generateContent: async (params: any) => {
      try {
        const response = await fetchWithRetry('/api/gemini/generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        return wrapResponse(data);
      } catch (error) {
        console.error('generateContent proxy error:', error);
        throw error;
      }
    },
  };

  chats = {
    create: (chatParams: any) => {
      const history = [...(chatParams.history || [])];
      return {
        sendMessage: async (msgParams: any) => {
          try {
            const response = await fetchWithRetry('/api/gemini/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: chatParams.model,
                config: chatParams.config,
                history,
                message: msgParams.message,
              }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
              throw new Error(err.error || `HTTP ${response.status}`);
            }
            const data = await response.json();
            // Update history
            history.push({ role: 'user', parts: [{ text: msgParams.message }] });
            if (data.candidates?.[0]?.content) {
              history.push(data.candidates[0].content);
            }
            return wrapResponse(data);
          } catch (error) {
            console.error('chat sendMessage proxy error:', error);
            throw error;
          }
        },
      };
    },
  };
}
