export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  
  // Extract the subpath after /api/gemini-proxy (using _path query param from Vercel rewrite with pathname fallback)
  const pathParam = url.searchParams.get('_path');
  const subpath = pathParam ? ('/' + pathParam) : url.pathname.replace(/^\/api\/gemini-proxy/, '');
  
  // Read key from server side environment variable safely
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server side.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Construct target Gemini URL
  const targetUrl = new URL(`https://generativelanguage.googleapis.com${subpath}`);
  
  // Copy all search params except key and _path
  url.searchParams.forEach((value, key) => {
    if (key !== 'key' && key !== '_path') {
      targetUrl.searchParams.append(key, value);
    }
  });
  
  // Securely append the server-side API key
  targetUrl.searchParams.append('key', apiKey);

  // Prepare headers, filtering out host to avoid proxy mismatch
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    // Return the response, streaming it directly to the browser
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
