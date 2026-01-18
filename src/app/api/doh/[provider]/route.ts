import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';

export const runtime = 'edge';

// --- Constants & Config ---

const REQUEST_TIMEOUT_MS = 2500; // Upstream timeout (1500ms - 2500ms)
const MAX_QUERY_STRING_LENGTH = 1024;
const ALLOWED_DOMAIN_REGEX = /^[a-zA-Z0-9.-]+$/;

// --- Helpers ---

function getClientIP(req: NextRequest): string {
  // Abstracted IP retrieval - prefer standard headers but don't rely on it for auth
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function isValidDomain(domain: string | null): boolean {
  if (!domain) return true; // If no domain param, skip (e.g. raw DNS message)
  if (domain.length > 253) return false;
  return ALLOWED_DOMAIN_REGEX.test(domain);
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

function logRequest(entry: LogEntry) {
  // Only log if debug enabled or it's an error? 
  // User said "Debug info must be explicitly enabled". 
  // "Minimum config: Duration, Success/Fail, Upstream Name, Status Code" - this implies basic logs might be always on or structured.
  // I'll stick to console.log which is standard for edge runtimes, but wrapped.
  if (process.env.DEBUG_LOG === 'true' || entry.status >= 400) {
    console.log(JSON.stringify(entry));
  }
}

// --- Main Handler ---

function validateRequest(url: URL): NextResponse | null {
  // Validate Query String Length
  if (url.search.length > MAX_QUERY_STRING_LENGTH) {
    return new NextResponse('Query string too long', { status: 414 });
  }

  // Validate Domain Name (if present in 'name' param for JSON API)
  const nameParam = url.searchParams.get('name');
  
  // Strict Validation for 'name' param
  // If name parameter exists (even if empty), it must be valid and non-empty
  if (url.searchParams.has('name')) {
    if (!nameParam || nameParam.length === 0) {
      return new NextResponse('Invalid domain: empty', { status: 400 });
    }
    if (nameParam.length > 253) {
      return new NextResponse('Invalid domain: too long', { status: 400 });
    }
    if (!ALLOWED_DOMAIN_REGEX.test(nameParam)) {
      return new NextResponse('Invalid domain: invalid characters', { status: 400 });
    }
  }
  return null;
}

async function handleDoH(request: NextRequest, providerId: string) {
  const startTime = Date.now();
  let upstreamEndpoint = '';
  let responseStatus = 500;
  
  try {
    // 1. Input Validation
    const url = new URL(request.url);
    const validationError = validateRequest(url);
    if (validationError) {
      responseStatus = validationError.status;
      return validationError;
    }

    // 2. Provider Logic
    const provider = getProvider(providerId);
    if (!provider) {
      responseStatus = 404;
      return new NextResponse(`Provider '${providerId}' not found`, { status: 404 });
    }

    upstreamEndpoint = provider.endpoint;

    // Handle Custom/Manual Overrides
    if (providerId === 'custom') {
      const envUrl = process.env.CUSTOM_DOH_URL;
      if (!envUrl) {
        responseStatus = 500;
        return new NextResponse('Configuration Error: CUSTOM_DOH_URL missing', { status: 500 });
      }
      upstreamEndpoint = envUrl;
    } else if (providerId === 'manual') {
      const manualUrl = url.searchParams.get('upstream');
      if (!manualUrl) {
        responseStatus = 400;
        return new NextResponse('Missing "upstream" parameter', { status: 400 });
      }
      try {
        new URL(manualUrl); // Validate URL syntax
        upstreamEndpoint = manualUrl;
      } catch {
        responseStatus = 400;
        return new NextResponse('Invalid upstream URL', { status: 400 });
      }
    }

    // 3. Prepare Upstream Request
    const upstreamUrl = new URL(upstreamEndpoint);
    
    // Pass through query params for GET, excluding internal ones
    if (request.method === 'GET' || request.method === 'HEAD') {
      url.searchParams.forEach((value, key) => {
        if (key !== 'upstream') { // Don't pass 'upstream' param to the DNS server
           upstreamUrl.searchParams.append(key, value);
        }
      });
    }

    // Consistency Headers
    const headers = new Headers();
    // Force JSON Accept as requested, unless strictly binary? 
    // User requirement: "Explicit Accept: application/dns-json"
    headers.set('Accept', 'application/dns-json'); 
    headers.set('User-Agent', 'Secure-DoH-Proxy/1.0');
    
    // Forward Content-Type if present (e.g. for POST dns-message)
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 4. Fetch with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Handle HEAD method separately to return health status without fetching upstream body
      // But user requested to return health status directly for HEAD requests
      if (request.method === 'HEAD') {
         clearTimeout(timeoutId);
         responseStatus = 204;
         const responseHeaders = new Headers();
         // Strict Cache Control
         responseHeaders.set('Cache-Control', 'no-store, max-age=0');
         responseHeaders.set('Pragma', 'no-cache');
         responseHeaders.set('Expires', '0');
         responseHeaders.set('Vary', 'Accept, Accept-Encoding');
         responseHeaders.set('Access-Control-Allow-Origin', '*');
         
         return new NextResponse(null, {
            status: 204,
            headers: responseHeaders,
         });
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method === 'POST' ? request.body : undefined,
        signal: controller.signal,
        // @ts-expect-error - 'duplex' is needed for Node/Edge streaming
        duplex: 'half', 
      });
      
      clearTimeout(timeoutId);
      responseStatus = upstreamResponse.status;

      // 5. Secure Response Construction
      const responseHeaders = new Headers();
      
      // Strict Cache Control (User Req #1)
      responseHeaders.set('Cache-Control', 'no-store, max-age=0');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');
      responseHeaders.set('Vary', 'Accept, Accept-Encoding');
      
      // CORS
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      // Forward content type
      const respContentType = upstreamResponse.headers.get('content-type');
      if (respContentType) {
        responseHeaders.set('Content-Type', respContentType);
      }

      return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = (fetchError as Error).name === 'AbortError';
      responseStatus = isTimeout ? 504 : 502;
      
      return new NextResponse(
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
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    // 6. Logging (User Req #6)
    logRequest({
      timestamp: new Date().toISOString(),
      clientIp: getClientIP(request),
      provider: providerId,
      durationMs: Date.now() - startTime,
      status: responseStatus,
      upstreamUrl: upstreamEndpoint, // Log the resolved endpoint
      method: request.method
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handleDoH(request, provider);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  return new NextResponse("Unsupported Media Type", { status: 415 });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return handleDoH(request, provider);
}
