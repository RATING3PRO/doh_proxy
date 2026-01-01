import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';

export const runtime = 'edge'; // Enforce Edge Runtime for Cloudflare Pages

/**
 * Handles DoH requests for a specific provider.
 * Supports both GET (DNS wireformat via base64) and POST (DNS wireformat via body).
 */
async function handleDoH(request: NextRequest, providerId: string) {
  const provider = getProvider(providerId);

  // 1. Validate Provider
  if (!provider) {
    return NextResponse.json(
      { error: `Provider '${providerId}' not found` }, 
      { status: 404 }
    );
  }

  // 2. Determine Upstream Endpoint
  let endpoint = provider.endpoint;
  
  if (providerId === 'custom') {
    const envUrl = process.env.CUSTOM_DOH_URL;
    if (!envUrl) {
      return NextResponse.json(
        { error: 'Server configuration error: CUSTOM_DOH_URL not set' }, 
        { status: 500 }
      );
    }
    endpoint = envUrl;
  }

  try {
    const url = new URL(endpoint);
    
    // 3. Prepare Upstream Request
    
    // For GET requests, forward all search parameters (dns=...)
    if (request.method === 'GET') {
      request.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = new Headers();
    
    // Handle 'Accept' header: Prefer application/dns-message but support dns-json for testing
    const clientAccept = request.headers.get('accept');
    if (clientAccept && clientAccept.includes('application/dns-json')) {
      headers.set('Accept', 'application/dns-json');
    } else {
      headers.set('Accept', 'application/dns-message');
    }
    
    // Forward 'Content-Type' for POST requests (usually application/dns-message)
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 4. Fetch from Upstream
    const upstreamResponse = await fetch(url.toString(), {
      method: request.method,
      headers: headers,
      body: request.method === 'POST' ? request.body : undefined,
      // @ts-expect-error - 'duplex' property is required for streaming bodies in current Node/Edge runtimes
      duplex: 'half', 
    });

    // 5. Prepare Response
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*'); // Enable CORS for web clients
    
    // Forward standard caching and content headers
    const allowedHeaders = ['content-type', 'cache-control', 'expires', 'last-modified', 'vary'];
    allowedHeaders.forEach(h => {
      const val = upstreamResponse.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`DoH Proxy Error [${providerId}]:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
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
  const { provider } = await params;
  return handleDoH(request, provider);
}
