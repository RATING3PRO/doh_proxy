import { getProvider } from './lib/providers';

export interface Env {
  CUSTOM_DOH_URL?: string;
  DEBUG_LOG?: string;
}

// --- Constants & Config ---
const REQUEST_TIMEOUT_MS = 2500; // Upstream timeout
const MAX_QUERY_STRING_LENGTH = 1024;
const ALLOWED_DOMAIN_REGEX = /^[a-zA-Z0-9.-]+$/;

// --- Helpers ---
function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

interface LogEntry {
  timestamp: string;
  clientIp: string;
  provider: string;
  durationMs: number;
  status: number;
  upstreamUrl?: string;
  error?: string;
  method: string;
}

function logRequest(entry: LogEntry, env: Env) {
  if (env.DEBUG_LOG === 'true' || entry.status >= 400) {
    console.log(JSON.stringify(entry));
  }
}

// --- Main Handler ---
function validateRequest(url: URL): Response | null {
  if (url.search.length > MAX_QUERY_STRING_LENGTH) {
    return new Response('Query string too long', { status: 414 });
  }

  const nameParam = url.searchParams.get('name');
  if (url.searchParams.has('dns')) {
    // RFC 8484 GET (base64 dns message)
  } else {
    // JSON API
    if (!nameParam || nameParam.length === 0) {
      return new Response('Invalid domain: empty', { status: 400 });
    }
    if (nameParam.length > 253) {
      return new Response('Invalid domain: too long', { status: 400 });
    }
    if (!ALLOWED_DOMAIN_REGEX.test(nameParam)) {
      return new Response('Invalid domain: invalid characters', { status: 400 });
    }
  }
  return null;
}

async function handleDoH(request: Request, providerId: string, env: Env): Promise<Response> {
  const startTime = Date.now();
  let upstreamEndpoint = '';
  let responseStatus = 500;
  
  try {
    if (request.method === 'HEAD') {
      responseStatus = 200;
      const responseHeaders = new Headers();
      responseHeaders.set('Cache-Control', 'no-store, max-age=0');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');
      responseHeaders.set('Vary', 'Accept, Accept-Encoding');
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      return new Response(null, {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const validationError = validateRequest(url);
    if (validationError) {
      responseStatus = validationError.status;
      return validationError;
    }

    const provider = getProvider(providerId);
    if (!provider) {
      responseStatus = 404;
      return new Response(`Provider '${providerId}' not found`, { status: 404 });
    }

    upstreamEndpoint = provider.endpoint;

    if (providerId === 'custom') {
      const envUrl = env.CUSTOM_DOH_URL;
      if (!envUrl) {
        responseStatus = 500;
        return new Response('Configuration Error: CUSTOM_DOH_URL missing', { status: 500 });
      }
      upstreamEndpoint = envUrl;
    } else if (providerId === 'manual') {
      const manualUrl = url.searchParams.get('upstream');
      if (!manualUrl) {
        responseStatus = 400;
        return new Response('Missing "upstream" parameter', { status: 400 });
      }
      try {
        new URL(manualUrl);
        upstreamEndpoint = manualUrl;
      } catch {
        responseStatus = 400;
        return new Response('Invalid upstream URL', { status: 400 });
      }
    }

    const upstreamUrl = new URL(upstreamEndpoint);
    
    if (request.method === 'GET') {
      url.searchParams.forEach((value, key) => {
        if (key !== 'upstream') {
           upstreamUrl.searchParams.append(key, value);
        }
      });
    }

    const headers = new Headers();
    headers.set('Accept', 'application/dns-json'); 
    headers.set('User-Agent', 'Secure-DoH-Proxy-Worker/1.0');
    
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method === 'POST' ? request.body : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      responseStatus = upstreamResponse.status;

      const responseHeaders = new Headers();
      responseHeaders.set('Cache-Control', 'no-store, max-age=0');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');
      responseHeaders.set('Vary', 'Accept, Accept-Encoding');
      responseHeaders.set('X-DoH-Proxy-Version', 'v1.1.0-worker');
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      const respContentType = upstreamResponse.headers.get('content-type');
      if (respContentType) {
        responseHeaders.set('Content-Type', respContentType);
      }

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = (fetchError as Error).name === 'AbortError';
      responseStatus = isTimeout ? 504 : 502;
      
      return new Response(
        JSON.stringify({ error: isTimeout ? 'Upstream Timeout' : 'Upstream Connection Failed' }),
        { 
          status: responseStatus,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (err) {
    console.error('Internal Error:', err);
    responseStatus = 500;
    return new Response('Internal Server Error', { status: 500 });
  } finally {
    logRequest({
      timestamp: new Date().toISOString(),
      clientIp: getClientIP(request),
      provider: providerId,
      durationMs: Date.now() - startTime,
      status: responseStatus,
      upstreamUrl: upstreamEndpoint,
      method: request.method
    }, env);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected route: /api/doh/:provider
    if (pathParts[0] === 'api' && pathParts[1] === 'doh' && pathParts.length >= 3) {
      const providerId = pathParts[2];
      return handleDoH(request, providerId, env);
    }
    
    if (url.pathname === '/') {
      return new Response('Secure DoH Proxy Worker is running.', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
};
