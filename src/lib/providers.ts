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
    endpoint: 'https://dns.google/resolve',
    description: 'Google Public DNS (8.8.8.8)',
  },
  {
    id: 'alidns',
    name: 'AliDNS',
    endpoint: 'https://dns.alidns.com/resolve',
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
    name: 'Custom (Env)',
    endpoint: 'Variable',
    description: 'Via CUSTOM_DOH_URL env',
  },
  {
    id: 'manual',
    name: 'Manual Input',
    endpoint: 'Manual',
    description: 'Enter any DoH URL',
  },
];

export function getProvider(id: string): DoHProvider | undefined {
  return DOH_PROVIDERS.find((p) => p.id === id);
}
