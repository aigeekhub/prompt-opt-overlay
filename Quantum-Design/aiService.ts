/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export interface ModelSettings {
  activeProvider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter' | 'vertex';
  gemini: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  claude: {
    apiKey: string;
    model: string;
  };
  grok: {
    apiKey: string;
    model: string;
  };
  openrouter: {
    apiKey: string;
    model: string;
  };
  vertex: {
    serviceAccountJson: string;
    model: string;
    region: string;
  };
}

export const DEFAULT_SETTINGS: ModelSettings = {
  activeProvider: 'vertex',
  gemini: {
    apiKey: '',
    model: 'gemini-2.5-flash',
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  claude: {
    apiKey: '',
    model: 'claude-3-5-sonnet-latest',
  },
  grok: {
    apiKey: '',
    model: 'grok-2-1212',
  },
  openrouter: {
    apiKey: '',
    model: 'google/gemini-2.5-pro',
  },
  vertex: {
    serviceAccountJson: '',
    model: 'gemini-2.5-flash',
    region: 'us-central1',
  }
};

export function loadSettings(): ModelSettings {
  try {
    const saved = localStorage.getItem('alchemy_model_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with default settings to handle added fields
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        gemini: { ...DEFAULT_SETTINGS.gemini, ...parsed.gemini },
        openai: { ...DEFAULT_SETTINGS.openai, ...parsed.openai },
        claude: { ...DEFAULT_SETTINGS.claude, ...parsed.claude },
        grok: { ...DEFAULT_SETTINGS.grok, ...parsed.grok },
        openrouter: { ...DEFAULT_SETTINGS.openrouter, ...parsed.openrouter },
        vertex: { ...DEFAULT_SETTINGS.vertex, ...parsed.vertex },
      };
    }
  } catch (e) {
    console.warn("Failed to load model settings from localStorage", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ModelSettings): void {
  try {
    localStorage.setItem('alchemy_model_settings', JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save model settings to localStorage", e);
  }
}

function getUserEmail(): string {
  try {
    return localStorage.getItem('user_email') || 'anonymous@aigeekhub.com';
  } catch (e) {
    return 'anonymous@aigeekhub.com';
  }
}

function getApiBase(): string {
  try {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/quantum') ? '/quantum' : '';
  } catch (e) {
    return '';
  }
}

// --- GOOGLE OAUTH JWT SIGNING FOR VERTEX AI ---

function base64UrlEncode(obj: any): string {
  const str = JSON.stringify(obj);
  const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function importPemPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );
}

async function signJwt(privateKey: CryptoKey, header: any, payload: any): Promise<string> {
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    encoder.encode(dataToSign)
  );
  
  const signatureArray = new Uint8Array(signature);
  let binarySign = '';
  for (let i = 0; i < signatureArray.length; i++) {
    binarySign += String.fromCharCode(signatureArray[i]);
  }
  const encodedSignature = btoa(binarySign)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
  return `${dataToSign}.${encodedSignature}`;
}

export async function getGCPAccessToken(saJsonString: string): Promise<{ token: string; projectId: string }> {
  let saJson: any;
  try {
    saJson = JSON.parse(saJsonString);
  } catch (e) {
    throw new Error('Invalid Service Account JSON. Ensure you pasted a valid Google Cloud Service Account key file.');
  }

  const privateKeyString = saJson.private_key;
  const clientEmail = saJson.client_email;
  const projectId = saJson.project_id;
  const tokenUrl = saJson.token_uri || 'https://oauth2.googleapis.com/token';
  
  if (!privateKeyString || !clientEmail || !projectId) {
    throw new Error('Missing private_key, client_email, or project_id in Service Account JSON.');
  }
  
  const privateKey = await importPemPrivateKey(privateKeyString);
  const now = Math.floor(Date.now() / 1000);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUrl,
    exp: now + 3600,
    iat: now
  };
  
  const jwt = await signJwt(privateKey, header, payload);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to retrieve GCP OAuth token: ${errorText}`);
  }
  
  const data = await response.json();
  return { token: data.access_token, projectId };
}

// --- AI ORCHESTRATION ---

export interface GenerationParams {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  onChunk?: (text: string) => void;
}

/**
 * Fetches the available models for a given provider using the currently configured settings/keys via local proxies.
 */
export async function fetchModelsForProvider(
  provider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter' | 'vertex',
  settings: ModelSettings
): Promise<{ id: string; name: string }[]> {
  try {
    switch (provider) {
      case 'gemini': {
        const apiKey = settings.gemini.apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
        const useProxy = !apiKey;
        const url = useProxy 
          ? `${getApiBase()}/api/gemini-proxy/v1beta/models` 
          : `/proxy/gemini/v1beta/models?key=${apiKey}`;
        const fetchHeaders: Record<string, string> = {};
        if (useProxy) {
          fetchHeaders['X-User-Email'] = getUserEmail();
        }
        const res = await fetch(url, { headers: fetchHeaders });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.models)) {
          return data.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => {
              const id = m.name.replace('models/', '');
              return { id, name: m.displayName || id };
            });
        }
        return [];
      }
      case 'openai': {
        const apiKey = settings.openai.apiKey;
        if (!apiKey) return [];
        const res = await fetch('/proxy/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.data)) {
          return data.data
            .filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3'))
            .map((m: any) => ({ id: m.id, name: m.id }));
        }
        return [];
      }
      case 'claude': {
        const apiKey = settings.claude.apiKey;
        if (!apiKey) return [];
        const res = await fetch('/proxy/claude/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.data)) {
          return data.data.map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id
          }));
        }
        return [];
      }
      case 'grok': {
        const apiKey = settings.grok.apiKey;
        if (!apiKey) return [];
        const res = await fetch('/proxy/grok/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.data)) {
          return data.data.map((m: any) => ({ id: m.id, name: m.id }));
        }
        return [];
      }
      case 'openrouter': {
        const apiKey = settings.openrouter.apiKey;
        const headers: any = {};
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const res = await fetch('/proxy/openrouter/api/v1/models', { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.data)) {
          return data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id
          }));
        }
        return [];
      }
      case 'vertex': {
        return [
          { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
          { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro' },
          { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash' },
          { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro' }
        ];
      }
      default:
        return [];
    }
  } catch (err) {
    console.error(`Failed to fetch models for ${provider}:`, err);
    throw err;
  }
}

export async function generateContentStream(params: GenerationParams): Promise<string> {
  const settings = loadSettings();
  const provider = settings.activeProvider;

  switch (provider) {
    case 'gemini': {
      const apiKey = settings.gemini.apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      const model = settings.gemini.model || 'gemini-2.5-flash';
      
      const useProxy = !apiKey;
      const url = useProxy 
        ? `${getApiBase()}/api/gemini-proxy/v1beta/models/${model}:streamGenerateContent` 
        : `/proxy/gemini/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

      const requestPayload: any = {
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }]
      };

      if (params.systemInstruction) {
        requestPayload.systemInstruction = {
          parts: [{ text: params.systemInstruction }]
        };
      }

      if (params.responseMimeType || params.responseSchema) {
        requestPayload.generationConfig = {};
        if (params.responseMimeType) {
          requestPayload.generationConfig.responseMimeType = params.responseMimeType;
        }
        if (params.responseSchema) {
          requestPayload.generationConfig.responseSchema = params.responseSchema;
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail()
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Proxy Stream Failed (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable.");

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          try {
            let cleanLine = trimmed;
            if (cleanLine.startsWith('[')) cleanLine = cleanLine.substring(1);
            if (cleanLine.startsWith(',')) cleanLine = cleanLine.substring(1);
            if (cleanLine.endsWith(']')) cleanLine = cleanLine.substring(0, cleanLine.length - 1);
            cleanLine = cleanLine.trim();
            if (!cleanLine) continue;

            const chunk = JSON.parse(cleanLine);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullText += text;
              if (params.onChunk) {
                params.onChunk(text);
              }
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        }
      }
      return fullText;
    }

    case 'vertex': {
      const region = settings.vertex.region || 'us-central1';
      const model = settings.vertex.model || 'gemini-2.5-flash';
      
      const useProxy = !settings.vertex.serviceAccountJson;
      let url = '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (useProxy) {
        headers['X-User-Email'] = getUserEmail();
      }

      if (useProxy) {
        url = `${getApiBase()}/api/vertex-proxy/${region}/${model}`;
      } else {
        const { token, projectId } = await getGCPAccessToken(settings.vertex.serviceAccountJson);
        url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent`;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestPayload: any = {
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }]
      };

      if (params.systemInstruction) {
        requestPayload.systemInstruction = {
          parts: [{ text: params.systemInstruction }]
        };
      }

      if (params.responseMimeType || params.responseSchema) {
        requestPayload.generationConfig = {};
        if (params.responseMimeType) {
          requestPayload.generationConfig.responseMimeType = params.responseMimeType;
        }
        if (params.responseSchema) {
          requestPayload.generationConfig.responseSchema = params.responseSchema;
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Direct Generation Failed (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          try {
            const cleanLine = trimmed.startsWith('data:') ? trimmed.substring(5).trim() : trimmed;
            if (cleanLine === '[DONE]') continue;
            
            const chunk = JSON.parse(cleanLine);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullText += text;
              if (params.onChunk) {
                params.onChunk(text);
              }
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        }
      }
      return fullText;
    }

    case 'openai':
    case 'grok':
    case 'openrouter': {
      let url = '';
      let apiKey = '';
      let model = '';

      if (provider === 'openai') {
        url = '/proxy/openai/v1/chat/completions';
        apiKey = settings.openai.apiKey;
        model = settings.openai.model || 'gpt-4o-mini';
        if (!apiKey) throw new Error("OpenAI API key is not configured in Settings.");
      } else if (provider === 'grok') {
        url = '/proxy/grok/v1/chat/completions';
        apiKey = settings.grok.apiKey;
        model = settings.grok.model || 'grok-2-1212';
        if (!apiKey) throw new Error("Grok API key is not configured in Settings.");
      } else if (provider === 'openrouter') {
        url = '/proxy/openrouter/api/v1/chat/completions';
        apiKey = settings.openrouter.apiKey;
        model = settings.openrouter.model || 'google/gemini-2.5-pro';
        if (!apiKey) throw new Error("OpenRouter API key is not configured in Settings.");
      }

      const messages: any[] = [];
      if (params.systemInstruction) {
        messages.push({ role: 'system', content: params.systemInstruction });
      }
      messages.push({ role: 'user', content: params.prompt });

      const payload: any = {
        model,
        messages,
        stream: true
      };

      if (params.responseMimeType === 'application/json') {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Quantum Design'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.toUpperCase()} API Error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response is not readable.");

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.substring(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const chunk = JSON.parse(dataStr);
            const text = chunk.choices?.[0]?.delta?.content || '';
            if (text) {
              fullText += text;
              if (params.onChunk) {
                params.onChunk(text);
              }
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        }
      }
      return fullText;
    }

    case 'claude': {
      const apiKey = settings.claude.apiKey;
      const model = settings.claude.model || 'claude-3-5-sonnet-latest';
      if (!apiKey) throw new Error("Claude API key is not configured in Settings.");

      const messages: any[] = [];
      messages.push({ role: 'user', content: params.prompt });

      const payload: any = {
        model,
        messages,
        max_tokens: 4000,
        stream: true
      };

      if (params.systemInstruction) {
        payload.system = params.systemInstruction;
      }

      const response = await fetch('/proxy/claude/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API Error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response is not readable.");

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const chunk = JSON.parse(dataStr);
              if (chunk.type === 'content_block_delta') {
                const text = chunk.delta?.text || '';
                if (text) {
                  fullText += text;
                  if (params.onChunk) {
                    params.onChunk(text);
                  }
                }
              }
            } catch (e) {
              // Ignore incomplete chunks
            }
          }
        }
      }
      return fullText;
    }

    default:
      throw new Error(`Unknown or unsupported provider: ${provider}`);
  }
}

export async function generateContent(params: GenerationParams): Promise<string> {
  let accumulated = '';
  return await generateContentStream({
    ...params,
    onChunk: (text) => {
      accumulated += text;
    }
  });
}
