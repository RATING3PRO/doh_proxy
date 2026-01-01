export interface DoHProvider {
  id: string;
  name: string;
  endpoint: string;
  description: string;
}

export const DOH_PROVIDERS: DoHProvider[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    endpoint: 'https://cloudflare-dns.com/dns-query',
    description: 'Privacy-first, fast DNS resolver (1.1.1.1)',
  },
  {
    id: 'google',
    name: 'Google',
    endpoint: 'https://dns.google/dns-query',
    description: 'Google Public DNS (8.8.8.8)',
  },
  {
    id: 'quad9',
    name: 'Quad9',
    endpoint: 'https://dns9.quad9.net:5053/dns-query',
    description: 'Security-focused DNS (9.9.9.9)',
  },
  {
    id: 'alidns',
    name: 'AliDNS',
    endpoint: 'https://dns.alidns.com/dns-query',
    description: 'Alibaba Cloud DNS (223.5.5.5)',
  },
  {
    id: 'dnspod',
    name: 'DNSPod',
    endpoint: 'https://doh.pub/dns-query',
    description: 'Tencent Cloud DNS (119.29.29.29)',
  },
  {
    id: 'custom',
    name: 'Custom',
    endpoint: 'Variable',
    description: 'Custom DoH via CUSTOM_DOH_URL env',
  },
];

export function getProvider(id: string): DoHProvider | undefined {
  return DOH_PROVIDERS.find((p) => p.id === id);
}
