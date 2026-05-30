export const config = {
  runtime: 'edge',
};

// --- GOOGLE OAUTH JWT SIGNING FOR VERTEX AI (SERVER SIDE) ---

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

async function getGCPAccessToken(saJsonString: string): Promise<{ token: string; projectId: string }> {
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

export default async function handler(req: Request) {
  const url = new URL(req.url);
  
  // Extract region and model (using query parameters from Vercel rewrite with pathname fallback)
  const regionParam = url.searchParams.get('region');
  const modelParam = url.searchParams.get('model');
  
  let region = 'us-central1';
  let model = 'gemini-2.5-flash';
  
  if (regionParam && modelParam) {
    region = regionParam;
    model = modelParam;
  } else {
    const pathParts = url.pathname.replace(/^\/api\/vertex-proxy\//, '').split('/');
    region = pathParts[0] || 'us-central1';
    model = pathParts[1] || 'gemini-2.5-flash';
  }

  // Read the Service Account JSON securely from the server-side environment variables
  const saJsonString = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
  if (!saJsonString) {
    return new Response(JSON.stringify({ error: 'VERTEX_SERVICE_ACCOUNT_JSON is not configured on the server side.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Authenticate with Google Cloud securely on the server-side
    const { token, projectId } = await getGCPAccessToken(saJsonString);

    // 2. Build Google Cloud Vertex AI stream endpoint
    const targetUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent`;

    // 3. Forward request headers, injecting Authorization Bearer token
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'authorization') {
        headers.set(key, value);
      }
    });
    headers.set('Authorization', `Bearer ${token}`);

    // 4. Post payload to Vertex AI
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    // 5. Stream response back to client browser
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Vertex proxy request failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
