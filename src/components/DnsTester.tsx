'use client';

import { useState } from 'react';
import { DOH_PROVIDERS } from '@/lib/providers';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: { name: string; type: number }[];
  Answer?: DnsAnswer[];
  Authority?: DnsAnswer[];
  Additional?: DnsAnswer[];
  Comment?: string;
}

export default function DnsTester() {
  const [domain, setDomain] = useState('google.com');
  const [type, setType] = useState('A');
  const [providerId, setProviderId] = useState(DOH_PROVIDERS[0].id);
  const [manualUrl, setManualUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'PTR', 'SOA'];

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    let apiUrl = `/api/doh/${providerId}?name=${domain}&type=${type}`;
    if (providerId === 'manual') {
      if (!manualUrl) {
        setError('Please enter a valid DoH URL');
        setLoading(false);
        return;
      }
      apiUrl += `&upstream=${encodeURIComponent(manualUrl)}`;
    }

    try {
      const res = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/dns-json',
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json() as DnsResponse;
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve DNS';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-zinc-200/80 p-6 md:p-10">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900">DNS Tester</h2>
      </div>

      <form onSubmit={handleTest} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Domain Name</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all bg-white/50"
              placeholder="example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Record Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all bg-white/50"
            >
              {recordTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700">Upstream Provider</label>
          <div className="flex flex-wrap gap-2">
            {DOH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProviderId(p.id)}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  providerId === p.id
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white/50 text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {providerId === 'manual' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-zinc-700">Custom DoH URL</label>
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all bg-white/50"
              placeholder="https://example.com/dns-query"
              required
            />
            <p className="text-xs text-zinc-500">
              Note: The server must support CORS or be accessible by the proxy.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-zinc-900 text-white font-medium rounded-xl shadow-sm hover:bg-zinc-800 transition-all disabled:opacity-70 disabled:hover:bg-zinc-900 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resolving...</span>
            </>
          ) : (
            <span>Resolve DNS</span>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-8 p-4 rounded-xl bg-red-50/50 border border-red-100 text-red-600 text-sm">
          <p className="font-medium mb-1">Resolution Failed</p>
          <p className="opacity-90">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-zinc-700">Response</h3>
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-mono border",
              result.Status === 0 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              Status: {result.Status}
            </span>
          </div>
          
          <div className="bg-[#111111] rounded-2xl p-5 overflow-x-auto shadow-inner border border-zinc-800">
            <pre className="text-[13px] leading-relaxed font-mono text-zinc-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
