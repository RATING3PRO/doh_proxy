import DnsTester from '@/components/DnsTester';
import { DOH_PROVIDERS } from '@/lib/providers';
import { Shield, Globe, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Secure DoH Proxy <span className="text-blue-600">for Everyone</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8">
          A high-performance, multi-upstream DNS over HTTPS proxy running on the edge.
          Protect your privacy and bypass censorship with ease.
        </p>
      </div>

      {/* Tester Section */}
      <div className="mb-20">
        <DnsTester />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        <FeatureCard 
          icon={<Globe className="w-6 h-6 text-indigo-600" />}
          title="Multi-Provider"
          description="Switch between Cloudflare, Google, Quad9, and more instantly."
        />
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-amber-500" />}
          title="Edge Powered"
          description="Deployed on Cloudflare Pages for sub-millisecond global latency."
        />
        <FeatureCard 
          icon={<Shield className="w-6 h-6 text-emerald-500" />}
          title="Privacy First"
          description="No logs, no tracking. Just pure DNS resolution proxying."
        />
      </div>

      {/* Endpoints Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Available Endpoints</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {DOH_PROVIDERS.map((provider) => (
            <div key={provider.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{provider.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">{provider.id}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{provider.description}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2 font-mono text-sm text-slate-600 break-all">
                <span className="select-all">/api/doh/{provider.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-20 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} DoH Proxy. Open Source.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="mb-4 p-2 bg-slate-50 rounded-lg w-fit">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}
