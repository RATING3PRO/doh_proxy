'use client';

import { useState } from 'react';
import { DOH_PROVIDERS } from '@/lib/providers';
import { Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 md:p-8">
      <div className="flex items-center space-x-2 mb-6">
        <Search className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800">DNS Resolution Tester</h2>
      </div>

      <form onSubmit={handleTest} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Domain Name</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Record Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              {recordTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Upstream Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {DOH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProviderId(p.id)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border text-left",
                  providerId === p.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {providerId === 'manual' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-slate-600">Custom DoH URL</label>
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="https://example.com/dns-query"
              required
            />
            <p className="text-xs text-slate-500">
              Note: The server must support CORS or be accessible by the proxy.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Resolving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Resolve DNS</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Resolution Failed</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Result</h3>
            <span className={clsx(
              "px-2 py-1 rounded text-xs font-mono",
              result.Status === 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            )}>
              Status: {result.Status}
            </span>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto shadow-inner">
            <pre className="text-xs md:text-sm font-mono text-emerald-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
